# Exercício 3 — Spec: Fase de Governança e Validação

**Participante:** Willian Goulart  
**Papel:** Desenvolvedor  
**Data:** 2026-06-27  
**Branch:** cenario-3 (a criar em `dgs-ai-first`)  
**Tópicos:** Harness Engineering, Structured Outputs, HITL, Revisão Crítica de Outputs de IA

---

## Contexto e premissas

O cenário 3 tem início a partir do ponto em que o cenário 2 terminou: o ambiente de desenvolvimento já está organizado, o AGENTS.md já se encontra no repositório, os skills já foram documentados e o query endpoint (TASK-001) já foi implementado. Antes do go-live, a equipe precisa acrescentar o harness de governança — o conjunto de verificações que assegura a confiabilidade do sistema em produção.

**Decisões herdadas que afetam este exercício:**

- **AGENTS.md (cenário 2):** uso de TypeScript strict, Zod para validação, pino para logging (nunca console.log), proibição de logar dados pessoais, imports estáticos no topo.
- **Skill `typescript-conventions.md` (cenário 2):** Diretrizes prescritivas para cada arquivo `.ts` gerado.
- **Tipos do domínio (cenário 2):** `QueryResponse` em `src/shared/types.ts` já possui o campo `source_document: string` obrigatório.
- **ADR-0002 (cenário 1):** Context budget ~4K sistema + ~8K chunks — as respostas precisam carregar `source_document` para rastreabilidade.
- **System prompt v2 (cenário 1):** Regras probabilísticas sobre carga perigosa; os guardrails do harness acrescentam verificação determinística para o mesmo assunto.

**O que foi identificado durante o desenvolvimento (contexto do cenário):**

- 12% das respostas em staging se mostraram incorretas (alucinação, doc desatualizado, chunk incorreto).
- As respostas estão em texto livre — não há garantia de que `source_document` e `confidence_score` estejam presentes.
- O Copilot gerou um módulo de feedback desconsiderando o AGENTS.md (`as any`, `console.log`, `require` dinâmico, dado pessoal logado).
- A NovaTech solicitou uma demonstração para a diretoria em 2 semanas.

---

## Estado do repositório antes deste cenário

| Arquivo | Status | Observação |
|---------|--------|-----------|
| `src/functions/query/handler.ts` | ✅ Implementado | TASK-001 do cenário 2 |
| `src/functions/query/validator.ts` | ✅ Implementado | Schema Zod QueryRequest |
| `src/shared/types.ts` | ✅ Implementado | `QueryResponse` com `source_document` obrigatório |
| `src/shared/errors.ts` | ✅ Implementado | `ValidationError`, `SearchError`, `CompletionError` |
| `src/shared/logger.ts` | ✅ Implementado | Instância pino configurada |
| `src/services/response-validator.ts` | ⬜ Stub vazio | **Entregável principal do Ex 3.1** |
| `src/functions/feedback/handler.ts` | ⬜ Stub vazio | **A ser preenchido no Ex 3.2 (reescrita do código problemático)** |
| `AGENTS.md` | ✅ No repo | Regras do projeto — base para revisão crítica |
| `skills/foundation/typescript-conventions.md` | ✅ Implementado | Referência durante o desenvolvimento |

---

## Exercício 3.1 — Structured output e verificações determinísticas (harness de código)

**Tópico:** Harness Engineering  
**Ferramentas:** Claude (chat) + GitHub Copilot

### O que será feito

Trocar as respostas em texto livre por um structured output validável com Zod e incluir duas verificações determinísticas que fortalecem o que o prompt faz de maneira probabilística.

### Conceito-chave: texto livre vs. structured output

Atualmente, o modelo retorna uma string. Caso ele "esqueça" de incluir a fonte, nada impede que a resposta chegue ao atendente. O structured output obriga o modelo a responder em JSON com formato fixo — a validação ocorre em código, antes de qualquer utilização da resposta.

```
Texto livre (atual):
"O prazo de devolução é de 7 dias úteis conforme POL-001."

Structured output (alvo):
{
  "answer": "O prazo de devolução é de 7 dias úteis.",
  "source_document": "POL-001",
  "confidence_score": 0.95
}
```

