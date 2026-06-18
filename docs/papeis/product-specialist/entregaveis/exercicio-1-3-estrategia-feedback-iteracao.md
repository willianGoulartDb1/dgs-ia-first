# Estratégia de Feedback e Iteração — Assistente NovaTech

**Autor:** Willian Goulart — Product Specialist (DB1)  
**Data:** 2026-06-05  
**Versão:** 1.1

---

## A Natureza do Problema

Produtos com LLM não funcionam como software tradicional. Não existe "deploy e pronto". A qualidade muda conforme o prompt evolui, a base documental é atualizada, e o volume real de uso revela padrões invisíveis em testes. O assistente precisa de um ciclo contínuo de feedback → análise → correção → validação.

---

## 3 Camadas de Feedback

### Camada 1: Operacional (tempo real)

O que acontece no dia a dia — dados automáticos e micro-feedbacks dos atendentes.

| Tipo | Como coleta | Frequência | Gatilho de ação |
|--|--|--|--|
| 👍/👎 em cada resposta | Botões in-product | Sempre | Se > 20% 👎 numa categoria → investigar |
| Tipo do erro (ao clicar 👎) | Popup: errada / não encontrou / confusa | Sempre que 👎 | Classificar padrão dominante |
| Tickets de suporte | Canal Teams #assistente-ia-suporte | Sob demanda | Responder < 2h; documentar padrões |
| Marcação do supervisor | Resposta marcada como "questionável" | Sob demanda | QA + ajuste de prompt |

**Dashboard (atualizado 4x/dia):**
```
Queries hoje:          145
Thumbs up:             78%
Thumbs down:           22%
  - Resposta errada:    8%
  - Não encontrou:     10%
  - Confusa:            4%

Top categoria com erro: FRETE (12%) ← investigar
```

---

### Camada 2: Estruturada (semanal)

Coleta planejada para entender tendências e barreiras.

| Tipo | Método | Cadência |
|--|--|--|
| Confiança + NPS | Survey 2 min no Teams | Segundas-feiras |
| Por que não usa? | Supervisor pergunta em 1:1 | Semanal (para usuários com < 2 queries/semana) |
| Perguntas não suportadas | "O que o assistente deveria responder mas não responde?" | Semanal (survey) |
| Focus group | 5-7 power users + 1-2 que abandonaram | Bi-semanal |

**Survey semanal (2 min):**
```
1. Usou o Assistente na última semana? [Sim múltiplas / Sim 1-2x / Não]
2. Confiança nas respostas (1-10): [slider]
3. Pergunta que mais falha: [texto livre]
4. Como se sente usando: [Confiante / Curioso / Desconfiado / Frustrado]
```

---

### Camada 3: Diagnóstica (mensal)

Análise profunda para decisões de produto.

| Tipo | Método | Output |
|--|--|--|
| Deep dive em erros | Top 20 queries com > 15% erro | Causas raízes + fixes |
| Análise de abandono | Entrevistas com quem parou de usar | Recomendações de UX |
| Auditoria documental | Quais documentos geram mais erros? | Lista para revisão |
| Mapa de cobertura | Quais temas têm mais "não encontrou"? | Docs a adicionar |

---

## Ciclos de Iteração

### Ciclo Rápido (1 semana)

```
SEGUNDA (manhã):
  Dashboard da semana anterior → categorias com > 10% erro → decidir o que mexer

SEGUNDA-TERÇA (tarde):
  Tech Lead prototipa fix (ajuste de prompt, re-indexação, ou ambos)
  → Testa com 10 perguntas da categoria

QUARTA:
  Se testes passam (< 5% erro na amostra) → deploy
  Se falham → volta ao rascunho

QUINTA-SEXTA:
  Monitoramento do fix (dashboard a cada 2h)
  Se ok → comunicar atendentes: "Melhoramos respostas sobre frete!"
  Se regressão → revert

SEGUNDA (próxima):
  Avaliar resultado → próximo problema
```

**Critério de decisão: fix agora ou documenta para depois?**

| Fix agora (< 24h) | Para revisão mensal |
|--|--|
| Erro claro no prompt | Requer mudança de arquitetura |
| Documento existe mas retrieval falha | Requer decisão de produto |
| Exemplo faltando no system prompt | Depende de política da NovaTech |

