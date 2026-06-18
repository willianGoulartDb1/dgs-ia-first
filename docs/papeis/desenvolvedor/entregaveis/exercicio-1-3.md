# Pipeline RAG — Protótipo NovaTech

**Autor:** Willian Goulart  
**Data:** 2026-06-05  
**Base documental:** `docs/fonte-da-verdade/` (5 arquivos)

---

## Decisões de Arquitetura

**Stack escolhida:** Python + ChromaDB + sentence-transformers (all-MiniLM-L6-v2). Sem LangChain — implementei cada etapa manualmente para entender o que acontece em cada camada.

**Estratégia de chunking:** Híbrida — texto corrido dividido por parágrafo com overlap de 50 tokens; tabelas Markdown preservadas inteiras (nunca quebrar uma tabela ao meio). Limite de 500 tokens por chunk.

**Por que proteger tabelas:** As tabelas do PROC-042 e SLA-2024 contêm dados numéricos críticos. Cortar uma tabela no meio pode separar o cabeçalho dos dados — o LLM receberia "1.3, 1.1, 1.8" sem saber que são multiplicadores regionais.

---

## Script 1: Ingestão (`ingestao.py`)

```python
"""
Ingestão de documentos NovaTech em ChromaDB.
Usa sentence-transformers para embeddings locais (gratuito).
"""

import os
import re
import chromadb
from sentence_transformers import SentenceTransformer

PASTA_DOCS = "docs/fonte-da-verdade"
MODELO_EMBED = "all-MiniLM-L6-v2"
MAX_CHUNK_TOKENS = 500
OVERLAP_TOKENS = 50

modelo = SentenceTransformer(MODELO_EMBED)
cliente = chromadb.PersistentClient(path="./chroma_db")


def detectar_blocos(texto: str) -> list[dict]:
    """
    Separa texto em blocos de 'tabela' e 'texto'.
    Tabelas Markdown (linhas começando com |) são mantidas inteiras.
    """
    linhas = texto.split("\n")
    blocos = []
    buf_tabela = []
    buf_texto = []

    for linha in linhas:
        if re.match(r"^\s*\|", linha):
            if buf_texto:
                blocos.append({"tipo": "texto", "conteudo": "\n".join(buf_texto)})
                buf_texto = []
            buf_tabela.append(linha)
        else:
            if buf_tabela:
                blocos.append({"tipo": "tabela", "conteudo": "\n".join(buf_tabela)})
                buf_tabela = []
            buf_texto.append(linha)

    if buf_tabela:
        blocos.append({"tipo": "tabela", "conteudo": "\n".join(buf_tabela)})
    if buf_texto:
        blocos.append({"tipo": "texto", "conteudo": "\n".join(buf_texto)})

    return [b for b in blocos if b["conteudo"].strip()]


def chunk_texto(texto: str, max_tokens=MAX_CHUNK_TOKENS, overlap=OVERLAP_TOKENS):
    """Divide texto corrido em chunks por parágrafo com overlap."""
    paragrafos = [p.strip() for p in texto.split("\n\n") if p.strip()]
    chunks = []
    atual = ""

    for p in paragrafos:
        if len(atual.split()) + len(p.split()) <= max_tokens:
            atual = (atual + "\n\n" + p).strip()
        else:
            if atual:
                chunks.append(atual)
                palavras_overlap = atual.split()[-overlap:]
                atual = " ".join(palavras_overlap) + "\n\n" + p
            else:
                atual = p

    if atual:
        chunks.append(atual)
    return chunks


def processar_documento(caminho: str) -> list[dict]:
    """Processa um .md e retorna chunks com metadados."""
    nome = os.path.basename(caminho)
    with open(caminho, "r", encoding="utf-8") as f:
        texto = f.read()

    blocos = detectar_blocos(texto)
    resultado = []

    for i, bloco in enumerate(blocos):
        if bloco["tipo"] == "tabela":
            resultado.append({
                "texto": bloco["conteudo"], "fonte": nome,
                "tipo": "tabela", "bloco_index": i
            })
        else:
            for j, sub in enumerate(chunk_texto(bloco["conteudo"])):
                resultado.append({
                    "texto": sub, "fonte": nome,
                    "tipo": "texto", "bloco_index": i, "sub_index": j
                })
    return resultado


def ingerir_documentos():
    """Pipeline principal."""
    try:
        cliente.delete_collection("novatech-docs")
    except Exception:
        pass
    colecao = cliente.create_collection(
        "novatech-docs", metadata={"hnsw:space": "cosine"}
    )

    arquivos = sorted([
        os.path.join(PASTA_DOCS, f) for f in os.listdir(PASTA_DOCS) if f.endswith(".md")
    ])

    todos = []
    for arq in arquivos:
        chunks = processar_documento(arq)
        todos.extend(chunks)
        print(f"  {os.path.basename(arq)}: {len(chunks)} chunks")

    print(f"\nTotal: {len(todos)} chunks")

    for idx, chunk in enumerate(todos):
        nome_base = chunk["fonte"].replace(".md", "").replace("-", "_")[:30]
        chunk_id = f"{nome_base}_b{chunk['bloco_index']}_c{idx:04d}"
        embedding = modelo.encode(chunk["texto"]).tolist()

        colecao.add(
            documents=[chunk["texto"]],
            embeddings=[embedding],
            metadatas=[{"fonte": chunk["fonte"], "tipo": chunk["tipo"],
                       "bloco_index": chunk["bloco_index"]}],
            ids=[chunk_id]
        )

    print(f"ChromaDB: {colecao.count()} chunks armazenados.")


if __name__ == "__main__":
    ingerir_documentos()
```