### Schema Zod do structured output

Campo | Tipo | Regra
------|------|------
`answer` | `z.string().min(1)` | Resposta para o atendente — obrigatória e não vazia
`source_document` | `z.string().min(1)` | Identificador do documento — obrigatório (guardrail 1)
`confidence_score` | `z.number().min(0).max(1)` | Score 0–1 — obrigatório

O schema precisa usar `.strict()` (sem aceitar campos extras) e exportar o tipo inferido:
```typescript
export const AssistantResponseSchema = z.object({...}).strict()
export type AssistantResponse = z.infer<typeof AssistantResponseSchema>
```

### Guardrails determinísticos a implementar

**Guardrail 1 — source_document obrigatório:**
- É acionado quando: o campo `source_document` está ausente ou é uma string vazia após a validação do schema.
- Ação: rejeitar a resposta; registrar o motivo em log; retornar mensagem padrão segura ao atendente.
- Mensagem padrão: `"Não foi possível encontrar a informação. Por favor, consulte um supervisor."`

**Guardrail 2 — carga perigosa + devolução:**
- É acionado quando: `answer` menciona "carga perigosa" E afirma que devolução é possível (sem a negativa).
- Casos que devem acionar: "pode ser devolvida", "é possível devolver", "devolução disponível".
- Casos que NÃO devem acionar: "não pode ser devolvida", "não é possível devolver", "devolução não está disponível".
- Ação: bloquear a resposta; registrar o motivo em log; retornar mensagem padrão segura.

### Path de destino

`novatech-assistant/src/services/response-validator.ts`

### Interface pública esperada

```typescript
export function validateResponse(raw: unknown): ValidatedResult

// ValidatedResult:
// { valid: true; data: AssistantResponse }
// { valid: false; reason: 'schema_invalid' | 'missing_source' | 'dangerous_goods_violation'; safeResponse: string }
```

### Revisão crítica com Claude (após implementação com Copilot)

Apontar ao menos 2 problemas no código gerado. Problemas prováveis:
- Schema sem `.strict()` — passa a aceitar campos extras silenciosamente (ex: `hallucinated_field`).
- Regex de guardrail 2 não contempla variações: "pode devolver", "devolução ok", "é devolvível".
- Guardrail registra, mas não bloqueia (somente loga sem retornar erro).
- Tipo de retorno usa `any` no lugar do discriminated union.
- Logger como `console.log` em vez de pino.

### Entregáveis do Ex 3.1

- `novatech-assistant/src/services/response-validator.ts` — schema Zod + guardrails implementados + revisão aplicada
- `dgs-ai-first/evidencias/ex-3.1-structured-output-harness.md` — schema, código, revisão de código e correções

---

## Exercício 3.2 — Revisão crítica de código gerado por IA

**Tópico:** Revisão Crítica de Outputs de IA  
**Ferramentas:** Claude (chat) + GitHub Copilot

### O que será feito

Revisar o módulo de feedback gerado pelo Copilot (fornecido no enunciado), identificar violações do AGENTS.md, comparar com a revisão do Claude e reescrever o módulo da forma correta.

### O código problemático (dado pelo enunciado)

```typescript
// feedback-handler.ts — gerado pelo Copilot
import { app, HttpRequest, HttpResponseInit } from '@azure/functions';

export async function feedbackHandler(
  request: HttpRequest
): Promise<HttpResponseInit> {
  const body = await request.json() as any;

  const feedback = {
    queryId: body.queryId,
    rating: body.rating,
    comment: body.comment,
    attendantEmail: body.attendantEmail,
    timestamp: new Date().toISOString()
  };

  console.log('Feedback recebido:', JSON.stringify(feedback));

  const { CosmosClient } = require('@azure/cosmos');
  const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING);
  const database = client.database('novatech');
  const container = database.container('feedbacks');

  await container.items.create(feedback);

  return { status: 200, body: 'OK' };
}

app.http('feedback', {
  methods: ['POST'],
  handler: feedbackHandler
});
```

### Problemas a identificar (mínimo exigido pela avaliação)

