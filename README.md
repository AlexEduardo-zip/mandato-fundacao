# Mandato (título provisório)

Simulador de carreira política no Brasil pós-Constituição de 1988, inspirado na estrutura do _Fenômeno Game_: o jogador monta um político, avança o tempo em ciclos, decide nos momentos-chave e recebe uma avaliação de legado ao final.

## Índice

| Documento                                                  | Conteúdo                                                               |
| ---------------------------------------------------------- | ---------------------------------------------------------------------- |
| [00-visao-e-premissas](docs/00-visao-e-premissas.md)       | Visão, público, pilares, escopo do MVP, o que não é                    |
| [01-game-design](docs/01-game-design.md)                   | Loop, atributos, cargos, decisões, eventos, avaliação final            |
| [02-arquitetura](docs/02-arquitetura.md)                   | Stack, monorepo, engine headless, RNG, save, testes                    |
| [03-modelo-de-dados](docs/03-modelo-de-dados.md)           | Schemas de estado, evento, decisão, efeito e condição                  |
| [04-conteudo-e-pesquisa](docs/04-conteudo-e-pesquisa.md)   | Linha do tempo 1988+, fases, diretrizes editoriais e legais            |
| [05-backlog](docs/05-backlog.md)                           | Milestones, épicos e histórias priorizadas                             |
| [06-riscos-e-decisoes](docs/06-riscos-e-decisoes.md)       | ADRs iniciais, riscos e perguntas em aberto                            |
| [07-origens-e-vida-civil](docs/07-origens-e-vida-civil.md) | Fase 0: origens, portas de entrada, regras e conversão para a política |
| [08-execucao-autonoma](docs/08-execucao-autonoma.md)       | Como rodar a Trilha A sozinho no Claude Code, com `/goal` por épico    |
| [09-parametros-v0](docs/09-parametros-v0.md)               | Parâmetros e decisões padrão para a implementação não travar           |

O `CLAUDE.md` na raiz orienta o Claude Code durante a implementação.

## Estado

Fase de fundação. Nenhum código escrito. Próximo passo: goal 1 (E0) do doc 08.

O backlog tem duas trilhas: **A** (autônoma, verificável por teste) e **B** (humana, no final: UI, visual, revisão, playtest, deploy).