**Saída:**
```
  FAQ-atendimento.md: 11 chunks
  POL-001-politica-devolucao.md: 9 chunks
  PROC-042-frete-especial-v1.md: 5 chunks
  PROC-042-v2-frete-especial-revisado.md: 6 chunks
  SLA-2024-tabela-sla-clientes.md: 7 chunks

Total: 38 chunks
ChromaDB: 38 chunks armazenados.
```

> **Copilot:** A função `detectar_blocos()` foi sugerida pelo Copilot ao digitar o comentário sobre detecção de tabelas Markdown. O regex `r"^\s*\|"` e a lógica de buffer duplo foram completion do Copilot, validada manualmente.

---

## Script 2: Busca Semântica (`busca.py`)

```python
"""Busca semântica no ChromaDB da NovaTech."""

import chromadb
from sentence_transformers import SentenceTransformer

modelo = SentenceTransformer("all-MiniLM-L6-v2")
cliente = chromadb.PersistentClient(path="./chroma_db")
colecao = cliente.get_collection("novatech-docs")

N_RESULTADOS = 4    # Equilíbrio entre cobertura e ruído
SCORE_MINIMO = 0.35  # Abaixo disso: irrelevante nos testes


def buscar_chunks(pergunta: str, n=N_RESULTADOS) -> list[dict]:
    """Retorna chunks ordenados por similaridade coseno."""
    embedding = modelo.encode(pergunta).tolist()
    resultado = colecao.query(
        query_embeddings=[embedding], n_results=n,
        include=["documents", "metadatas", "distances"]
    )

    chunks = []
    for texto, meta, dist in zip(
        resultado["documents"][0], resultado["metadatas"][0], resultado["distances"][0]
    ):
        score = 1 - dist
        if score >= SCORE_MINIMO:
            chunks.append({
                "texto": texto, "fonte": meta["fonte"],
                "tipo": meta.get("tipo", "texto"), "score": round(score, 4)
            })

    return sorted(chunks, key=lambda c: c["score"], reverse=True)
```

**Parâmetros justificados:**
- **N=4:** N=3 perdia contexto em perguntas cruzadas (SLA + penalidades). N=5 trazia ruído em perguntas diretas. N=4 foi o equilíbrio observado nos testes.
- **Threshold 0.35:** Chunks abaixo desse valor eram consistentemente irrelevantes — o ChromaDB retornava matches por volume de palavras compartilhadas, não por semântica.

---

## Script 3: Montagem do Prompt (`montagem_prompt.py`)

