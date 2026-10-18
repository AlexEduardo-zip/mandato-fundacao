# 05 · Backlog

Prioridade: **P0** essencial · **P1** importante · **P2** desejável. Tamanho: **S** (≤1 dia) · **M** (2–3 dias) · **L** (~1 semana).
Status: `[ ]` pendente · `[x]` concluída (quem implementa marca ao terminar).

O backlog tem duas trilhas (ADR-008):
- **Trilha A, autônoma**: tudo que testes, validadores ou simulação em lote conseguem verificar. Roda sem intervenção.
- **Trilha B, humana, no final**: visual, revisão editorial e jurídica, playtest, publicação.

## Milestones
| Marco | Trilha | Objetivo | Critério de saída |
|---|---|---|---|
| M0 · Fundação | A | Repo, CI e esqueleto | lint, typecheck e test verdes no CI |
| M1 · Engine e vida civil | A | Carreira completa headless, da Fase 0 ao final | Partida determinística de ponta a ponta em teste |
| M2 · Conteúdo alpha e CLI jogável | A | Jogo completo em terminal, balanceado numericamente | Metas de balanceamento atingidas na simulação em lote; e2e do CLI verde |
| M3 · Camada humana | B | UI, visual, revisão editorial e jurídica | Itens de `HUMAN_REVIEW.md` resolvidos |
| M4 · Beta | B | Playtest, ajustes e publicação | Deploy e feedback inicial |

---

# Trilha A · Autônoma

## E0 · Fundação (M0)
| ✔ | ID | História | Prior. | Tam. |
|---|---|---|---|---|
| [x] | E0-1 | Monorepo pnpm com TS strict, ESLint, Prettier | P0 | S |
| [x] | E0-2 | Vitest nos pacotes | P0 | S |
| [x] | E0-3 | CI no GitHub Actions (lint, typecheck, test, build) | P0 | S |
| [x] | E0-4 | Scaffold dos pacotes `engine`, `content`, `tools`, `cli` e placeholder de `apps/web` | P0 | S |
| [x] | E0-5 | Convenções: commits por história, `decisions-log.md`, `HUMAN_REVIEW.md`, CONTRIBUTING | P1 | S |

## E1 · Engine (M1)
| ✔ | ID | História | Prior. | Tam. |
|---|---|---|---|---|
| [x] | E1-1 | RNG com seed e testes de determinismo | P0 | S |
| [x] | E1-2 | Tipos de estado, mundo, evento e decisão (doc 03) | P0 | M |
| [x] | E1-3 | Avaliador de condições (`all/any/not`, attr, tag, office, phase, origin, age, ano) | P0 | M |
| [x] | E1-4 | Aplicador de efeitos e agenda de consequências | P0 | M |
| [x] | E1-5 | Pipeline de turno anual | P0 | L |
| [x] | E1-6 | Seleção de eventos por peso, elegibilidade e cooldown | P0 | M |
| [x] | E1-7 | Resolução de decisão com resultados probabilísticos | P0 | M |
| [x] | E1-8 | Modelo de eleição v0 e adversários gerados | P0 | L |
| [x] | E1-9 | Escada de cargos, mandatos, reeleição e cargos paralelos | P0 | M |
| [x] | E1-10 | Avaliador final: dimensões, arquétipo, nível de legado | P0 | L |
| [ ] | E1-11 | Replay a partir de `{seed, decisions}` e migração de save | P0 | M |
| [ ] | E1-12 | Gerador de manchetes e resumo anual (templates) | P1 | M |
| [ ] | E1-13 | CLI de simulação em lote com relatório (arquétipos, chegada a cada cargo, eventos nunca disparados) | P1 | M |
| [ ] | E1-14 | Testes de propriedade (faixas, determinismo, nenhum estado inválido) | P1 | M |

## E6 · Vida civil e origens (M1), ver doc 07
| ✔ | ID | História | Prior. | Tam. |
|---|---|---|---|---|
| [ ] | E6-1 | Fase 0 no pipeline: estado `civil`, turnos civis e transição para política | P0 | L |
| [ ] | E6-2 | Regras de entrada: idade mínima, filiação, prazo e janela eleitoral | P0 | M |
| [ ] | E6-3 | Portas de entrada (candidatura direta, liderança de entidade, cargo de confiança, sucessão, chamado em crise) | P0 | L |
| [ ] | E6-4 | Conversão de prestígio e rede em recursos políticos por origem e porta | P0 | M |
| [ ] | E6-8 | Efeitos das âncoras históricas por origem | P1 | M |
| [ ] | E6-9 | Disponibilidade de origens por época (`availableFrom/Until`) | P1 | S |
| [ ] | E6-11 | Fidelidade à origem na avaliação final e novos arquétipos | P1 | M |
| [ ] | E6-12 | Finais especiais (vida civil, cassado, aposentado no auge) e `startPhase` | P1 | S |

## E2 · Conteúdo (M2)
Todo conteúdo nasce com `status: "rascunho"`; a revisão humana está na trilha B.

| ✔ | ID | História | Prior. | Tam. |
|---|---|---|---|---|
| [ ] | E2-1 | Schemas Zod e validador de conteúdo no CI | P0 | M |
| [ ] | E2-2 | Âncoras históricas (17) com fontes e datas, marcadas para revisão | P0 | L |
| [ ] | E2-3 | 6 origens do MVP com perfil, bônus, fraquezas e faixa de idade | P0 | M |
| [ ] | E2-4 | Partidos fictícios e blocos políticos | P0 | S |
| [ ] | E2-5 | 10 eventos civis genéricos e 18 exclusivos por origem | P0 | L |
| [ ] | E2-6 | 20 eventos de carreira: formação e ascensão | P0 | L |
| [ ] | E2-7 | 20 eventos de carreira: auge e crise | P0 | L |
| [ ] | E2-8 | 20 eventos de carreira: legado, sucessão, reabilitação | P1 | L |
| [ ] | E2-9 | Textos de arquétipos, níveis de legado e finais especiais | P1 | M |
| [ ] | E2-10 | Guia editorial e checklist de revisão (insumo para a trilha B) | P1 | S |
| [ ] | E6-10 | Mais 8 origens (advogado, saúde, jornalista, religioso, militar/policial, servidor, herdeiro, criador de conteúdo) | P2 | L |

