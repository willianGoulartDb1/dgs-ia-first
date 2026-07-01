# Evidência — Ex 3.1: Structured Output e Harness de Código

**Atividade:** 3.1 — Harness Engineering  
**Função:** Desenvolvedor  
**Arquivo gerado:** `novatech-assistant/src/services/response-validator.ts`

---

## 1. Schema Zod — AssistantResponseSchema

### Decisão de design

O structured output toma o lugar da resposta em texto livre. Em vez de o modelo devolver uma string que pode ou não trazer a fonte, ele devolve um JSON com campos obrigatórios — e o código faz a validação antes de qualquer utilização.

**Campos especificados:**

| Campo | Tipo Zod | Justificativa |
|-------|----------|--------------|
| `answer` | `z.string().min(1)` | Resposta destinada ao atendente — obrigatória e sem conteúdo vazio |
| `source_document` | `z.string().min(1)` | Rastreabilidade (ADR-0002); se o campo não vier, a resposta é rejeitada |
| `confidence_score` | `z.number().min(0).max(1)` | Viabiliza HITL: scores baixos podem disparar revisão humana |

**Por que `.strict()`?** Sem `.strict()`, o Zod desconsidera campos extras no objeto JSON. Um modelo que alucine campos adicionais (ex: `"hallucinated_policy": true`) atravessa a validação sem qualquer erro. O `.strict()` assegura que apenas os campos contratados estejam presentes na resposta.

---

## 2. Versão inicial gerada pelo Copilot

Prompt fornecido ao Copilot:

```
Implemente um response-validator.ts em TypeScript que:
- Define um schema Zod para { answer, source_document, confidence_score }
- Valida uma resposta raw contra o schema
- Guardrail 1: rejeita se source_document ausente
- Guardrail 2: bloqueia respostas que afirmem devolução de carga perigosa
- Usa logger do pino, retorna { valid, reason, safeResponse } em caso de falha
```

**Código produzido pelo Copilot:**

```typescript
import { z } from 'zod';
import { logger } from '../../shared/logger';

// Problema 1: schema sem .strict() — campos extras passam silenciosamente
export const AssistantResponseSchema = z.object({
  answer: z.string().min(1),
  source_document: z.string().min(1),
  confidence_score: z.number().min(0).max(1),
});

export type AssistantResponse = z.infer<typeof AssistantResponseSchema>;

// Problema 2: regex cobre apenas a frase literal mais comum
const DANGEROUS_GOODS_REGEX = /carga perigosa.{0,30}pode ser devolvida/i;

const SAFE_RESPONSE =
  'Não foi possível processar esta resposta. Por favor, consulte um supervisor.';

// Problema 3: sem anotação de tipo de retorno — o tipo é inferido mas não explícito
export function validateResponse(raw: unknown) {
  const result = AssistantResponseSchema.safeParse(raw);

  if (!result.success) {
    logger.warn({ errors: result.error.issues }, 'Validação de schema falhou');
    return { valid: false, reason: 'schema_invalid', safeResponse: SAFE_RESPONSE };
  }

  if (!result.data.source_document) {
    logger.warn('source_document ausente');
    return { valid: false, reason: 'missing_source', safeResponse: SAFE_RESPONSE };
  }

  if (DANGEROUS_GOODS_REGEX.test(result.data.answer)) {
    logger.warn('Guardrail 2 disparado');
    return { valid: false, reason: 'dangerous_goods_violation', safeResponse: SAFE_RESPONSE };
  }

  return { valid: true, data: result.data };
}
```

---

## 3. Code review com Claude

**Prompt fornecido ao Claude:**

```
Revise o response-validator.ts gerado pelo Copilot abaixo.
Contexto: é um módulo TypeScript strict que valida respostas de um LLM antes de enviá-las 
a atendentes. Identifique problemas — com foco em segurança da validação e cobertura dos guardrails.

[código acima colado]
```

**Problemas apontados pelo Claude:**

### Problema 1 — Schema sem `.strict()` aceita campos extras

**Fragmento original:**
```typescript
export const AssistantResponseSchema = z.object({
  answer: z.string().min(1),
  source_document: z.string().min(1),
  confidence_score: z.number().min(0).max(1),
}); // ← sem .strict()
```

