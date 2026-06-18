# Planejamento de Discovery — Modelo AI First

**Autor:** Willian Goulart — Delivery Manager (DB1)  
**Data:** 2026-06-05  
**Versão:** 1.1

---

## Por que o Discovery deste projeto é diferente

No modelo tradicional, o discovery começa com entrevistas — perguntas abertas para "entender o negócio". No modelo AI First da DB1, fazemos o contrário: **primeiro, agentes de IA analisam toda a documentação disponível e produzem um mapa do que existe, do que está inconsistente e do que falta.** Depois, os humanos usam esse mapa para conduzir entrevistas cirúrgicas — validam hipóteses, resolvem ambiguidades e tomam decisões que só humanos podem tomar.

A consequência prática: os humanos chegam às entrevistas sabendo o que perguntar, em vez de gastar tempo descobrindo o que existe.

---

## Plano em Duas Fases

### Fase 1: Intent — Agentes de IA (Dias 1 a 5)

Os agentes de IA processam os ~1.250 documentos das três fontes da NovaTech e entregam cinco outputs que alimentam o discovery humano.

**Output 1 — Catálogo Estruturado**
- Agente: Catalogador
- O que recebe: acesso às 3 fontes (SharePoint, Confluence, pasta de rede)
- O que entrega: índice com ID, título, fonte, formato, data de atualização, área responsável e temas cobertos por documento
- Duração estimada: Dias 1-2

**Output 2 — Mapa de Inconsistências**
- Agente: Detector de Conflitos
- O que recebe: catálogo + conteúdo dos documentos
- O que entrega: lista de pares conflitantes com comparação lado a lado. Exemplo: PROC-042 (multiplicador Nordeste = 1.4) vs PROC-042-v2 (Nordeste = 1.5), sem indicação de qual é vigente.
- Duração estimada: Dias 2-3

**Output 3 — Análise de Temas e Gaps**
- Agente: Analisador Temático
- O que recebe: conteúdo indexado + FAQ de atendimento
- O que entrega: mapa mostrando quais temas têm boa cobertura documental e quais aparecem no FAQ mas não têm procedimento formal. Exemplo: "35% das perguntas do FAQ são sobre prazos de entrega, mas apenas 2 documentos cobrem esse tema."
- Duração estimada: Dias 3-4

**Output 4 — Relatório de Qualidade de Extração**
- Agente: Avaliador de Qualidade
- O que recebe: documentos por formato
- O que entrega: classificação dos documentos em três categorias: (a) prontos para indexação, (b) precisam de tratamento especial (OCR, parsing de tabela), (c) não indexáveis sem intervenção humana.
- Duração estimada: Dias 3-4

**Output 5 — Relatório de Hipóteses para Discovery**
- Agente: Sintetizador
- O que recebe: outputs dos 4 agentes anteriores
- O que entrega: documento consolidado com hipóteses priorizadas para validação humana. Este relatório é o que o Product Specialist usa para montar os roteiros de entrevista.
- Duração estimada: Dia 5

---

### Fase 2: Discovery Humano (Dias 4 a 10)

O discovery humano começa no final da Semana 1 (quando o relatório de hipóteses fica disponível) e ocupa toda a Semana 2.

**Atividade 1 — Preparação dos Roteiros (Dias 4-5, Semana 1)**
- Quem: Product Specialist
- O que: Analisar o relatório de hipóteses e transformar em roteiros de entrevista focados. Cada entrevista é desenhada para validar uma hipótese específica, não para "explorar livremente".
- Por que humano: Decidir quais hipóteses valem a pena investigar é uma decisão de negócio, não de análise de dados.

**Atividade 2 — Entrevistas com Atendentes (Dias 1-2, Semana 2)**
- Quem: Product Specialist + DM
- O que: 6 a 8 entrevistas de 45 minutos com atendentes de diferentes turnos e perfis
- Por que humano: Atendentes revelam workarounds informais, frustrações e contextos que nunca aparecem em documentação. "Quando o sistema não ajuda, eu pergunto para a Maria do turno da manhã" — essa informação não existe em nenhum PDF.

**Atividade 3 — Validação com Supervisores (Dias 2-3, Semana 2)**
- Quem: Product Specialist
- O que: Apresentar o mapa de temas e prioridades para os supervisores e pedir validação: "O que é mais urgente?" não é necessariamente "o que aparece mais nos documentos".
- Por que humano: Priorização é decisão de liderança, não de frequência estatística.

**Atividade 4 — Resolução de Contradições (Dias 3-4, Semana 2)**
- Quem: DM + Compliance da NovaTech
- O que: Workshop com a lista de documentos conflitantes mapeada pelos agentes. Para cada par, definir formalmente qual versão é vigente e documentar a decisão.
- Por que humano: "Qual PROC-042 vale?" é uma decisão legal e operacional. Nenhum agente de IA pode decidir qual regra de negócio está em vigor.

**Atividade 5 — Validação do Catálogo (Dia 4, Semana 2)**
- Quem: Tech Lead + TI NovaTech
- O que: Verificar se o catálogo gerado pelos agentes está correto — fontes, metadados, formatos identificados.
- Por que humano: Confirmação técnica de que o pipeline de dados está partindo de uma base confiável.

