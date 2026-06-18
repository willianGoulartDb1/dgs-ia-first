# Comunicação de Expectativas — Resposta ao Diretor da NovaTech

**Autor:** Willian Goulart — Delivery Manager (DB1)  
**Data:** 2026-06-05  
**Versão:** 1.0

---

## Parte A — E-mail ao Diretor de Operações

---

**De:** Willian Goulart — Delivery Manager, DB1  
**Para:** [Diretor de Operações] — NovaTech  
**Assunto:** Re: Projeto Assistente de IA — Próximos passos e expectativas

---

[Nome],

Obrigado pelo entusiasmo — compartilhamos dele. É exatamente por querer que o projeto entregue resultados reais que quero ser transparente sobre o que podemos esperar.

**Como funciona na prática:**

Pense no assistente como um pesquisador dedicado que memorizou todos os manuais da NovaTech. Quando um atendente faz uma pergunta, ele folheia esses manuais em milissegundos, encontra o trecho mais relevante, e entrega a resposta citando de onde tirou. Rápido, preciso nos temas cobertos, e sempre rastreável.

Mas — como qualquer pesquisador — ele depende do que está nos manuais. Se um manual estiver desatualizado, a resposta reflete isso. Se a pergunta for sobre algo que nenhum manual cobre, ele avisa que não encontrou. E se a situação exigir julgamento ("esse caso específico merece exceção?"), o atendente continua tomando essa decisão.

Isso é uma força: diferente de uma busca genérica no Google, o assistente responde **apenas com base na documentação oficial** de vocês. Quando ele dá uma resposta, ela é verificável. Quando ele não sabe, ele diz.

**O que é diferente do Copilot?**

O Copilot que o CEO viu é um produto da Microsoft com anos de desenvolvimento e integração profunda com o Office inteiro. O que vamos construir é mais focado e mais honesto: especializado nos documentos da NovaTech, sem tentar fazer tudo. É como a diferença entre um canivete suíço e uma chave de fenda profissional — a chave resolve o problema específico com mais precisão.

**Como vamos medir o sucesso:**

Proponho três indicadores objetivos para avaliarmos 30 dias depois do lançamento:

1. **Rapidez:** Tempo de busca reduzido de 12 minutos para menos de 3 minutos nos tipos de pergunta mais comuns (frete, SLA, devolução).

2. **Confiabilidade:** Pelo menos 70% das respostas acompanhadas de citação do documento e seção específica que o atendente pode verificar.

3. **Autonomia:** Taxa de escalação por "não encontrei a informação" reduzida de 15% para menos de 8%.

Esses números são conservadores e alcançáveis. Prefiro que a gente comemore ter superado as metas do que explique por que ficamos abaixo.

**Um ponto importante de parceria:**

A qualidade do assistente é diretamente proporcional à qualidade da documentação que alimenta o sistema. Por isso, durante as primeiras duas semanas, vamos trabalhar juntos para mapear quais documentos estão prontos, quais têm versões conflitantes, e quais precisam de revisão. Essa parceria é o que garante que as respostas sejam confiáveis desde o dia 1.

Anexo um resumo visual de uma página mostrando como o assistente funciona — ideal para compartilhar com o CEO e com o time antes do lançamento.

Podemos agendar uma call esta semana para detalhar?

Abs,  
Willian Goulart  
Delivery Manager — DB1

---

## Parte B — Resumo Visual (One-Pager)

```
╔═══════════════════════════════════════════════════════════════════════╗
║         ASSISTENTE IA NOVATECH — RESUMO PARA EXECUTIVOS             ║
╚═══════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────┐
│  COMO FUNCIONA (em 4 passos)                                │
│                                                             │
│  1. Atendente digita a pergunta no Teams                    │
│           ↓                                                 │
│  2. Sistema busca nos documentos oficiais da NovaTech       │
│     (800 PDFs + 400 páginas Confluence + 50 planilhas)      │
│           ↓                                                 │
│  3. Seleciona os trechos mais relevantes                    │
│           ↓                                                 │
│  4. Entrega: RESPOSTA + DOCUMENTO + SEÇÃO EXATA             │
│                                                             │
│  O atendente valida e usa no atendimento.                   │
│  Se não encontrou → avisa e sugere escalar.                 │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────┐  ┌──────────────────────────────┐
│  ✅ O QUE FAZ BEM        │  │  ❌ FORA DO ESCOPO V1         │
│                          │  │                              │
│  • Responde em segundos  │  │  • Julgar casos ambíguos     │
│    perguntas sobre SLA,  │  │    ("devo aceitar isso?")     │
│    frete, devoluções     │  │                              │
│                          │  │  • Responder sobre temas     │
│  • Cita documento e      │  │    não documentados          │
│    seção exata           │  │                              │
│                          │  │  • Atualizar sozinho quando  │
│  • Avisa quando NÃO      │  │    documentos mudam          │
│    encontra a info       │  │                              │
│                          │  │  • Substituir julgamento     │
│  • Funciona no Teams     │  │    do atendente              │
│    (sem trocar sistema)  │  │                              │
└──────────────────────────┘  └──────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  📊 COMO MEDIMOS SUCESSO (avaliação em D+30)                │
│                                                             │
│  TEMPO         COBERTURA        ESCALAÇÕES                  │
│  < 3 min       70% respostas    < 8% precisam               │
│  (hoje: 12)    com fonte        escalar                     │
│                verificável      (hoje: 15%)                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  🔑 PRINCÍPIO CENTRAL                                       │
│                                                             │
│  "Assistente bom = documentação boa."                       │
│  A qualidade das respostas depende da qualidade             │
│  dos documentos que alimentam o sistema.                    │
│  Por isso, trabalhamos JUNTOS no discovery.                 │
└─────────────────────────────────────────────────────────────┘

              DB1 × NovaTech | Projeto Assistente IA | 2026
```

---

## Parte C — Notas sobre o Processo com Claude

O e-mail foi construído em 3 rodadas com o Claude:

**Rodada 1 — Rascunho inicial:**
> "Preciso responder ao diretor da NovaTech que está esperando um assistente 'que saiba tudo como o Copilot'. Escreva um e-mail que corrija essa expectativa sem desanimar o patrocinador."

O primeiro rascunho veio repleto de jargão técnico: "RAG", "embeddings", "janela de contexto", "temperatura do modelo". Adequado para um engenheiro, não para um diretor de operações.

**Rodada 2 — Tradução para linguagem executiva:**
> "O diretor não é técnico. Troque todo jargão por explicações que um gestor de operações entenda. Use uma analogia do dia a dia. A sigla 'RAG' precisa desaparecer ou ser explicada em uma frase."

O Claude reformulou com a analogia do "pesquisador dedicado" — precisa mas acessível. Mantive porque comunica exatamente a ideia de um sistema competente porém limitado pelo que lhe foi dado.

**Rodada 3 — Critérios de sucesso concretos:**
> "Os critérios de sucesso do rascunho são vagos: 'o assistente vai funcionar bem'. Substitua por métricas que eu consiga medir 30 dias após o go-live, derivadas dos dados reais do briefing (12 min de busca hoje, 15% de escalação)."

O Claude propôs os três critérios quantitativos usando os dados reais do briefing como baseline. Ajustei para números conservadores (< 3 min ao invés de < 2 min) porque prefiro prometer menos e entregar mais.

**Sobre o One-Pager:** Estruturado em formato de texto visual para representar o que seria gerado no Claude Cowork — um documento de uma página com fluxo de funcionamento, comparação "faz bem vs. fora de escopo", métricas de sucesso e o princípio de que qualidade do assistente = qualidade da documentação.
