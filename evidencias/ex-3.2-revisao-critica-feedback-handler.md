# Evidência — Ex 3.2: Revisão Crítica de Código Gerado por IA

**Atividade:** 3.2 — Revisão Crítica de Outputs de IA  
**Função:** Desenvolvedor  
**Arquivo gerado:** `novatech-assistant/src/functions/feedback/handler.ts`

---

## 1. Revisão própria (antes do Claude)

**Código fornecido para análise:**

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

**Problemas encontrados (sem apoio de IA):**

| # | Problema | Trecho | Classificação |
|---|----------|--------|---------------|
| 1 | `as any` sem validação Zod — `body` é assumido como tipado, porém não passou por validação | `const body = await request.json() as any` | Violação AGENTS.md + bug potencial |
| 2 | `console.log` em vez de pino | `console.log('Feedback recebido:', ...)` | Violação AGENTS.md |
| 3 | `attendantEmail` incluído no objeto `feedback`, que é logado por inteiro | `JSON.stringify(feedback)` com `attendantEmail` dentro | Violação AGENTS.md + problema de segurança |
| 4 | `require('@azure/cosmos')` dinâmico dentro da função | `const { CosmosClient } = require(...)` | Violação AGENTS.md |
| 5 | Sem `try/catch` — `container.items.create(feedback)` pode lançar erro sem tratamento | `await container.items.create(feedback)` | Bug potencial (unhandled rejection) |
| 6 | `rating` sem validação de range — aceita qualquer valor, inclusive strings e números negativos | `rating: body.rating` | Bug potencial |
| 7 | `InvocationContext` ausente na assinatura — Azure Functions v4 exige o segundo parâmetro | `feedbackHandler(request: HttpRequest)` | Violação da API do framework |
| 8 | `body: 'OK'` como string — o padrão do projeto adota JSON com Content-Type | `return { status: 200, body: 'OK' }` | Inconsistência com padrão do projeto |

---

## 2. Revisão do Claude

**Prompt enviado:**

```
Revise o seguinte código TypeScript para Azure Functions v4.
O projeto segue estas regras (AGENTS.md):
- TypeScript strict mode
- Zod para validação de input (nunca as any)
- pino para logging (nunca console.log)
- Nunca logar dados pessoais (e-mail, nome)
- Imports estáticos no topo (nunca require dinâmico)

Liste todos os problemas com classificação: violação do AGENTS.md, 
problema de segurança, ou bug potencial.

[código colado]
```

**Problemas apontados pelo Claude:**

1. **`as any` sem validação Zod** — Violação AGENTS.md. O body é usado sem validação prévia. Campos obrigatórios como `queryId` e `rating` podem faltar ou vir com tipo incorreto sem que qualquer erro seja disparado.

2. **`console.log` em vez de pino** — Violação AGENTS.md. O pino foi adotado como logger padrão do projeto para viabilizar saída estruturada e configuração de nível via env.

3. **Dado pessoal (`attendantEmail`) no log** — Problema de segurança. O `JSON.stringify(feedback)` contém o email do atendente, quebrando a regra de não registrar dados pessoais. Isso pode expor informações em sistemas centralizados de logs.

4. **`require` dinâmico** — Violação AGENTS.md. O `require('@azure/cosmos')` dentro da função infringe a regra de imports estáticos. Além de ser mais lento (o módulo é carregado a cada invocação), impede tree-shaking e torna a análise estática mais difícil.

5. **Ausência de `try/catch`** — Bug potencial. Se o Cosmos DB estiver indisponível ou lançar erro, a promise será rejeitada sem tratamento, produzindo um erro 500 não controlado e sem log de diagnóstico.

6. **`InvocationContext` ausente** — O segundo parâmetro é obrigatório na assinatura do Azure Functions v4. Sem ele, o runtime pode deixar de repassar o contexto corretamente em cenários mais complexos.

7. **Retorno `body: 'OK'` como string** — O padrão do projeto devolve JSON. O Content-Type deveria ser `application/json`.

---

## 3. Comparação: revisão própria vs. revisão do Claude