## E3 · Cliente CLI (M2)
| ✔ | ID | História | Prior. | Tam. |
|---|---|---|---|---|
| [ ] | E3-0 | CLI jogável: criação, vida civil, turnos, decisões, eleição e final, em texto | P0 | L |
| [ ] | E3-7 | Save e continuar (arquivo JSON local) | P0 | S |
| [ ] | E3-11 | Modo não interativo do CLI (decisões por script) para testes e demos | P1 | S |

## E4 · Meta e rejogabilidade, lógica (M2)
| ✔ | ID | História | Prior. | Tam. |
|---|---|---|---|---|
| [ ] | E4-1 | Desafio diário com seed por data | P1 | M |
| [ ] | E4-3 | Coleção de arquétipos e finais descobertos (dados e lógica) | P2 | M |
| [ ] | E4-4 | Pacotes de partida (início em 1988, 1994, 2002, 2014) | P2 | M |
| [ ] | E4-5 | Modo "o que teria acontecido": replay com decisão alternativa e diff | P2 | L |

## E5 · Qualidade (M2)
| ✔ | ID | História | Prior. | Tam. |
|---|---|---|---|---|
| [ ] | E5-1 | Balanceamento por simulação em lote até atingir as metas abaixo | P0 | L |
| [ ] | E5-3 | e2e do CLI: partida completa por script, determinística | P1 | M |
| [ ] | E5-7 | Relatório de qualidade do conteúdo (cobertura de eventos, textos fora do padrão, tags órfãs) | P1 | S |

### Metas de balanceamento (E5-1)
- Chegar à presidência com decisões aleatórias: 1% a 3%.
- Nenhum arquétipo acima de 30% dos finais.
- Queda por escândalo/cassação: 10% a 20%.
- Todo evento disparando em pelo menos 5% das partidas simuladas, ou revisado.
- Entrada na política até o fim da Fase 0: 85% a 95%.
- Nenhuma origem com taxa de chegada ao Congresso acima do dobro da média.

---

# Trilha B · Humana (só depois da trilha A)

Cada item é o que o Claude **não deve fazer sozinho**. O playbook (doc 08) manda registrar em `HUMAN_REVIEW.md` o que precisa de olho humano.

## H1 · Interface web
| ✔ | ID | Antes | História | Prior. | Tam. |
|---|---|---|---|---|---|
| [ ] | H1-1 | E3-1 | Tela inicial e novo jogo | P0 | S |
| [ ] | H1-2 | E3-2 | Criação de personagem (origem, idade, pontos, traços) | P0 | L |
| [ ] | H1-3 | E6-7 | Tela da fase civil (prestígio, rede, portas) | P0 | M |
| [ ] | H1-4 | E3-3 | Tela de turno: resumo do ano, indicadores, evento | P0 | L |
| [ ] | H1-5 | E3-4 | Componente de decisão com requisitos visíveis | P0 | M |
| [ ] | H1-6 | E3-5 | Tela de eleição com resultado e comentário | P0 | M |
| [ ] | H1-7 | E3-6 | Tela final: arquétipo, nível, linha do tempo | P0 | L |
| [ ] | H1-8 | E3-7 | Ligar save/continuar ao navegador (localStorage) | P0 | S |
| [ ] | H1-9 | E3-10 | Painel de histórico/diário da carreira | P2 | M |

## H2 · Visual e experiência
| ✔ | ID | Antes | História | Prior. | Tam. |
|---|---|---|---|---|---|
| [ ] | H2-1 | E3-8 | Identidade visual, tipografia, ícones de cargo | P1 | L |
| [ ] | H2-2 | E3-9 | Responsivo mobile e acessibilidade | P1 | M |
| [ ] | H2-3 | E4-2 | Card de resultado compartilhável | P1 | M |
| [ ] | H2-4 | E4-3 | Tela de coleção de arquétipos e finais | P2 | M |
| [ ] | H2-5 | E5-3 | e2e de navegador (Playwright) | P1 | M |

## H3 · Revisão e decisão humana
| ✔ | ID | Antes | História | Prior. | Tam. |
|---|---|---|---|---|---|
| [ ] | H3-1 | E2-2 | Conferir as âncoras históricas nas fontes primárias | P0 | M |
| [ ] | H3-2 | E5-4 | Revisão editorial: viés, tom, estereótipos nas origens | P0 | M |
| [ ] | H3-3 | E5-4 | Revisão jurídica do uso de fatos recentes | P0 | M |
| [ ] | H3-4 | E5-2 | Playtests moderados e coleta de feedback | P0 | M |
| [ ] | H3-5 | E5-1 | Aceite final do balanceamento depois dos playtests | P0 | S |
| [ ] | H3-6 | E0-6 | Nome definitivo e domínio | P2 | S |

## H4 · Publicação
| ✔ | ID | Antes | História | Prior. | Tam. |
|---|---|---|---|---|---|
| [ ] | H4-1 | E5-5 | Deploy estático e domínio | P1 | S |
| [ ] | H4-2 | E5-6 | Telemetria anônima opcional | P2 | M |