---

### Ciclo Estratégico (1 mês)

```
SEMANA 1: Coleta de dados mensais + análise diagnóstica
SEMANA 2: Revisão com sponsor (métricas vs metas)
SEMANA 3: Prototipagem de mudanças maiores
SEMANA 4: Alinhamento com NovaTech sobre saúde do produto
```

---

## Smoke Test Pré-Deploy (Golden Dataset)

LLMs são não-determinísticos. Um fix para frete pode quebrar devolução acidentalmente.

**Golden Dataset (criado em D-5):**
- 15-20 perguntas críticas distribuídas por categoria (frete, devolução, SLA, geral)
- Cada pergunta com resposta gabaritada + fonte esperada

**Script de avaliação (Tech Lead roda antes de cada deploy):**
```
Para cada pergunta do golden dataset:
  → Executar no assistente
  → LLM-as-Judge avalia: precisão, citação, clareza
  → Score < 7 = FALHA

Se pass rate < 95% → BLOQUEAR DEPLOY → investigar
```

---

## Playbook: O Que Fazer Quando

### Se erro > 10% numa categoria

1. Puxar top 10 queries com 👎
2. 70%+ "resposta errada" → problema de RAG ou prompt
3. 70%+ "não encontrou" → documento não indexado ou retrieval falho
4. Fix em < 24h → testar → deploy → comunicar
5. Monitorar por 7 dias

### Se adoção < 50% em D+7

1. Listar quem não usa
2. Entrevistar 3-5 rapidamente (5 min cada)
3. Padrão: "não confio" → mostrar exemplos corretos
4. Padrão: "não sabia usar" → re-treinar
5. Sessão de "bootcamp" com os não-usuários

### Se focus group revela caso não suportado

1. É escopo V1? → Se não, documentar para V1.1
2. É demanda real? → Quantos pediram?
3. Comunicar: "Entendemos a necessidade, planejando para V1.1"
4. Oferecer workaround imediato

---

## Métricas do Feedback Loop

| Métrica | Target | Se falhar |
|--|--|--|
| Tempo de resposta a ticket | < 2h | Adicionar recurso de suporte |
| Taxa de feedback (thumbs) | > 20% das queries | Incentivo explícito |
| Taxa de survey | > 50% semana 1; > 30% steady state | Rotacionar (5 atendentes/semana) |
| Time-to-fix | < 48h | Priorizar debugging |
| Regressão pós-fix | < 5% | Aumentar rigor do smoke test |
| NPS | > 6/10 (estável/crescendo) | Investigar insatisfação |

---

## Relatório Semanal (template)

```
FEEDBACK REPORT — Semana de [data]
══════════════════════════════════

📊 OPERACIONAL
Total queries: 425 | 👍 76% | 👎 24%
  Errada: 10% | Não encontrou: 11% | Confusa: 3%

🚨 ALERTAS
⚠️ FRETE: 14% erro (acima do target 5%) → investigando segunda
✅ DEVOLUÇÃO: 3% erro (em target)

📈 ADOÇÃO
Ativos: 38/45 (84%) | Queries/user/dia: 2.0 | Crescimento: +12%

🎯 SATISFAÇÃO
NPS: 6.8/10 | Confiança: 7.1/10 (crescendo)

📋 AÇÕES
[ ] Investigar frete (segunda)
[ ] Deploy fix (terça se validado)
[ ] Focus group (quinta)
[ ] Comunicar melhorias (sexta)
```

---

## Primeiras 4 Semanas em Ação

**Semana 1:** 76% thumbs up. FRETE com 14% erro (PROC-042 v1 vs v2 misturados). Fix: remover v1 da indexação → erro cai para 6%.

**Semana 2:** 78% thumbs up. Focus group: "adicionar mais exemplos de SLA" → backlog V1.1. 7 não-usuários identificados → bootcamp.

**Semana 3:** Bootcamp funciona: 5 de 7 agora usando. DEVOLUÇÃO sobe para 8% erro (FAQ não diferencia categorias inelegíveis). Fix: update system prompt.

**Semana 4:** 79% thumbs up. Erro < 5% em todas categorias. Adoção 93% (42/45). NPS 7.0. Review com sponsor: "V1 atingiu targets. V1.1?"