| # | Problema | Classificação | Regra violada |
|---|----------|---------------|---------------|
| 1 | `as any` sem validação Zod | Violação AGENTS.md + bug potencial | "Zod para validação de input" |
| 2 | `console.log('Feedback recebido:', JSON.stringify(feedback))` | Violação AGENTS.md + problema de segurança | "pino para logging; nunca logar dados pessoais" — `attendantEmail` está sendo logado |
| 3 | `require('@azure/cosmos')` dinâmico dentro da função | Violação AGENTS.md | "Imports estáticos no topo (nunca require dinâmico)" |
| 4 | `attendantEmail` no objeto `feedback` logado | Problema de segurança | "Nunca logar dados pessoais (e-mail, nome)" |

Problemas adicionais a observar (diferenciam a revisão):
- Falta de `try/catch` na função async (unhandled rejection em falha do Cosmos).
- Ausência de schema Zod validando `rating` (aceita qualquer valor, inclusive string, negativo, >5).
- `InvocationContext` ausente na assinatura (Azure Functions v4 requer o segundo parâmetro).
- O retorno `body: 'OK'` é string — o padrão do projeto utiliza JSON.

### Path de destino (código reescrito)

`novatech-assistant/src/functions/feedback/handler.ts`

### Código reescrito — requisitos

O código final precisa:
- Usar `import` estático para `@azure/cosmos` no topo do arquivo.
- Validar o body com schema Zod (`FeedbackRequestSchema`) — rejeitar com 400 se inválido.
- Usar `logger.info(...)` do pino — nunca `console.log`.
- Nunca logar `attendantEmail` nem qualquer campo pessoal.
- Ter `try/catch` explícito com log de erro via `logger.error(...)`.
- Seguir a assinatura Azure Functions v4: `(request: HttpRequest, context: InvocationContext)`.
- Retornar JSON no body (não string).

### Entregáveis do Ex 3.2

- `novatech-assistant/src/functions/feedback/handler.ts` — módulo reescrito em conformidade com o AGENTS.md
- `dgs-ai-first/evidencias/ex-3.2-revisao-critica-feedback-handler.md` — revisão própria + revisão Claude + comparação + código final

---

## Critérios de aceite globais

### Ex 3.1
- [ ] Exportar o Schema Zod com o nome `AssistantResponseSchema` e o tipo `AssistantResponse`
- [ ] O schema utiliza `.strict()` (sem campos extras)
- [ ] `confidence_score` é validado como `z.number().min(0).max(1)` (não string)
- [ ] Guardrail 1 bloqueia (não apenas registra em log) quando `source_document` estiver ausente
- [ ] Guardrail 2 contempla variações de "possível devolver" (não apenas regex literal)
- [ ] A função retorna discriminated union (`{ valid: true; data }` | `{ valid: false; reason; safeResponse }`)
- [ ] Logging via pino (nunca `console.log`)
- [ ] O code review identifica ao menos 2 problemas reais (não inventados) com a correção aplicada
- [ ] A evidência deixa explícito: prompt é probabilístico, guardrail no código é determinístico

### Ex 3.2
- [ ] A revisão própria é feita ANTES de usar o Claude (a evidência mostra a sequência)
- [ ] Identifica no mínimo: `as any`, `console.log`, `require` dinâmico, `attendantEmail` logado
- [ ] A comparação com Claude é honesta (onde concordou, onde divergiu)
- [ ] O código reescrito não contém nenhuma das 4 violações obrigatórias
- [ ] O código reescrito compila em TypeScript strict (sem erros de tipo)
- [ ] A validação Zod do input está presente no código final

---

## Ordem de execução recomendada

```
Bloco 1 — Harness de código:
  TASK-HARNESS-001 (schema Zod)
  TASK-HARNESS-002 (response-validator.ts)
  TASK-HARNESS-003 (code review + correções)
  TASK-HARNESS-004 (evidência Ex 3.1)

Bloco 2 — Revisão crítica:
  TASK-REVIEW-001 (revisão própria do feedback-handler)
  TASK-REVIEW-002 (revisão Claude + comparação)
  TASK-REVIEW-003 (reescrita com Copilot)
  TASK-REVIEW-004 (evidência Ex 3.2)
```

**Total:** 8 tasks  
**Estimativa:** Bloco 1 (~45 min), Bloco 2 (~45 min)
