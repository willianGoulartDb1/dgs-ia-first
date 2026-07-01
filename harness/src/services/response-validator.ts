import { z } from 'zod';
import { logger } from '../shared/logger';

const MENSAGEM_PADRAO_SEGURA =
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

// Padrões que indicam autorização de devolução — usados junto com a
// presença de "carga perigosa" para acionar o bloqueio determinístico.
// A checagem antecedente de negação ("não") nos 25 caracteres anteriores
// evita falsos positivos em frases negativas.
const PADROES_DEVOLUCAO_AFIRMATIVA = [
  /pode(?:m)?\s+(?:ser\s+)?devolvid[ao]s?/i,
  /(?:é|são)\s+possíve[il]s?\s+devolver/i,
  /devolução\s+(?:é\s+)?(?:disponível|permitida|possível)/i,
  /pode(?:m)?\s+devolver/i,
  /é\s+devolvível/i,
  /processo\s+de\s+devolução\s+(?:está\s+)?disponível/i,
];

function contemAfirmacaoDevolucaoCargaPerigosa(textoResposta: string): boolean {
  if (!textoResposta.toLowerCase().includes('carga perigosa')) return false;

  for (const padrao of PADROES_DEVOLUCAO_AFIRMATIVA) {
    const resultado = textoResposta.match(padrao);
    if (!resultado) continue;

    const posicao = resultado.index ?? 0;
    const textoAnterior = textoResposta.slice(Math.max(0, posicao - 25), posicao);
    if (/não\s*$/i.test(textoAnterior.trimEnd())) continue;

    return true;
  }

  return false;
}

export function validateResponse(raw: unknown): ValidatedResult {
  const parseResult = AssistantResponseSchema.safeParse(raw);

  if (!parseResult.success) {
    logger.warn({ issues: parseResult.error.issues }, 'response-validator: falha na validação do schema');
    return { valid: false, reason: 'schema_invalid', safeResponse: MENSAGEM_PADRAO_SEGURA };
  }

  const resposta = parseResult.data;

  // Guardrail 1: verificação adicional — source_document composto apenas por espaços é tratado como ausente
  if (!resposta.source_document.trim()) {
    logger.warn('response-validator: campo source_document está vazio após remoção de espaços');
    return { valid: false, reason: 'missing_source', safeResponse: MENSAGEM_PADRAO_SEGURA };
  }

  // Guardrail 2: bloqueia respostas que afirmem devolução de carga perigosa sem negativa explícita
  if (contemAfirmacaoDevolucaoCargaPerigosa(resposta.answer)) {
    logger.warn(
      { reason: 'dangerous_goods_violation' },
      'response-validator: bloqueio acionado — detectada afirmação de devolução de carga perigosa',
    );
    return { valid: false, reason: 'dangerous_goods_violation', safeResponse: MENSAGEM_PADRAO_SEGURA };
  }

  return { valid: true, data: resposta };
}