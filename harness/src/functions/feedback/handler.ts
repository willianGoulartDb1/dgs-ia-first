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

const clienteCosmos = new CosmosClient(process.env.COSMOS_CONNECTION_STRING ?? '');
const colecaoFeedbacks = clienteCosmos.database('novatech').container('feedbacks');

export async function feedbackHandler(
  request: HttpRequest,
  _context: InvocationContext,
): Promise<HttpResponseInit> {
  const corpoRequisicao = await request.json().catch(() => null);
  const validacao = FeedbackRequestSchema.safeParse(corpoRequisicao);

  if (!validacao.success) {
    logger.warn({ issues: validacao.error.issues }, 'feedback: dados de entrada inválidos');
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Dados de entrada inválidos', details: validacao.error.issues }),
    };
  }

  // Isolar informações pessoais para que não apareçam em nenhum registro de log
  const { attendantEmail, ...camposLogaveis } = validacao.data;

  try {
    await colecaoFeedbacks.items.create({
      ...validacao.data,
      timestamp: new Date().toISOString(),
    });

    logger.info(
      { queryId: camposLogaveis.queryId, rating: camposLogaveis.rating },
      'feedback: gravado com sucesso',
    );

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    logger.error(
      { err, queryId: camposLogaveis.queryId },
      'feedback: erro ao persistir no Cosmos DB',
    );
    return {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Falha interna ao gravar feedback' }),
    };
  }
}

app.http('feedback', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'feedback',
  handler: feedbackHandler,
});