/**
 * Tipos de domínio do query endpoint — NovaTech Assistant
 * Derivados da ADR-0002 (context budget) e ADR-0003 (documentos contraditórios)
 */

export type QueryRequest = {
  question: string;
};

export type QueryResponse = {
  answer: string;
  /** Documento-fonte que fundamenta a resposta — obrigatório para rastreabilidade */
  source_document: string;
  confidence?: number;
};

export type Chunk = {
  id: string;
  content: string;
  source: string;
  /** Campo de vigência para resolver documentos contraditórios (ADR-0003) */
  vigencia?: string;
};
