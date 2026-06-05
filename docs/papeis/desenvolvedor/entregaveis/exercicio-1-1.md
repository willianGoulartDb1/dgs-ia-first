# Viabilidade Técnica — Assistente RAG NovaTech

**Autor:** Willian Goulart  
**Papel:** Desenvolvedor  
**Data:** 2026-06-05

---

## 1. Diagnóstico por Formato de Documento

A viabilidade do RAG depende menos do modelo e mais de como os dados chegam ao índice. Cada formato da NovaTech tem armadilhas diferentes.

### SharePoint: PDFs com Tabelas (800 documentos)

As tabelas de frete do PROC-042 têm 15+ colunas com relacionamentos bidimensionais — região na linha, multiplicador na coluna. Parsers como pdfplumber ou PyMuPDF linearizam isso, destruindo a estrutura: `Sul 1.2 1.3 Sudeste 1.0 1.1...` vira um bloco sem semântica.

O problema é agravado pela coexistência de PROC-042 v1 e v2 com valores diferentes no mesmo SharePoint, sem indicação de vigência. Se ambos forem indexados, o retrieval pode recuperar o multiplicador errado.

**Abordagem:** Camelot para tabelas com bordas, conversão para Markdown/JSON preservando cabeçalhos. Embutir versão no chunk: `[PROC-042-v2][tabela:multiplicadores-regionais]` com campo `version_status: active|deprecated`.

### SharePoint: PDFs Escaneados

Documentos digitalizados exigem OCR. Taxa de erro varia com qualidade do scan — `1` vira `l`, `0` vira `O`. Campos numéricos corrompidos (SLAs, percentuais) geram respostas factualmente erradas sem detecção.

**Abordagem:** Tesseract com threshold ≥85% ou Azure Document Intelligence. Score de confiança como metadado — chunks <75% excluídos do retrieval por padrão. Pós-processamento com dicionário de domínio logístico (CT-e, ANTT, SLA).

### Confluence: Wiki com Links Internos (400 páginas)

A FAQ referencia "veja SLA-2024" sem conteúdo inline. Se o chunk da FAQ for recuperado sem o SLA, o LLM recebe referência sem contexto — e pode alucinar o conteúdo. Macros customizadas não renderizam em export de texto, gerando lacunas invisíveis.

**Abordagem:** Resolver links no momento do chunking (substituir referência pelo conteúdo resumido). Macros não interpretadas: substituir por placeholder descritivo. Criar grafo de dependências entre páginas para incluir chunks linkados com penalidade de relevância.

### Pasta de Rede: Planilhas (~50 arquivos)

Fórmulas como `=VLOOKUP(A2,'Tabela Frete'!A:C,2,FALSE)` são inúteis semanticamente. Valores calculados são dinâmicos — mudam sem que o documento seja "atualizado" no índice.

**Abordagem:** Indexar apenas valores calculados, nunca fórmulas. Separar dados estáticos (tabelas de referência) de dinâmicos (volumes operacionais). Dados dinâmicos: integrar via API do sistema transacional ao invés de indexar planilha. Timestamp de extração + invalidação automática após N dias.

---

## 2. Dimensionamento da Base

### Estimativa de Volume

| Fonte | Cálculo | Palavras | Tokens (~1.33x) |
|-------|---------|----------|-----------------|
| PDFs | 800 × 10 pág × 210 palavras/pág (ajustado: 60% texto + 40% tabela) | 1.680.000 | ~2.240.000 |
| Confluence | 400 × 1.500 palavras/pág | 600.000 | ~800.000 |
| Planilhas | 50 × 200 células × 5 palavras/célula | 50.000 | ~67.000 |
| **Total** | | **2.330.000** | **~3.107.000** |

### O que isso implica

A base completa (~3,1M tokens) é **24x maior** que a context window do GPT-4o (128K). RAG seletivo é obrigatório — não dá para jogar tudo no contexto.

Por outro lado, 3,1M tokens é gerenciável com um único índice vetorial (limite prático para índice sem sharding: ~50M). Custo de indexação com ada-002: ~$0,31 total. **Viável financeiramente.**

Atualização: PDFs mudam raramente (versionamento SharePoint), Confluence muda frequentemente. Estratégia de re-index incremental por data de modificação.

---

## 3. Contexto: Quanto Cabe por Pergunta

### Cálculo de Espaço

