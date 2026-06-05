# Prototipação de Prompt — Assistente NovaTech

**Autor:** Willian Goulart  
**Data:** 2026-06-05  
**Projeto:** NovaTech — Assistente de Suporte Logístico  
**LLM de teste:** Claude Sonnet 4.6

---

## Abordagem

Este exercício segue um ciclo de 4 passos: (1) escrever o prompt, (2) mapear o que é fixo e o que muda, (3) testar com perguntas reais e identificar falhas, (4) corrigir e re-testar. O objetivo não é criar o prompt perfeito de primeira — é demonstrar que sei identificar o que não funciona e por quê.

---

## Passo 1: System Prompt v1

```
# Assistente de Suporte NovaTech v1

## Identidade
Você é o Assistente de Suporte da NovaTech, especializado em logística.
Responde consultas sobre devoluções, SLAs e fretes usando APENAS a documentação
fornecida nos chunks.

## Regras Invioláveis

### Citação de fonte — sempre
Toda resposta DEVE citar: código do documento + seção.
Formato: "(Fonte: [CÓDIGO], [seção])"

### Proibição de invenção
NUNCA inventar prazos, valores ou multiplicadores ausentes dos chunks.
Se faltam dados para um cálculo, forneça o que tem e diga o que falta.

### Quando não sabe
Dizer: "Não encontrei na documentação disponível."
Sugerir: "Recomendo escalar para o supervisor."

### Tom
Português formal e acessível. Máximo 3-4 parágrafos. Bullet points para listas.

## Como usar os chunks
Chunks são trechos de documentação recuperados por relevância.
- Use SOMENTE informações dos chunks
- Integre múltiplos chunks quando relevante, citando cada fonte
- Chunks mais específicos têm precedência sobre genéricos

## Casos especiais
- Se o chunk mencionar exceção ("exceto", "salvo"), inclua na resposta
- Se dois chunks se contradizem, cite ambos e sugira escalação
```

---

## Passo 2: O que é Fixo vs. o que Muda

Num sistema RAG em produção, parte do contexto é igual em toda query (estática) e parte muda a cada pergunta (dinâmica). Entender essa divisão é o que permite gerenciar o orçamento de tokens.

**Parte fixa (estática) — ~720 tokens:**

| Componente | Tokens | Muda quando? |
|--|--|--|
| Identidade + regras | ~370 | Versão do prompt |
| Instruções de chunk | ~150 | Raramente |
| Formato + casos especiais | ~200 | Raramente |

**Parte variável (dinâmica) — ~1.350 tokens no caso típico:**

| Componente | Tamanho | Depende de |
|--|--|--|
| Chunks recuperados | 3 × 300 = 900 tokens | Pergunta + similaridade |
| Dados do cliente | ~100 tokens | Contexto do chamado |
| Histórico de conversa | ~300 tokens (3 turnos) | Duração da sessão |
| Pergunta do usuário | ~50 tokens | Complexidade |

**Orçamento total:**
- Claude Sonnet 4.6 (200K tokens): ~195.930 tokens disponíveis além do fixo+dinâmico — folga enorme
- GPT-4o (128K tokens): ~123.930 tokens disponíveis — suficiente para ~248 chunks de 500 tokens

**Se o orçamento estoura, o que cortar (em ordem):**
1. Histórico de conversa — truncar para últimas 5 mensagens
2. Número de chunks — reduzir de 5 para 3
3. Dados do cliente — resumir para campos essenciais
4. **Nunca cortar:** system prompt e query atual

---

## Passo 3: Testes com Prompt v1

**Setup:** Claude Sonnet 4.6, conversa nova isolada. System prompt v1 + 3 chunks fornecidos como contexto:

```
Chunk A - POL-001: "Política de Devolução POL-001, seção 3.2: Mercadorias podem ser
devolvidas em até 7 dias úteis após o recebimento, exceto cargas classificadas como
perigosas (classes 1 a 6 da ANTT). O cliente deve abrir chamado no portal e anexar
fotos da mercadoria."

Chunk B - SLA-2024: "Tabela SLA-2024: Cliente Gold — resposta em até 2h, resolução
em até 24h. Cliente Silver — resposta em até 4h, resolução em até 48h. Cliente
Standard — resposta em até 8h, resolução em até 72h."

Chunk C - PROC-042-v2: "PROC-042-v2, seção 2: Frete especial para cargas acima de
500kg: valor base × multiplicador regional. Região Sul: 1.3. Região Sudeste: 1.1.
Região Norte: 1.8. Região Nordeste: 1.5. Região Centro-Oeste: 1.4."
```

### Teste 1: "Qual o prazo de devolução para carga perigosa?"

**Resposta v1:**
> O prazo de devolução padrão é de **7 dias úteis** após o recebimento.
> - O cliente deve abrir chamado no portal
> - Deve anexar fotos da mercadoria
> (Fonte: POL-001, seção 3.2)

**Diagnóstico:** ❌ **ERRO GRAVE.** O assistente ignorou completamente que cargas perigosas (classes 1-6 ANTT) NÃO podem ser devolvidas. A exceção está no mesmo chunk — o modelo leu a regra geral e parou antes da restrição.

**Causa raiz:** A instrução sobre exceções está no final do prompt (seção "Casos especiais"), com linguagem suave ("inclua na resposta"). O modelo aplicou a regra geral sem ativar a regra de exceção — problema de **posição e saliência**.

### Teste 2: "Meu cliente é Gold, qual o SLA de resolução?"