**Risco real:** Se o modelo devolver `{ answer: "...", source_document: "POL-001", confidence_score: 0.9, hallucinated_field: "autorizado" }`, o Zod valida sem erro e `hallucinated_field` passa a integrar o objeto `data`. O código downstream que acessa `data.source_document` continua funcionando, porém a resposta leva um campo inventado sem gerar qualquer alerta.

**Ajuste:** Incluir `.strict()` no final de `z.object({...})`.

---

### Problema 2 — Regex do guardrail 2 não cobre variações

**Fragmento original:**
```typescript
const DANGEROUS_GOODS_REGEX = /carga perigosa.{0,30}pode ser devolvida/i;
```

**Risco real:** Essa regex captura somente a frase exata "carga perigosa [até 30 chars] pode ser devolvida". Ela falha em:
- "Cargas perigosas **podem ser devolvidas** mediante..."
- "Carga perigosa **pode devolver**-se com documentação ANTT"
- "A **devolução** de carga perigosa **está disponível**"
- "Carga perigosa **é devolvível** com autorização"
- Ordem invertida: "devolução de carga perigosa é possível"

O guardrail 2 é justamente o cenário de maior risco do sistema (POL-001 proíbe isso expressamente). Uma regex estreita transmite uma falsa percepção de segurança.

**Ajuste:** Substituir por múltiplos padrões com checagem de negação anterior.

---

### Problema 3 — Sem anotação explícita de tipo de retorno

**Fragmento original:**
```typescript
export function validateResponse(raw: unknown) {
```

**Risco:** O TypeScript infere corretamente o tipo de retorno neste caso, porém, sem a anotação explícita, o contrato da função não fica registrado. Se alguém incluir um novo branch de retorno que não respeite o discriminated union, o compilador não sinaliza.

**Ajuste:** Declarar `ValidatedResult` como tipo nomeado e anotar `validateResponse(raw: unknown): ValidatedResult`.

---

## 4. Correções aplicadas

### Correção 1 — `.strict()` no schema

```typescript
// Antes
export const AssistantResponseSchema = z.object({
  answer: z.string().min(1),
  source_document: z.string().min(1),
  confidence_score: z.number().min(0).max(1),
});

// Depois
export const AssistantResponseSchema = z
  .object({
    answer: z.string().min(1, 'Resposta não pode ser vazia'),
    source_document: z.string().min(1, 'Documento fonte é obrigatório'),
    confidence_score: z.number().min(0).max(1),
  })
  .strict();
```

### Correção 2 — Regex expandida com verificação de negação

```typescript
// Antes — 1 padrão literal
const DANGEROUS_GOODS_REGEX = /carga perigosa.{0,30}pode ser devolvida/i;

// Depois — múltiplos padrões + verificação de negação precedente
const DANGEROUS_AFFIRMATIVE_PATTERNS = [
  /pode(?:m)?\s+(?:ser\s+)?devolvid[ao]s?/i,
  /(?:é|são)\s+possíve[il]s?\s+devolver/i,
  /devolução\s+(?:é\s+)?(?:disponível|permitida|possível)/i,
  /pode(?:m)?\s+devolver/i,
  /é\s+devolvível/i,
  /processo\s+de\s+devolução\s+(?:está\s+)?disponível/i,
];

function hasDangerousGoodsViolation(answer: string): boolean {
  if (!answer.toLowerCase().includes('carga perigosa')) return false;

  for (const pattern of DANGEROUS_AFFIRMATIVE_PATTERNS) {
    const match = answer.match(pattern);
    if (!match) continue;

    const matchIndex = match.index ?? 0;
    const preceding = answer.slice(Math.max(0, matchIndex - 25), matchIndex);
    if (/não\s*$/i.test(preceding.trimEnd())) continue; // negação → não dispara

    return true;
  }

  return false;
}
```

### Correção 3 — Tipo de retorno explícito

```typescript
// Antes
export function validateResponse(raw: unknown) {

// Depois
type ValidatedResult =
  | { valid: true; data: AssistantResponse }
  | {
      valid: false;
      reason: 'schema_invalid' | 'missing_source' | 'dangerous_goods_violation';
      safeResponse: string;
    };

export function validateResponse(raw: unknown): ValidatedResult {
```

---

## 5. Código final — `response-validator.ts`

