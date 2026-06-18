# Avaliação de Viabilidade — Projeto Assistente IA NovaTech

**Autor:** Willian Goulart — Delivery Manager (DB1)  
**Data:** 2026-06-04  
**Versão:** 1.0  
**Método:** Análise colaborativa com Claude (4 iterações documentadas)

---

## Resumo para Tomada de Decisão

O projeto é **viável com condições**. A tecnologia suporta o caso de uso, mas três pré-requisitos devem ser formalizados antes de comprometer o cronograma de 3 meses: (1) auditoria dos formatos documentais, (2) resolução das contradições entre versões do PROC-042, e (3) definição da estratégia de sessão no Teams. Sem esses três pontos resolvidos, o prazo de 3 meses se torna uma aposta.

---

## Análise de Riscos por Dimensão de Impacto

Organizei os riscos não por tipo técnico, mas pela dimensão de impacto no projeto — porque é assim que a diretoria avalia: o que pode atrasar, o que pode custar mais, e o que pode comprometer o resultado.

### Dimensão 1 — Riscos que Ameaçam o Prazo

#### R1: Descoberta tardia de documentos que exigem tratamento especial

A NovaTech opera com ~800 PDFs no SharePoint. O briefing técnico já confirma que existem tabelas renderizadas como imagem, fluxogramas embutidos e documentos escaneados. Cada tipo exige uma abordagem diferente de extração — e o esforço para tratar OCR ou parsing de tabelas complexas é significativamente maior que extração de texto simples.

O problema não é a existência desses formatos (é esperado), mas sim **quando** descobrimos a proporção real. Se 30% da base exigir OCR e só percebermos isso na sprint 2, o pipeline de ingestão precisa ser redesenhado — e 3 meses viram 4.

| Atributo | Avaliação |
|----------|-----------|
| Probabilidade | **Alta** — formatos problemáticos confirmados no briefing |
| Impacto no prazo | **Alto** — pode adicionar 3-4 semanas ao pipeline |
| Impacto no custo | **Alto** — ferramentas de OCR e parsing especializadas elevam esforço |

**O que fazer antes de começar:** Solicitar acesso ao SharePoint na semana 0 e rodar uma amostragem automatizada de 100 PDFs para categorizar por tipo (texto nativo, tabela complexa, escaneado). Essa amostragem leva 2 dias e evita surpresas na sprint 3.

---

#### R2: Dependências externas bloqueantes com a NovaTech

A fase de Intent dos agentes de IA não começa sem acesso às três fontes documentais (SharePoint, Confluence, pasta de rede). A fase de Discovery humano depende de disponibilidade de atendentes, supervisores e Compliance. Se algum desses acessos ou pessoas não estiver disponível no dia previsto, o cronograma comprime.

| Atributo | Avaliação |
|----------|-----------|
| Probabilidade | **Média** — acesso a SharePoint corporativo costuma ter burocracia de TI |
| Impacto no prazo | **Alto** — cada dia de atraso no acesso é um dia perdido de Intent |
| Impacto no custo | **Baixo** — equipe ociosa por espera, mas sem custo adicional direto |

**O que fazer antes de começar:** Formalizar todas as dependências em um checklist de pré-requisitos assinado pelo sponsor da NovaTech, com datas-limite. Acesso às fontes deve estar liberado no D-3 (três dias antes do início oficial).

---

### Dimensão 2 — Riscos que Ameaçam o Custo

#### R3: Curadoria documental fora do escopo original

A NovaTech possui ao menos um caso documentado de contradição (PROC-042 e PROC-042-v2 com multiplicadores de frete diferentes). A resolução de contradições como essa — decidir qual versão é vigente, adicionar metadados de data de validade, depreciar versões antigas — é trabalho de curadoria que não estava previsto no escopo original. Se houver 10-15 documentos nessa situação (razoável para uma base de 1.250), estamos falando de 3-5 dias adicionais de trabalho que impactam custo e escopo.

| Atributo | Avaliação |
|----------|-----------|
| Probabilidade | **Alta** — NovaTech confirma que contradições existem e são resolvidas informalmente |
| Impacto no custo | **Alto** — curadoria envolve Compliance, Comercial e Operações do lado NovaTech |
| Impacto no prazo | **Médio** — pode ser paralelizado se identificado cedo |

**O que fazer antes de começar:** Definir com a NovaTech de quem é a responsabilidade de resolver contradições. Se for responsabilidade deles: formalizar no contrato como pré-requisito. Se for escopo DB1: ajustar estimativa de esforço e custo.

