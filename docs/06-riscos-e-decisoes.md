# 06 · Riscos e decisões

## ADRs

### ADR-001 · Personagens fictícios sobre fatos reais
**Decisão:** partidos e políticos são inventados; eventos reais servem de contexto neutro.
**Por quê:** reduz risco jurídico e de polarização, mantém liberdade criativa.
**Custo:** perde o apelo de "jogar como" figuras conhecidas.

### ADR-002 · Sem engine de jogo; web + TypeScript
**Decisão:** UI web comum em vez de Unity/Godot/Phaser.
**Por quê:** o jogo é texto, escolhas e painéis; web facilita distribuição e compartilhamento.
**Custo:** efeitos visuais ricos exigem mais trabalho manual.

### ADR-003 · Engine headless e determinística
**Decisão:** função pura de transição com RNG por seed e replay de decisões.
**Por quê:** testabilidade, desafio diário, compartilhamento e simulação em lote.
**Custo:** disciplina para não usar `Math.random` ou data do sistema na engine.

### ADR-004 · Conteúdo orientado a dados
**Decisão:** eventos em JSON/YAML validados por Zod.
**Por quê:** conteúdo editável sem mexer em código, validação automática no CI.
**Custo:** linguagem de condições limitada; casos especiais exigem extensão da engine.

### ADR-005 · Sem backend no MVP
**Decisão:** save local; seed diária calculada pela data.
**Por quê:** custo zero e menos superfície de falha.
**Custo:** sem ranking global nem anti-trapaça; avaliar backend depois.

### ADR-006 · Angular na UI, só na trilha humana
**Decisão:** Angular com signals por familiaridade, mas a UI só é construída depois da trilha autônoma.
**Por quê:** reduz curva de aprendizado; a engine não depende de framework.
**Custo:** bundle maior e menos exemplos de jogos; reavaliar se a UI virar animada.

### ADR-007 · Todo personagem começa na vida civil
**Decisão:** o jogo abre na Fase 0 (origem na vida civil) e a política é uma porta de entrada escolhida.
**Por quê:** reforça identidade e rejogabilidade, dá sentido à origem e à fidelidade à base.
**Custo:** cerca de 30 eventos extras e 3 a 8 turnos antes da política; mitigado com fase curta e convites cedo.

### ADR-008 · Autônomo primeiro, humano no final
**Decisão:** o backlog é dividido em Trilha A (tudo que um teste automatizado consegue verificar) e Trilha B (visual, editorial, jurídico, playtest, deploy). A A roda sem intervenção; a B só começa quando a A termina.
**Por quê:** permite deixar o Claude trabalhando por épicos com `/goal`, sem esperar aprovação visual.
**Custo:** o jogo só é "jogável" em terminal até a trilha B; mitigado pelo cliente CLI (E3-0).

### ADR-009 · Cliente CLI antes da UI web
**Decisão:** um cliente de terminal completo (criação, turnos, decisões, eleição, final) é entregue na trilha A.
**Por quê:** valida o jogo de ponta a ponta com teste automatizado e dá algo jogável para o playtest inicial.
**Custo:** trabalho que não vai para o produto final; o cliente serve de referência e de ferramenta de depuração.

### ADR-010 · Decidir e registrar, não perguntar
**Decisão:** dúvidas de design são resolvidas com `docs/09-parametros-v0.md`; o que não estiver lá é decidido pelo critério mais simples e reversível e anotado em `docs/decisions-log.md`. Itens que exigem humano vão para `HUMAN_REVIEW.md`.
**Por quê:** evita paradas em execução longa.
**Custo:** algumas decisões podem ser revertidas depois; o log torna isso barato.

## Riscos

| Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|
| Percepção de viés político | Alta | Alto | Personagens fictícios, trade-offs simétricos, revisão externa (B) |
| Questões jurídicas com fatos recentes | Média | Alto | Fontes, linguagem neutra, avaliação jurídica antes do beta (B) |
| Conteúdo gerado em volume fica repetitivo ou raso | Alta | Alto | Eventos com tags/condições, métricas de cobertura na simulação em lote, revisão editorial (B) |
| Balanceamento difícil (arquétipo dominante) | Média | Médio | Simulação em lote e metas numéricas; aceite final humano |
| Execução autônoma desvia do design | Média | Médio | `CLAUDE.md`, um épico por sessão, commits por história, revisão por subagente |
| Escopo cresce (outras eras, multiplayer) | Alta | Médio | Escopo MVP congelado, ideias no backlog P2 |
| Sistema complexo demais para o jogador | Média | Alto | Poucos indicadores na tela, explicações no final |
| Decisões "óbvias" quebram a tensão | Média | Médio | Revisão de dilemas, custo real nos dois lados |
| Fase civil lenta antes da política | Média | Médio | Fase curta, convites cedo, modo rápido na engine |
| Estereótipos nas origens | Média | Alto | Forças e fraquezas em todas, nenhuma "melhor", revisão externa (B) |

## Perguntas que continuam com humano
1. Nome definitivo do jogo e domínio.
2. Identidade visual e tom final da sátira.
3. Aceite do balanceamento e do conteúdo depois de playtests.
4. Revisão jurídica do uso de fatos recentes.
5. Publicação (deploy, domínio, telemetria).
