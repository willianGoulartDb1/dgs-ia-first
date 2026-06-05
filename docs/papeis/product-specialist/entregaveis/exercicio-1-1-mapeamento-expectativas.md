# Mapeamento de Expectativas — Assistente IA NovaTech

**Autor:** Willian Goulart — Product Specialist (DB1)  
**Data:** 2026-06-05  
**Versão:** 1.0

---

## O Problema Central

Antes de construir qualquer coisa, preciso resolver o maior risco deste projeto: **a diretoria da NovaTech espera algo que a tecnologia não entrega**. Eles querem um assistente que "saiba tudo" e que faça os atendentes "não procurarem mais nada manualmente". LLMs com RAG são sistemas probabilísticos — respondem com base no que foi indexado, podem errar, e não substituem julgamento humano.

Se não corrigirmos essa expectativa antes do kickoff, qualquer resultado técnico será percebido como fracasso.

---

## Gap 1: "O Assistente Sabe Tudo"

**O que a diretoria disse:** O assistente será uma enciclopédia viva da empresa.

**O que a tecnologia entrega:**

| Aspecto | Expectativa | Realidade | Consequência |
|--|--|--|--|
| Cobertura | Qualquer pergunta | Apenas o que foi indexado | "Não encontrei" para temas fora da base |
| Precisão | 100% correto | ~85-90% em contexto bem definido | 1 em 10 respostas pode ter imprecisão |
| Velocidade | Instantâneo | 2-5 segundos | Perceptivelmente mais lento que uma busca Google |
| Atualização | Tempo real | Ciclos de re-indexação (< 24h) | Informação até 24h defasada |

**Como comunicar sem desmotivar:**

> "O assistente não inventa respostas — ele busca nos documentos oficiais e sintetiza. Se algo não está na base, ele avisa explicitamente. Isso é uma qualidade: garante que você confia no que ele diz."

**Meta mensurável:** 70% das perguntas respondidas com citação de fonte verificável em até 30 segundos.

---

## Gap 2: "Os Atendentes Não Precisam Mais Procurar"

**O que a diretoria disse:** Tempo de busca de 12 para < 2 minutos. Ninguém precisa mais abrir documento manualmente.

**O que a tecnologia entrega:**

| Aspecto | Expectativa | Realidade | Consequência |
|--|--|--|--|
| Tempo | < 2 min sempre | 2-5 seg de latência; busca manual em 15-20% dos casos | Nem tudo será rápido |
| Cobertura | 100% dos chamados | 70-80% útil; 20-30% exige julgamento humano | Pesquisa manual continua existindo |

**Reframing proposto:**

> "O assistente é o primeiro filtro — resolve 70-80% rápido. Para os 20-30% restantes, ele indica qual documento consultar — em vez de vasculhar 1.250 fontes."

**Meta mensurável:** Tempo médio < 3 min (redução de 75%). 70-80% das queries resolvidas sem consulta manual adicional.

---

## Gap 3: "Respostas Sempre Atualizadas"

**O que a diretoria disse:** O assistente sempre usa a versão vigente.

**Problema concreto:** PROC-042 e PROC-042-v2 coexistem com multiplicadores diferentes, sem indicação de vigência. O pipeline de RAG recupera por similaridade semântica, não por data — pode trazer a versão errada.

**Pré-condições para go-live:**
1. Resolver formalmente todas as contradições documentadas antes da ingestão
2. Metadados de vigência obrigatórios para novos documentos
3. Comunicar aos atendentes: "Se o documento que você tem é mais recente que o citado pelo assistente, use o mais recente."

**Meta mensurável:** 100% dos documentos com metadado de vigência no go-live. Taxa de escalação por "resposta desatualizada" < 2%.

---

## Gap 4: "Funciona Sem Esforço Adicional"

**O que a diretoria disse:** O sistema funciona com a documentação como está, sem curadoria.

**Realidade:** PDFs com tabelas como imagem, documentos escaneados, planilhas com fórmulas — cada formato exige tratamento especial. E a base envelhece: sem curadoria, a qualidade degrada em semanas.

**Proposta:** Nomear um curador de documentação dentro da NovaTech. Responsável por sinalizar documentos obsoletos, resolver contradições, e acionar re-indexação.

**Plano se NovaTech não nomear curador até D-5:**

| Cenário | Ação | Impacto |
|--|--|--|
| NovaTech nomeia no prazo | Procede normalmente | Nenhum |
| Não consegue nomear | DB1 assume curadoria temporária (15 dias), sob tarifa extra, focando em destravar go-live | +15 dias de PS/Tech |
| Não quer nomear | Atrasar go-live 2 semanas para NovaTech estruturar | +14 dias no timeline |
| Go-live sem curador | **Não recomendado.** Qualidade degrada em semana 3+. | — |

---

## Como Falar com Cada Público

### Para a Diretoria

> "O Assistente funciona como um buscador inteligente treinado na documentação de vocês. Responde em segundos o que levaria 12 minutos. Não inventa. Meta: 70-80% dos chamados mais rápidos. Para manter a qualidade, a NovaTech designa um responsável pela documentação."

**Próximo passo:** Acordo formal assinado antes do kickoff com métricas, responsabilidades e pré-condições.

### Para os Atendentes

> "O assistente é seu colega de busca. Pergunta em linguagem natural, ele busca nos documentos oficiais e te dá a resposta com a fonte. Se não encontrou, avisa. Você continua validando antes de repassar ao cliente."

**Próximo passo:** Sessão de treinamento prático (30 min por turno) com demo ao vivo.

### Para o Tech Lead

> "V1 é MVP: busca documentada + síntese confiável + rastreabilidade. Não é chatbot genérico. RAG com vetorial, integração Teams, temperatura ~0. Pré-condição: PROC-042 resolvido antes da ingestão."

**Próximo passo:** Checkpoint de design do pipeline em D+5 do kickoff.

---

## Checklist Pré-Kickoff

- [ ] Sessão de expectativas com diretoria agendada
- [ ] Acordo formal assinado (objetivos, métricas, responsabilidades, pré-condições)
- [ ] Lista de contradições documentais para NovaTech resolver
- [ ] Curador de documentação nomeado
- [ ] Plano de treinamento dos atendentes definido
- [ ] Critérios de aceitação aprovados pelo sponsor