---

#### R4: Expectativa de funcionalidades além do RAG básico

A diretoria espera algo "como o Copilot". O Copilot da Microsoft é um produto enterprise com anos de desenvolvimento, integração profunda com o ecossistema Office, e capacidades de ação (não apenas consulta). Um assistente RAG para consulta documental é uma fração disso. Se essa diferença não for gerenciada, a diretoria pode solicitar funcionalidades fora do escopo (integração com ERP, ações automáticas em chamados, análise preditiva) durante o projeto.

| Atributo | Avaliação |
|----------|-----------|
| Probabilidade | **Alta** — o gap de expectativa é explícito no briefing do diretor |
| Impacto no custo | **Alto** — scope creep é o assassino silencioso de projetos de IA |
| Impacto na qualidade | **Médio** — foco dividido entre entregas compromete todas |

**O que fazer antes de começar:** Sessão de alinhamento de expectativas com a diretoria antes do kickoff, apresentando: o que o assistente V1 faz (busca e sintetiza documentação), o que fica para versões futuras, e métricas objetivas de sucesso.

---

### Dimensão 3 — Riscos que Ameaçam a Qualidade

#### R5: Alucinação em respostas operacionais

O LLM pode gerar respostas que parecem corretas mas não têm base documental — inventar um multiplicador de frete, criar um prazo de devolução que não existe, ou sintetizar um procedimento combinando partes de documentos diferentes. No contexto da NovaTech, onde atendentes usam as respostas para orientar clientes, uma alucinação confiante pode resultar em cobrança errada de frete ou orientação incorreta sobre devolução.

O agravante: a base da NovaTech tem lacunas conhecidas (atendentes hoje resolvem "perguntando para quem sabe"). Exatamente nesses cenários de lacuna, o modelo tende a "completar" com inferências plausíveis mas fabricadas.

| Atributo | Avaliação |
|----------|-----------|
| Probabilidade | **Alta** — lacunas documentais + natureza probabilística do LLM |
| Impacto na qualidade | **Crítico** — resposta errada com confiança é pior que nenhuma resposta |
| Impacto no custo | **Médio** — requer guardrails determinísticos no pipeline |

**O que fazer antes de começar:** Definir como requisito de arquitetura que toda resposta deve incluir citação de fonte verificável. Implementar uma camada de pós-processamento que rejeite respostas sem referência a documento antes de exibi-las ao atendente. Incluir nos critérios de aceitação cenários onde a resposta correta é "não encontrei na documentação".

---

#### R6: Degradação silenciosa em sessões longas no Teams

O assistente será usado no Teams, onde uma sessão de chat pode se estender ao longo de um turno inteiro. À medida que o histórico de conversa cresce (10, 15, 20 perguntas na mesma sessão), ele compete por espaço no contexto do modelo com os chunks relevantes para a pergunta atual. O resultado: a 15ª pergunta de uma sessão recebe uma resposta pior que a 1ª, sem que ninguém perceba a causa. O atendente só nota que "às vezes funciona e às vezes não" — e a confiança cai.

Além disso, chunks posicionados no meio de um contexto muito extenso tendem a ser subprocessados pelo modelo (fenômeno "lost in the middle"), agravando o problema.

| Atributo | Avaliação |
|----------|-----------|
| Probabilidade | **Alta** — inevitável dado o canal (Teams com sessões persistentes) |
| Impacto na qualidade | **Alto** — degradação invisível em testes unitários, visível em uso real |
| Impacto no prazo | **Médio** — requer prototipagem e teste de estratégia de contexto |

**O que fazer antes de começar:** O Tech Lead precisa definir limites de contexto por sessão antes de iniciar o desenvolvimento: quantos turnos de histórico manter, quantos chunks por query, e qual a política de truncamento. Sem isso, a degradação aparece em produção e parece bug aleatório.

---

## Perguntas ao Tech Lead Antes de Travar o Cronograma

Formulei três perguntas que atacam os pontos onde a decisão técnica impacta diretamente a viabilidade do prazo de 3 meses.

**1. Qual é a real composição dos 800 PDFs?**

"Antes de travar o cronograma, preciso de uma amostragem dos PDFs do SharePoint. Especificamente: qual percentual é texto puro, qual tem tabelas como imagem, e qual é documento escaneado que vai precisar de OCR? Porque a diferença entre 'tudo é texto nativo' e '40% precisa de OCR' é a diferença entre cumprir e não cumprir o prazo de 3 meses. Consigo rodar essa amostragem na semana 0 se tiver acesso ao SharePoint."

