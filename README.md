# Papéis do Projeto — Assistente IA NovaTech

> **Autor:** Willian Goulart  
> **Programa:** Trilha de Certificação AI First — DGS / DB1 Global Software  
> **Cenário:** Fase de Entendimento e Contexto

Repositório com a documentação dos papéis do projeto **Assistente de IA para Atendimento da NovaTech**, organizado sob `docs/papeis`. Cada papel possui suas tarefas, entregáveis e guias específicos.

## Estrutura Principal

- `docs/papeis/delivery-manager/`
  - Documentação do papel de Delivery Manager.
  - Contém visão geral do papel, tarefas, entregáveis e guias de planejamento.

- `docs/papeis/desenvolvedor/`
  - Documentação do papel de Desenvolvedor.
  - Foco em análise técnica, prototipação de prompt e definição do pipeline RAG.
  - Ideal para quem está implementando a solução, modelando a arquitetura de dados e validando o comportamento do assistente.

- `docs/papeis/product-specialist/`
  - Documentação do papel de Product Specialist.
  - Contém planejamento de produto, comunicação com stakeholders e validação de impacto.

- `docs/papeis/tech-lead/`
  - Documentação do papel de Tech Lead.
  - Foco em arquitetura, governança técnica e coordenação da equipe de engenharia.

- `docs/papeis/qa/`
  - Documentação do papel de QA.
  - Estratégias de teste, critérios de qualidade e validação de resultados.

## Meu foco: `docs/papeis/desenvolvedor/`

Como desenvolvedor, meu trabalho concentra-se na subpasta `docs/papeis/desenvolvedor/`, que reúne toda a implementação técnica do projeto:

- `desenvolvedor.md`
  - Visão geral do papel de desenvolvedor no contexto do assistente de IA.

- `prompt-exercicio-1-1.md`
  - Introdução ao exercício de análise de viabilidade técnica.

- `prompt-exercicio-1-2.md`
  - Introdução ao exercício de prototipação de prompt.

- `prompt-exercicio-1-3.md`
  - Introdução ao exercício de pipeline RAG.

- `tarefas/`
  - Cada exercício tem uma pasta de tarefas com atividades detalhadas.
  - Exemplos:
    - `exercicio-1-1/`
    - `exercicio-1-2/`
    - `exercicio-1-3/`

- `entregaveis/`
  - Espaço para registrar as entregas finais dos exercícios.

## Como usar esta documentação

1. Abra `docs/papeis/desenvolvedor/desenvolvedor.md` para entender o papel e o fluxo de trabalho do desenvolvedor.
2. Siga os prompts principais (`prompt-exercicio-1-1.md`, `prompt-exercicio-1-2.md`, `prompt-exercicio-1-3.md`) para iniciar cada exercício.
3. Utilize as pastas de tarefas para executar o trabalho detalhado e gerar entregáveis.

## Por que comecei pelo papel de desenvolvedor

- É onde estão as decisões técnicas mais concretas: viabilidade, prompt engineering e arquitetura RAG.
- Permite entender na prática como o pipeline de dados alimenta o modelo — algo que só fica claro quando você implementa.
- Os exercícios me forçaram a ir além do "jogar documentos no LLM" e pensar em chunking, context window e governança de dados.

## Nota

Repositório criado como parte da trilha de formação DGS AI First. A pasta `docs/papeis/desenvolvedor/` é o ponto de partida técnico — foi por onde construí minha compreensão do problema antes de prototipar qualquer solução.