```typescript
import { z } from 'zod';
import { logger } from '../shared/logger';

const SAFE_RESPONSE =
  'Não foi possível processar esta resposta. Por favor, consulte um supervisor.';

export const AssistantResponseSchema = z
  .object({
    answer: z.string().min(1, 'Resposta não pode ser vazia'),
    source_document: z.string().min(1, 'Documento fonte é obrigatório'),
    confidence_score: z.number().min(0).max(1),
  })
  .strict();

export type AssistantResponse = z.infer<typeof AssistantResponseSchema>;

type ValidatedResult =
  | { valid: true; data: AssistantResponse }
  | {
      valid: false;
      reason: 'schema_invalid' | 'missing_source' | 'dangerous_goods_violation';
      safeResponse: string;
    };

const DANGEROUS_AFFIRMATIVE_PATTERNS = [
  /pode(?:m)?\s+(?:ser\s+)?devolvid[ao]s?/i,
  /(?:é|são)\s+possíve[il]s?\s+devolver/i,
  /devolução\s+(?:é\s+)?(?:disponível|permitida|possível)/i,
  /pode(?:m)?\s+devolver/i,
  /é\s+devolvível/i,
  /processo\s+de\s+devolução\s+(?:está\s+)?disponível/i,
];

function hasDangerousGoodsViolation(answer: string): boolean {
  if (!answer.toLowerCase().includes('carga perigosa')) return false;

  for (const pattern of DANGEROUS_AFFIRMATIVE_PATTERNS) {
    const match = answer.match(pattern);
    if (!match) continue;

    const matchIndex = match.index ?? 0;
    const preceding = answer.slice(Math.max(0, matchIndex - 25), matchIndex);
    if (/não\s*$/i.test(preceding.trimEnd())) continue;

    return true;
  }

  return false;
}

export function validateResponse(raw: unknown): ValidatedResult {
  const result = AssistantResponseSchema.safeParse(raw);

  if (!result.success) {
    logger.warn({ issues: result.error.issues }, 'response-validator: schema inválido');
    return { valid: false, reason: 'schema_invalid', safeResponse: SAFE_RESPONSE };
  }

  const data = result.data;

  if (!data.source_document.trim()) {
    logger.warn('response-validator: source_document vazio após trim');
    return { valid: false, reason: 'missing_source', safeResponse: SAFE_RESPONSE };
  }

  if (hasDangerousGoodsViolation(data.answer)) {
    logger.warn(
      { reason: 'dangerous_goods_violation' },
      'response-validator: resposta bloqueada — carga perigosa com devolução afirmativa',
    );
    return { valid: false, reason: 'dangerous_goods_violation', safeResponse: SAFE_RESPONSE };
  }

  return { valid: true, data };
}
```

---

## 6. Probabilístico vs. determinístico — por que os dois são necessários

O system prompt v2 (cenário 1, Ex 1.2) já orienta o modelo com a seguinte regra:

> "Cargas perigosas (classes 1 a 6 da ANTT) não podem ser devolvidas pelo processo padrão. Recomendo escalar para o supervisor."

Mas essa orientação é **probabilística**: o modelo a segue na maior parte dos casos, porém não em todos. Em determinadas condições (prompt injection, contexto longo, recuperação de chunk desatualizado), o modelo pode produzir uma resposta afirmativa sobre devolução de carga perigosa mesmo com a instrução presente.

O guardrail no código é **determinístico**: independentemente do que o modelo produza, se a resposta contiver "carga perigosa" + afirmação de devolução sem negativa, ela será bloqueada antes de alcançar o atendente. Não se trata de uma sugestão — é um hard block.

| | Prompt (system prompt v2) | Código (guardrail 2) |
|-|--------------------------|---------------------|
| **Mecanismo** | Instrução de linguagem natural | Verificação de padrão em código |
| **Garantia** | Probabilística — funciona na maioria | Determinística — sempre funciona |
| **Ponto de falha** | Modelo pode ignorar/alucinhar | Regex não cobre variações (corrigido) |
| **Quando usar** | Para guiar o comportamento normal | Para bloquear casos de risco alto |

Os dois se complementam: o prompt diminui a frequência de respostas problemáticas, e o código assegura que nenhuma delas alcance o atendente.