```python
"""Montagem do prompt RAG completo."""

from busca import buscar_chunks

SYSTEM_PROMPT = """Você é o Assistente de Suporte da NovaTech Logística.
Responda APENAS com base nos documentos fornecidos abaixo.
NUNCA invente prazos, valores ou informações não presentes nos documentos.
Se não encontrar, diga explicitamente e sugira escalação.
Sempre cite documento/seção na resposta.
Se houver contradição entre documentos, aponte e oriente confirmar com o Comercial.
Tom: formal, objetivo, português."""


def montar_prompt(pergunta: str, chunks: list[dict]) -> dict:
    contexto = "=== DOCUMENTOS RELEVANTES ===\n\n"
    for i, c in enumerate(chunks, 1):
        contexto += f"[Fonte {i}: {c['fonte']} | Score: {c['score']:.3f}]\n{c['texto']}\n\n"
    contexto += "=== FIM DOS DOCUMENTOS ==="

    user = f"{contexto}\n\nPergunta: {pergunta}"
    return {
        "system": SYSTEM_PROMPT,
        "user": user,
        "prompt_completo": f"[SYSTEM]\n{SYSTEM_PROMPT}\n\n[USER]\n{user}"
    }


def pipeline_rag(pergunta: str, n=4) -> dict:
    """Pipeline completo: busca → montagem → retorno."""
    chunks = buscar_chunks(pergunta, n=n)
    prompt = montar_prompt(pergunta, chunks)
    return {"pergunta": pergunta, "chunks_recuperados": chunks, "prompt": prompt}
```

---

## Testes: 5 Perguntas com Gabarito

### P1: Penalidades por descumprimento de SLA Gold

| Rank | Fonte | Score |
|--|--|--|
| 1 | SLA-2024 (seção 4 — penalidades) | 0.812 |
| 2 | SLA-2024 (tabela de métricas) | 0.774 |
| 3 | FAQ item 41 | 0.521 |
| 4 | SLA-2024 (seção 5 — medição) | 0.489 |

**Gabarito:** seção 4 + tabela de métricas ✅ recuperados nos ranks 1-2.

**Resposta do Claude:** Descreveu corretamente as penalidades escalonadas (1ª violação: registro; 2ª: crédito 5%; 3ª+: crédito 10% + reunião obrigatória para Gold). Citou SLA-2024 seções 2 e 4. ✅

---

### P2: Devolução de carga perigosa classe 2

| Rank | Fonte | Score |
|--|--|--|
| 1 | POL-001 seção 3.2 (exceções) | 0.847 |
| 2 | POL-001 seção 3.3 (procedimento) | 0.791 |
| 3 | FAQ item 3 (carga perigosa) | 0.683 |

**Gabarito:** POL-001 seção 3.2 + FAQ item 3. ✅

**Resposta do Claude:** Identificou que gases classe 2 ANTT não são elegíveis para devolução padrão. Orientou contato com Gestão de Riscos (ramal 4500). Mencionou que o FAQ registra exceções autorizadas caso a caso. ✅

---

### P3: Multiplicador Nordeste — documentos contraditórios

| Rank | Fonte | Score |
|--|--|--|
| 1 | PROC-042-v2 (tabela) | 0.889 |
| 2 | PROC-042-v1 (tabela) | 0.881 |
| 3 | FAQ item 8 | 0.612 |
| 4 | PROC-042-v2 seção 5 (transição) | 0.544 |

**Gabarito:** ambas as tabelas + disposições transitórias. ✅

**Resposta do Claude:** Identificou a contradição (v1: 1.4, v2: 1.5), apresentou tabela comparativa, aplicou regra de transição da seção 5 (chamados a partir de 01/12/2023 usam v2). Recomendou confirmar com Comercial para contratos antigos. ✅

**Observação:** Scores muito próximos (0.889 vs 0.881) para documentos contraditórios. Se o threshold fosse 0.60, as Disposições Transitórias (0.544) não entrariam — problema real identificado.

---

### P4: Despacho internacional (lacuna documental)

| Rank | Fonte | Score |
|--|--|--|
| 1 | FAQ item 32 | 0.412 |
| 2 | POL-001 seção 2 | 0.389 |
| 3 | PROC-042-v2 seção 4 | 0.351 |

**Gabarito:** não existe documento sobre despacho internacional na base.

**Resposta do Claude:** Reconheceu que nenhum documento cobre o tema. Listou os documentos consultados. Sugeriu contato com Comercial ou Compliance. ✅ (guardrail funcionou)

---

### P5: SLA Silver — incidente crítico + penalidades

| Rank | Fonte | Score |
|--|--|--|
| 1 | SLA-2024 (tabela) | 0.831 |
| 2 | SLA-2024 (seção 3 — incidente crítico) | 0.797 |
| 3 | SLA-2024 (seção 4 — penalidades) | 0.776 |

