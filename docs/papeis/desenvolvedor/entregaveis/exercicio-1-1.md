# Viabilidade Técnica — Assistente RAG NovaTech

**Autor:** Willian Goulart  
**Papel:** Desenvolvedor  
**Data:** 2026-06-04  
**Contexto:** Análise solicitada pelo Tech Lead para avaliar a viabilidade de um assistente RAG sobre a base documental da NovaTech

---

## 1. Diagnóstico por Formato de Documento

Antes de pensar em modelo ou embeddings, o primeiro passo foi entender a qualidade dos dados de entrada. A experiência mostra que a viabilidade de um RAG depende mais da pipeline de ingestão do que da escolha do LLM. Analisei cada formato presente na NovaTech com esse olhar.

### SharePoint: PDFs com Tabelas (800 documentos)

As tabelas de frete do PROC-042 têm 15+ colunas com relacionamentos bidimensionais — região na linha, multiplicador na coluna. Parsers como pdfplumber ou PyMuPDF linearizam isso, destruindo a estrutura: `Sul 1.2 1.3 Sudeste 1.0 1.1...` vira um bloco sem semântica.

O problema é agravado pela coexistência de PROC-042 v1 e v2 com valores diferentes no mesmo SharePoint, sem indicação de vigência. Se ambos forem indexados, o retrieval pode recuperar o multiplicador errado.

**Abordagem:** Camelot para tabelas com bordas, conversão para Markdown/JSON preservando cabeçalhos. Embutir versão no chunk: `[PROC-042-v2][tabela:multiplicadores-regionais]` com campo `version_status: active|deprecated`.

### SharePoint: PDFs Escaneados

Essa foi a parte que mais me preocupou. Documentos digitalizados passam por OCR e a taxa de erro pode ser silenciosa — `1` vira `l`, `0` vira `O`, e um SLA de "2h" pode virar "2n". O problema é que números corrompidos geram respostas factualmente erradas sem que ninguém perceba: o LLM confia no que recebeu.

**Abordagem:** Tesseract com threshold de confiança ≥85%, ou Azure Document Intelligence para documentos críticos. Incluir score de confiança como metadado do chunk — chunks abaixo de 75% ficam excluídos do retrieval por padrão. Complementar com pós-processamento usando dicionário de termos logísticos (CT-e, ANTT, SLA, PROC).

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

## 5. Conclusão: Viável, mas o Risco Está nos Dados

Tecnicamente, não vejo impedimento: a base de ~3,1M tokens cabe num único índice vetorial sem necessidade de sharding, e o GPT-4o com 128K de context window dá margem confortável para os cenários de uso. O custo de indexação é desprezível.

O que me preocupa de verdade não é a tecnologia — é a governança da base documental. A coexistência de PROC-042 v1 e v2 sem definição clara de vigência é o tipo de problema que nenhum modelo resolve sozinho.

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

## 6. Como Usei o Claude para Revisar

Após redigir a análise, enviei o documento ao Claude pedindo que apontasse estimativas otimistas ou riscos que eu pudesse ter ignorado. Três pontos voltaram:

**Retorno 1:** Minha estimativa original usava 100 células por planilha. O Claude argumentou que planilhas corporativas típicas têm 200+ células semânticas relevantes. Ajustei para 200 × 5 palavras = 50.000 palavras. Na prática mudou pouco (~0,5% do total), mas a premissa ficou mais honesta.

**Retorno 2:** Eu não tinha incluído análise de custo de indexação. Adicionei: ~$0,31 com ada-002 para indexar toda a base. Um dado simples que fortalece o argumento de viabilidade financeira.

**Retorno 3:** O risco de documentos conflitantes estava mencionado na seção de fontes, quase como nota de rodapé. O Claude sinalizou que deveria ser o risco #1. Concordei — é o cenário com maior potencial de dano real (imagine o atendente informando o multiplicador de frete errado). Promovi para primeira posição na tabela de riscos.