**Atividade 6 — Sessão de Priorização Final (Dia 5, Semana 2)**
- Quem: DM + Diretoria NovaTech
- O que: Com todos os inputs consolidados, decidir: (a) quais documentos entram na V1 do assistente, (b) critérios de sucesso formais, (c) responsável pela curadoria contínua.
- Por que humano: Definir escopo e métricas de aceitação é decisão de negócio com impacto contratual.

---

## Cronograma Visual

```
╔═══════════════════════════════════════════════════════════════════════╗
║  DISCOVERY ASSISTENTE IA NOVATECH — 2 SEMANAS                       ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                     ║
║  SEMANA 1                                                           ║
║  ─────────────────────────────────────────────────────────────────   ║
║  Seg       Ter       Qua       Qui       Sex                        ║
║                                                                     ║
║  🤖 INTENT (agentes de IA)                                          ║
║  [Catálogo      ]                                                   ║
║  D1 ─────────── D2                                                  ║
║            [Inconsist.]                                              ║
║            D2 ──────── D3                                            ║
║                     [Temas + Qual.]                                  ║
║                     D3 ─────────── D4                                ║
║                                [Relatório]                           ║
║                                D4 ──── D5                            ║
║                                                                     ║
║  👤 DISCOVERY (início)                                               ║
║                                [Prep. Roteiros]                      ║
║                                D4 ────────── D5                      ║
║                                                                     ║
║  SEMANA 2                                                           ║
║  ─────────────────────────────────────────────────────────────────   ║
║  Seg       Ter       Qua       Qui       Sex                        ║
║                                                                     ║
║  👤 DISCOVERY (continuação)                                          ║
║  [Entrev. Atendentes]                                               ║
║  D1 ────────── D2                                                   ║
║            [Valid. Supervisores]                                     ║
║            D2 ──────── D3                                            ║
║                     [Workshop Contradições]                          ║
║                     D3 ─────────── D4                                ║
║                                [Valid. Catálogo]                     ║
║                                D4                                    ║
║                                          [Priorização]              ║
║                                          D5                          ║
║                                                                     ║
║  ENTREGÁVEL: Discovery Report + Escopo MVP (Sexta S2)               ║
╚═══════════════════════════════════════════════════════════════════════╝

🤖 = Agentes de IA    👤 = Atividade humana
Cada atividade depende da anterior na mesma fase.
```

---

## O que a NovaTech precisa fornecer

| O quê | Quem na NovaTech | Quando | Se atrasar |
|-------|-----------------|--------|------------|
| Credenciais SharePoint (conta de serviço) | TI | Antes do Dia 1 | Bloqueia todo o Intent |
| Token API Confluence | TI | Antes do Dia 1 | Bloqueia indexação wiki |
| Acesso à pasta de rede / exportação planilhas | Comercial | Antes do Dia 1 | Bloqueia análise de planilhas |
| 1 contato por área (Operações, Compliance, Comercial) | Gestão | Antes do Dia 1 | Bloqueia agendamento de entrevistas |
| 6–8 atendentes disponíveis (45 min cada) | RH / Operações | Semana 2, Dias 1-2 | Bloqueia discovery de campo |
| 2 supervisores disponíveis | Operações | Semana 2, Dias 2-3 | Bloqueia validação de prioridades |
| Compliance disponível para workshop | Compliance | Semana 2, Dias 3-4 | Bloqueia resolução de contradições |
| Diretoria para sessão final | Diretoria | Semana 2, Dia 5 | Bloqueia definição de escopo V1 |

**Ponto crítico:** Os acessos técnicos (SharePoint, Confluence, pasta de rede) são pré-requisitos absolutos. Se chegarem no Dia 3 ao invés do Dia 0, o Intent perde 3 dias e toda a segunda semana comprime. Formalizar no contrato.

---

## Notas sobre o Processo com Claude

**Rodada 1 — Estrutura inicial:**
> "Preciso planejar 2 semanas de discovery para um projeto de RAG com ~1.250 documentos. No modelo AI First, agentes analisam antes dos humanos. Me ajuda a definir quais atividades são de agentes e quais de humanos."

Problema: O Claude misturou tudo — sugeria entrevistas no Dia 1 junto com análise de IA, sem reconhecer que o output dos agentes é input para os roteiros de entrevista.

**Rodada 2 — Forçando dependências:**
> "O plano está errado. O Product Specialist não pode preparar roteiros sem o relatório dos agentes. Reorganiza mostrando que Intent vem antes e o discovery humano depende dele."

O Claude reorganizou com dependências explícitas, deixando claro que os roteiros de entrevista são derivados do relatório de hipóteses.

**Rodada 3 — Justificando "por que humano":**
> "Para cada atividade humana, me diz: por que um agente de IA não pode fazer isso?"

Isso forçou justificativas concretas — validação, priorização e decisões de vigência exigem julgamento contextual e autoridade organizacional que agentes não possuem.