**Gabarito:** tabela + seção 3 + seção 4. ✅

**Resposta do Claude:** SLA Silver para incidente crítico: resposta 1h, resolução 8h. Penalidades: 1º descumprimento sem impacto; 2º com crédito de 5%. Observou que 2 chamados não atingem o threshold de 5 para incidente crítico automático. ✅

---

### Consolidação

| # | Pergunta | Chunks OK? | Resposta OK? | Fonte citada? | Guardrails? |
|--|--|--|--|--|--|
| P1 | Penalidades SLA Gold | ✅ | ✅ | ✅ | ✅ |
| P2 | Devolução carga perigosa | ✅ | ✅ | ✅ | ✅ |
| P3 | Multiplicador contraditório | ✅ | ✅ | ✅ | ✅ |
| P4 | Despacho internacional | ❌ (sem doc) | ✅ | ✅ | ✅ |
| P5 | SLA Silver incidente | ✅ | ✅ | ✅ | ✅ |

> P4 marca ❌ na recuperação não por falha do pipeline, mas porque o documento simplesmente não existe na base.

---

## Problemas Identificados e Correções

### Problema 1: Documentos contraditórios sem hierarquia no retrieval

**Observado em:** P3 — PROC-042 v1 e v2 com scores quase idênticos (0.889 vs 0.881). As Disposições Transitórias (regra de desempate) só entraram por margem apertada (score 0.544, threshold 0.35).

**Por que é grave:** Com threshold um pouco mais alto, a regra de transição não entraria no contexto e o LLM teria que escolher entre dois valores sem critério.

**Correção proposta:** Enrichment de metadados: `{"versao": "2.0", "substitui": "PROC-042-v1", "vigente_a_partir": "2023-12-01"}`. No pós-processamento da busca, quando dois chunks vêm do mesmo documento base (família PROC-042), promover automaticamente a versão mais recente e incluir sempre o chunk de disposições transitórias.

---

### Problema 2: Perguntas legítimas sem cobertura documental

**Observado em:** P4 — despacho internacional é pergunta razoável para uma transportadora, mas a base não cobre.

**Por que importa:** O guardrail funciona (não aluciou), mas o assistente é inútil para essa classe de perguntas. Se 20% das perguntas reais caírem nessa categoria, a percepção de valor cai.

**Correção proposta:** Módulo de log automático para perguntas com score médio < 0.45. Gerar fila semanal de "perguntas sem cobertura" para o curador da base identificar quais documentos precisam ser adicionados.

---

### Problema 3: FAQ informal competindo com documentos normativos

**Observado em:** P1, P2, P3, P5 — o FAQ aparece no top-4 em quase todas as buscas com scores entre 0.52 e 0.68.

**Por que é grave:** O FAQ usa linguagem coloquial (alta similaridade com queries naturais) mas não foi validado por Compliance. Se contradiz um documento normativo, o LLM pode dar peso igual a ambos.

**Correção proposta:** Metadado `confiabilidade: normativo|informal` por documento. No `montar_prompt`, ordenar normativos antes de informais. No system prompt: "Documentos marcados como informal podem estar desatualizados. Quando normativo contradiz informal, use o normativo."

---

## Reflexão Final

**O que aprendi sobre RAG:** Não é "jogar documentos num banco vetorial e fazer busca". O trabalho real está na preparação: qualidade do chunking → qualidade da recuperação → qualidade da resposta. O gargalo mais crítico não é o modelo nem os embeddings — é a governança da base documental. PROC-042 v1 e v2 coexistindo sem hierarquia é um problema organizacional, não tecnológico.

**RAG é engenharia de dados ou chamada de API?** Engenharia de dados, sem dúvida. A chamada ao LLM é uma linha de código. O trabalho está em como os dados entram (chunking, embeddings, metadados), como são recuperados (parâmetros, thresholds), e como são apresentados ao modelo (ordem, formatação, prompt). Equipes que tratam RAG como integração de API produzem assistentes que alucinam.

**Próximo passo para produção:** Golden dataset com 20-30 pares (pergunta, resposta esperada) executado automaticamente a cada mudança na base. Um LLM-as-Judge avaliando precisão, citação, conformidade e tom. Isso cria um gate de qualidade que impede que atualizações documentais degradem o assistente sem ninguém perceber.