```
Context window (GPT-4o):        128.000 tokens
System prompt + guardrails:      -2.000
Query do usuário:                  -500
Buffer para resposta:            -2.000
───────────────────────────────────────
Disponível para chunks:        123.500 tokens
```

Com chunks de 500 tokens: até **247 chunks** por query. Mas usar 247 chunks na prática seria péssimo — a maioria seria ruído e o efeito "lost in the middle" degradaria a qualidade.

### Na Prática: Menos é Mais

O modelo processa melhor informação no início e no fim do contexto. Com 247 chunks, um chunk na posição 120 tem chance significativamente menor de influenciar a resposta.

**Mitigação:** Re-ranquear chunks por relevância e posicionar os melhores no início/fim. Chunks de menor relevância no meio. E mais importante: usar 3-8 chunks por query (não 247) dependendo do tipo de pergunta.

### Trade-offs

| Tamanho do Chunk | Cabem no contexto | Cobertura da base | Risco |
|--|--|--|--|
| 250 tokens | ~494 | ~8% | Alta fragmentação |
| 500 tokens | ~247 | ~4% | Equilíbrio padrão |
| 1.000 tokens | ~123 | ~2% | Contexto rico mas pouca diversidade |

---

## 4. Como Dividir os Documentos (Chunking)

A decisão de chunking não pode ser "tamanho fixo" porque cada tipo de pergunta precisa de um tipo diferente de contexto.

### Para perguntas diretas ("Qual o multiplicador do Nordeste?")

Chunks de **150-250 tokens**. Uma linha de tabela com cabeçalho contextualizado. Exemplo: `[PROC-042-v2][tabela:multiplicadores] Nordeste: 1.5`. Chunks pequenos mas focados — a resposta está em um dado único.

### Para perguntas de procedimento ("Como processar uma devolução?")

Chunks de **300-500 tokens**. Uma seção numerada completa (5 passos do procedimento). Fragmentar um procedimento em 5 chunks separados obriga o LLM a reordenar — risco de omissão ou inversão de passos.

### Para comparações ("Diferença entre PROC-042 v1 e v2?")

Chunks de **200-350 tokens** por versão, separados. Se v1 e v2 estiverem no mesmo chunk, o LLM pode confundir valores. Chunks separados com metadados de versão permitem comparação lado a lado.

### Para perguntas amplas ("Situação geral dos SLAs?")

Chunks de **600-1.000 tokens**. Menos chunks de maior qualidade. O top-5 mais relevante nas primeiras posições do contexto.

---

## 5. Viável? Sim, com Ressalvas

A base de ~3,1M tokens cabe em um único índice vetorial sem sharding. O GPT-4o com 128K de context window suporta até 247 chunks por query, cobrindo a maioria dos cenários da NovaTech.

### O que precisa resolver antes de produção

| # | Risco | Severidade | O que fazer |
|---|-------|-----------|-------------|
| 1 | PROC-042 v1 e v2 coexistindo sem hierarquia | **Alta** | Definir vigência antes da indexação — risco de cobrança errada de frete |
| 2 | FAQ informal não validada por Compliance | **Alta** | Indexar com metadado `source_type: informal` + aviso na resposta |
| 3 | PDFs escaneados com OCR de baixa qualidade | **Média** | Score de confiança; excluir chunks <75% |
| 4 | Planilhas com dados dinâmicos | **Média** | Não indexar dados operacionais; conectar via API |
| 5 | Links internos do Confluence não resolvidos | **Baixa** | Resolver referências durante o chunking |

### Próximos Passos

1. **Agora:** Definir com Operações qual PROC-042 está ativo
2. **Semana 1:** Prototipar extração de tabelas do PROC-042-v2
3. **Semana 2:** Pipeline de OCR com score de confiança nos PDFs críticos
4. **Semana 3:** Índice piloto com os 5 documentos da fonte-da-verdade

---

## 6. Processo de Iteração com Claude

**Feedback 1:** A estimativa original usava 100 células/planilha. O retorno apontou que planilhas corporativas tipicamente têm 200+ células semânticas. Ajustado: 200 × 5 palavras = 50.000 palavras (impacto de ~0,5% no total, mas mais realista).

**Feedback 2:** Faltava análise de custo de indexação. Adicionada: ~$0,31 com ada-002 para toda a base. Viável.

**Feedback 3:** O risco de documentos conflitantes estava enterrado na seção de fontes. Movido para posição 1 na tabela de riscos — é o cenário com maior potencial de dano real (cobrança errada de frete).