| Problema | Encontrei | Claude encontrou | Classificação concordou? |
|----------|:---------:|:----------------:|:------------------------:|
| `as any` sem Zod | ✅ | ✅ | ✅ Sim |
| `console.log` em vez de pino | ✅ | ✅ | ✅ Sim |
| `attendantEmail` logado | ✅ | ✅ | ✅ Sim |
| `require` dinâmico | ✅ | ✅ | ✅ Sim |
| Sem `try/catch` | ✅ | ✅ | ✅ Sim |
| `rating` sem validação de range | ✅ | ❌ | — (Claude não identificou explicitamente) |
| `InvocationContext` ausente | ✅ | ✅ | ✅ Sim |
| `body: 'OK'` como string | ✅ | ✅ | ✅ Sim |

**Observações:**
- A revisão própria identificou o problema de `rating` sem validação de range (aceita `rating: "cinco"`, `rating: -1`, `rating: 999`) — o Claude concentrou-se nos problemas mais evidentes e não avançou tanto nas validações de campo.
- O Claude estruturou os problemas com boa clareza técnica e ressaltou o impacto do `as any` em termos de type safety em tempo de execução.
- Ambos concordaram nos 4 problemas obrigatórios da avaliação e também em outros pontos adicionais relevantes.

---

## 4. Reflexão

A revisão humana identificou o problema de `rating` sem range porque, ao ler o domínio (formulário de satisfação de 1 a 5), fica imediato notar que `body.rating` pode receber qualquer valor. O Claude, sem esse contexto implícito do domínio, concentrou-se nas violações mais explícitas do AGENTS.md.

Esse comportamento se repete: a IA é eficiente para identificar violações de convenção (o que está explícito nas regras), mas a revisão humana detecta melhor os problemas de negócio (o que deveria ser validado mesmo quando não está na regra). Os dois se complementam: a IA não substitui o revisor humano, e sim atua como um primeiro filtro para evitar desperdício de tempo com problemas óbvios.

---

## 5. Código reescrito — `feedback/handler.ts`

```typescript
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { CosmosClient } from '@azure/cosmos';
import { z } from 'zod';
import { logger } from '../../shared/logger';

const FeedbackRequestSchema = z.object({
  queryId: z.string().min(1, 'queryId é obrigatório'),
  rating: z.number().int().min(1).max(5, 'rating deve ser entre 1 e 5'),
  comment: z.string().optional(),
  attendantEmail: z.string().email('e-mail inválido').optional(),
});

type FeedbackRequest = z.infer<typeof FeedbackRequestSchema>;

const cosmosClient = new CosmosClient(process.env.COSMOS_CONNECTION_STRING ?? '');
const container = cosmosClient.database('novatech').container('feedbacks');

export async function feedbackHandler(
  request: HttpRequest,
  _context: InvocationContext,
): Promise<HttpResponseInit> {
  const body = await request.json().catch(() => null);
  const parsed = FeedbackRequestSchema.safeParse(body);

  if (!parsed.success) {
    logger.warn({ issues: parsed.error.issues }, 'feedback: input inválido');
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Input inválido', details: parsed.error.issues }),
    };
  }

  // Separar dado pessoal antes de qualquer log
  const { attendantEmail, ...safeFields } = parsed.data;

  try {
    await container.items.create({
      ...parsed.data,
      timestamp: new Date().toISOString(),
    });

    logger.info(
      { queryId: safeFields.queryId, rating: safeFields.rating },
      'feedback: registrado com sucesso',
    );

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    logger.error(
      { err, queryId: safeFields.queryId },
      'feedback: falha ao salvar no Cosmos DB',
    );
    return {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Erro interno ao registrar feedback' }),
    };
  }
}

app.http('feedback', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'feedback',
  handler: feedbackHandler,
});
```

**Checklist de correções aplicadas:**

- [x] `as any` trocado por `FeedbackRequestSchema.safeParse()` com retorno 400 quando houver falha
- [x] `console.log` trocado por `logger.info` / `logger.warn` / `logger.error` (pino)
- [x] `attendantEmail` separado via destructuring antes de qualquer log (`safeFields` não inclui o campo)
- [x] `require` dinâmico trocado por `import { CosmosClient } from '@azure/cosmos'` no topo
- [x] `try/catch` explícito cobrindo a operação do Cosmos, com log de erro e retorno 500 controlado
- [x] `rating` validado com `z.number().int().min(1).max(5)`
- [x] `InvocationContext` incluído como segundo parâmetro na assinatura
- [x] Retorno com `body: JSON.stringify(...)` e `Content-Type: application/json`
- [x] `CosmosClient` instanciado fora da função (singleton por invocação fria, não por request)