**Resposta v1:**
> Para clientes **Gold**, o SLA é:
> - **Resposta:** em até 2 horas
> - **Resolução:** em até 24 horas
> (Fonte: SLA-2024)

**Diagnóstico:** ✅ Correto, completo, fonte citada. Nenhum problema.

### Teste 3: "Quanto custa o frete para 600kg para Manaus?"

**Resposta v1:**
> Para 600kg (acima de 500kg, frete especial), Manaus = Região Norte.
> Valor do frete: **valor base × 1,8** (multiplicador Norte)
> Não tenho o valor base disponível. Recomendo verificar junto ao responsável comercial.
> (Fonte: PROC-042-v2, seção 2)

**Diagnóstico:** ✅ Correto na essência — não inventou valor. Porém usou "responsável comercial" ao invés de "supervisor" (como define o guardrail). Desvio menor de terminologia.

### Resumo v1

| Pergunta | Score | Problema |
|--|--|--|
| Carga perigosa | 3/10 | Ignorou exceção — erro crítico |
| SLA Gold | 9/10 | Sem problemas |
| Frete Manaus | 8/10 | Terminologia de escalação imprecisa |
| **Média** | **6.7/10** | |

O padrão é claro: **o assistente tende a responder com o conteúdo principal do chunk e ignorar exceções/restrições**, especialmente quando a instrução sobre exceções está no final do prompt.

---

## Passo 4: Prompt v2 — Correções Aplicadas

Três mudanças baseadas nos erros observados:

### Mudança 1: Regra de exceções promovida a guardrail principal

**Antes:** Seção "Casos especiais" no final → linguagem suave  
**Depois:** Guardrail 2.3 "REGRA CRÍTICA" → posição de destaque + exemplo negativo

```
### 2.3 REGRA CRÍTICA — Exceções SEMPRE Primeiro

Antes de responder, verificar: a pergunta envolve algo que o chunk
menciona como EXCEÇÃO?

Se sim:
1. Começar pela restrição, não pela regra geral
2. Usar linguagem clara: "NÃO pode" / "É vedado"
3. Só depois explicar a regra geral

Exemplo:
Pergunta: "Prazo de devolução para carga perigosa?"
Resposta CORRETA: "Cargas perigosas classes 1-6 ANTT NÃO podem ser devolvidas."
Resposta ERRADA: "O prazo de devolução é de 7 dias úteis."
```

### Mudança 2: Escalação ampliada

**Antes:** Cobria só "não encontrou resposta"  
**Depois:** Cobre também dados parciais e contradições entre chunks

```
### 2.4 Escalação
Escalar para supervisor quando:
- Não encontrar a informação
- Ter dados parciais (ex: multiplicador mas não valor base)
- Dois chunks contradizerem
```

### Mudança 3: Instrução de leitura completa

**Adicionado:** "SEMPRE leia o chunk por completo antes de responder. Não responda baseado na primeira frase."

### Mudança 4: Autocheck antes de enviar

```
## Autocheck
- [ ] Verifiquei se o item perguntado é uma EXCEÇÃO?
- [ ] Citei a fonte?
- [ ] Inventei algum dado?
- [ ] Se dados incompletos, sugeri escalar ao supervisor?
```

---

## Passo 5: Re-teste com Prompt v2

Mesmos chunks, mesmas perguntas, conversa nova.

### Teste 1 (v2): "Qual o prazo de devolução para carga perigosa?"

> **Cargas perigosas classificadas nas classes 1 a 6 da ANTT NÃO podem ser devolvidas.** Esta categoria está expressamente excluída da política de devolução.
>
> Para as demais mercadorias:
> - Até **7 dias úteis** após o recebimento
> - Abrir chamado no portal + fotos
>
> (Fonte: POL-001, seção 3.2)
>
> Caso haja necessidade de tratar a situação da carga perigosa, recomendo escalar para o supervisor.

**Resultado:** ✅ Começou pela exceção, linguagem inequívoca, sugeriu escalação. **3/10 → 10/10.**

### Teste 2 (v2): SLA Gold — 9/10 (sem mudança)

### Teste 3 (v2): Frete Manaus — 9/10 (terminologia corrigida para "supervisor")

### Comparação Final

```
                    v1      v2     Δ
Carga perigosa:    3/10   10/10   +7
SLA Gold:          9/10    9/10   +0
Frete Manaus:      8/10    9/10   +1
─────────────────────────────────────
MÉDIA:            6.7/10  9.3/10  +2.6
```

---

## O que Aprendi

1. **Onde a instrução está no prompt importa mais que o que ela diz.** A mesma regra sobre exceções existia em v1 e v2 — a diferença foi movê-la de "Casos especiais" (final) para "REGRA CRÍTICA" (início dos guardrails).

2. **Exemplos negativos ativam o modelo melhor que regras abstratas.** Mostrar "Resposta ERRADA" com o caso exato da carga perigosa foi o que corrigiu o comportamento. "Mencione exceções" sozinho não funcionou.

3. **O custo extra em tokens se justifica quando evita erros graves.** v2 é ~30% maior (~720→~950 tokens). Esse custo fixo por query eliminou o erro mais perigoso — orientar incorretamente sobre carga perigosa teria impacto operacional real.

4. **Testes com casos-limite são mais reveladores que testes com perguntas fáceis.** Se eu tivesse testado só a pergunta 2 (SLA Gold), acharia que v1 estava perfeita. A carga perigosa era o caso-limite que revelou o problema real.