*Por que importa:* A estratégia de extração muda completamente conforme o formato. Se presumirmos que tudo é texto nativo e descobrirmos na sprint 2 que não é, o retrabalho consome semanas.

**2. Quem decide qual PROC-042 vale?**

"O PROC-042 tem duas versões com valores diferentes. Para o pipeline de RAG, preciso saber: a NovaTech resolve essa contradição antes da ingestão (e me entrega uma base limpa), ou eu preciso construir lógica de versionamento no pipeline? Se for lógica no pipeline, são 3-5 dias adicionais de desenvolvimento + validação. Se for dependência deles, precisa estar no cronograma como pré-requisito com data."

*Por que importa:* Sem hierarquia de versão, o assistente pode misturar multiplicadores das duas versões numa mesma resposta — e o atendente não tem como saber qual está correto.

**3. Como controlamos o contexto nas sessões do Teams?**

"O assistente vai rodar no Teams com sessões persistentes. Preciso que a gente defina agora: teto de tokens por query, número máximo de chunks recuperados, e política de truncamento de histórico. Porque se deixarmos crescer sem limite, lá pela 10ª pergunta de uma sessão a qualidade cai — e o problema parece aleatório em produção. Isso precisa estar na arquitetura, não como correção depois."

*Por que importa:* Context rot em sessões longas é invisível em testes automatizados e só aparece em uso real continuado. É o tipo de problema que destrói a confiança do usuário porque parece inconsistência inexplicável.

---

## Registro do Processo com Claude

Documentar como usei o Claude não é apenas evidência — é demonstração de que o output foi refinado criticamente, não aceito cegamente.

**Rodada 1 — Ponto de partida:**

Forneci ao Claude o briefing completo da NovaTech e pedi uma lista de riscos técnicos ligados às limitações de LLMs.

> Prompt: "Sou DM de um projeto de assistente de IA com RAG para uma empresa de logística. A base tem ~1.250 documentos em SharePoint, Confluence e planilhas. Quais riscos técnicos de LLM podem afetar prazo, custo e qualidade?"

O Claude retornou 5 riscos genéricos: alucinação, viés, privacidade, custo de API, resistência dos usuários. Útil como checklist, mas desconectado da realidade da NovaTech.

**Rodada 2 — Contextualização forçada:**

Percebi que sem contexto específico, qualquer LLM retorna riscos de manual. Forneci detalhes do caso.

> Prompt: "Esses riscos estão genéricos. Me ajuda a reescrever considerando: existem dois PROC-042 com multiplicadores diferentes, PDFs com tabelas como imagem, e integração via Teams com sessões longas."

O Claude conectou alucinação ao cenário das duas versões do PROC-042, mostrando como o assistente poderia misturar multiplicadores de versões diferentes na mesma resposta. Essa conexão não estava na versão genérica.

**Rodada 3 — Adicionando o risco de sessão:**

O Claude não havia mencionado context rot espontaneamente. Forcei o ponto.

> Prompt: "Faltou o risco de degradação por sessão longa. No Teams, um atendente pode fazer 10+ perguntas seguidas. Com ~1.250 fontes e chunks recuperados a cada query, como isso degrada?"

O Claude trouxe a análise de "lost in the middle" e o efeito de acúmulo de histórico competindo com chunks novos. Essa era exatamente a dimensão que eu queria — um risco que só aparece em uso real, não em testes.

**Rodada 4 — Filtrando ações reais de wishful thinking:**

O ponto fraco das iterações anteriores era que algumas mitigações eram genéricas ("monitorar a qualidade"). Desafiei o Claude a tornar tudo acionável.

> Prompt: "Revisa cada mitigação e me diz: é algo que o time pode implementar com sprint planning, ou é wishful thinking? Se for genérico tipo 'monitorar', substitui por uma ação concreta."

O Claude identificou que "monitorar qualidade" precisava virar "implementar critério de exclusão de documentos com OCR < 75% de confiança" e que "ficar atento a contradições" precisava virar "exigir resolução formal de contradições como gate de go-live".

**Lição do processo:** O Claude é excelente para gerar um primeiro rascunho abrangente, mas precisa de 2-3 rodadas de refinamento com contexto específico e desafio crítico para produzir algo que tenha valor real para tomada de decisão.
