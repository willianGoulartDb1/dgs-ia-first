# Plano de Habilitação — Assistente IA NovaTech

**Autor:** Willian Goulart — Product Specialist (DB1)  
**Data:** 2026-06-05  
**Versão:** 1.0

---

## Por que Habilitação é Crítica

Um produto excelente morre se os usuários não confiam nele. Os 45 atendentes da NovaTech vão receber uma ferramenta nova no Teams — ferramenta que já usam diariamente. A barreira não é técnica (já usam Teams), é de confiança: "Posso confiar nessa resposta para repassar ao cliente?"

Se os primeiros 3 dias forem negativos, o assistente vira "aquele bot que ninguém usa".

---

## Quem são os Usuários

| Atributo | Valor |
|--|--|
| Quantidade | 45 atendentes |
| Volume diário | ~7 chamados/pessoa (~320 total) |
| Ferramenta | Microsoft Teams |
| Nível técnico | Intermediário (confortáveis com Teams, Excel, SharePoint) |
| Maior medo | "Vai dar resposta errada e eu vou parecer incompetente" |
| Motivação | Gastar menos tempo procurando em 1.250 documentos |

**Audiências secundárias:** Supervisores (validam qualidade), Curador de documentação (mantém base), Suporte técnico DB1 (resolve problemas).

---

## 3 Fases

### Fase 1: Antes do Lançamento (D-7 a D-0)

**Artefato 1 — Vídeo Demo (3-5 min, assíncrono)**

Cenário: atendente recebe pergunta sobre frete → abre assistente no Teams → pergunta em linguagem natural → recebe resposta com fonte em < 5 seg → valida e repassa.

Com legendas em português e link para documentação completa.

**Artefato 2 — Guia Rápido (1 página, laminado)**

"5 Passos para Usar o Assistente":
- Exemplos de perguntas boas: "Qual o SLA para devolução de eletrônicos?"
- Exemplos de perguntas que não funcionam: "Este cliente pode devolver?" (exige julgamento)
- O que fazer quando o assistente diz "não encontrei"

**Artefato 3 — FAQ Interno**

"O que ele faz / O que não faz / E se a resposta estiver errada? / Como reportar erro?"

**Sessão de Treinamento (D-2, obrigatória)**
- 30 min por turno (3 sessões para cobrir 45 atendentes)
- Agenda: contexto (5 min) → demo ao vivo (10 min) → hands-on (10 min) → Q&A (5 min)
- Meta: 80%+ de atendentes presentes ou assistindo gravação

**Checklist de qualidade (D-5, assinado pelo Tech Lead):**
- [ ] 50 queries de teste com > 85% acurácia
- [ ] Todas as respostas com citação de fonte
- [ ] Latência < 5 seg
- [ ] Mensagens de erro claras
- [ ] Integração Teams testada em múltiplos dispositivos

---

### Fase 2: Lançamento (D-0)

**E-mail de anúncio:**
> 🚀 O Assistente de IA está ao vivo no Teams!
> Como usar: conversa com @assistente ou chat direto.
> Exemplo: "Qual o prazo de devolução para eletrônicos?"
> O assistente busca na documentação oficial. Se não está documentado, ele avisa.
> Dúvidas? Canal #assistente-ia-suporte.

**Canal de suporte:** #assistente-ia-suporte no Teams, monitorado por Tech Lead + PS. SLA de resposta: < 2h durante horário comercial.

---

### Fase 3: Pós-Lançamento (D+1 a D+30)

**Feedback inline:** Cada resposta tem 👍/👎. Ao clicar 👎: popup com categorias (resposta errada / não encontrou / difícil de entender).

**Survey semanal (D+7, D+14, D+21):** Confiança (1-10), pergunta que mais falha (texto livre), NPS simples.

**Focus group (D+14):** 5-7 atendentes que mais usaram. Objetivo: entender barreiras e perguntas não suportadas.

**Dashboard de adoção:**

| Métrica | D+1 | D+7 | D+30 | Meta |
|--|--|--|--|--|
| Usuários ativos | 12 | 30 | 40 | 45 |
| Queries/dia | 25 | 150 | 250 | 300+ |
| Taxa de resposta útil | — | 72% | 78% | 80%+ |
| Taxa de erro | — | 8% | 4% | < 5% |
| Tempo médio de busca | 11 min | 5 min | 2.5 min | < 3 min |

**Gatilhos de ação:**
- Adoção < 50% em D+7 → sessão de re-engajamento + análise de barreiras
- Taxa de erro > 10% → revisar top 20 queries com erro e corrigir

**Ciclo de melhoria (semanal):**
1. Coleta (D+1 a D+7): feedback inline + tickets
2. Análise (D+8): padrões de erro
3. Fix (D+9-10): ajuste de prompt, re-indexação
4. Deploy (D+11): mudanças ativas
5. Comunicação (D+12): "Melhoramos as respostas sobre frete — teste agora"

---

## Documentos por Fase

| Fase | Artefatos |
|--|--|
| Pré-lançamento | Vídeo demo, guia rápido, FAQ interno, slide deck, checklist de qualidade |
| Lançamento | E-mail anúncio, mensagem Teams, canal de suporte |
| Pós-lançamento | Dashboard adoção, log de feedback, NPS semanal, relatório D+14, relatório D+30 |

---

## Um Dia na Vida do Atendente (D+1)

```
08:30 — Assiste vídeo demo (3 min)
09:00 — Lê guia rápido (impresso na mesa)
10:00 — Sessão ao vivo (30 min)
10:35 — Experimenta 2 perguntas teste
11:00 — Volta para fila de chamados

16:00 — Primeiro chamado com assistente:
         "Qual o prazo de devolução para eletrônicos?"
         Assistente: "Conforme POL-001, seção 3.2: 30 dias..."
         Atendente valida → repassa → clica 👍

16:05 — Feedback registrado. +1 usuário adotando.
```
