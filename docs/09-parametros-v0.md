# 09 · Parâmetros e decisões v0

Valores padrão para a implementação não travar em dúvidas. Tudo aqui é **ajustável por simulação em lote** (E5-1), mas deve ser implementado como configuração (`packages/content/config`), nunca espalhado no código. Mudou um valor? Registre em `docs/decisions-log.md`.

## Tempo e fim de partida
- 1 turno = 1 ano. Início em 1988. A era termina em 2026.
- Fim de partida: aposentadoria (opcional a partir dos 60, forçada aos 80), cassação/inelegibilidade, derrota sem caminho de volta (sem recursos para uma nova candidatura por 2 ciclos) ou fim da era.
- Meta de duração: 25–35 min, 1 a 2 decisões por turno, no máximo 1 âncora + 2 eventos de carreira por turno.
- Cooldown de 3 turnos para o mesmo evento; peso padrão 1.

## Personagem
- 8 atributos (0–100): Oratória, Articulação, Gestão, Estratégia eleitoral, Ambição, Integridade, Pragmatismo, Resiliência.
- Criação: base 30 em cada, **+40 pontos livres**, máximo 80 por atributo na criação. A origem soma bônus/penalidades de até ±10.
- 4 recursos (0–100): Capital político, Dinheiro, Base eleitoral, Mídia.
- Vida civil: Prestígio civil e Rede (0–100).
- Oculto: `scandalRisk` (0–100). Acima de 60 abre evento de escândalo; acima de 85 permite cassação.
- Efeitos de decisão ficam na faixa ±1 a ±15; nada leva um valor de 0 a 100 de uma vez.

## Idade inicial (escolhida dentro da faixa da origem)
| Origem | Faixa |
|---|---|
| Sindicalista | 25–40 |
| Professor | 25–40 |
| Trabalhador rural | 20–40 |
| Empresário | 28–45 |
| Estudante em movimento estudantil | 18–24 |
| Líder comunitário | 22–45 |

## Fase 0 (vida civil)
- Mínimo 3 turnos antes de abrir uma porta (2 no "chamado em crise"), máximo 8.
- No 8º turno sem porta aberta, o jogo oferece uma "última chance". Recusar leva ao final **Permaneceu na vida civil**.
- Conversão na entrada: `base = prestígio × mult.toBase`, `capital = rede × mult.toCapital` (multiplicadores por origem entre 0,6 e 1,2).

## Cargos e mandatos (validar nas fontes no E2-2)
- Mandato de 4 anos (senador: 8). Reeleição de Executivo permitida uma vez a partir de 1997.
- Municipais: 1988, 1992, 1996... Gerais: 1990, 1994, 1998... A eleição presidencial de 1989 é caso especial.
- Idades mínimas: 18 vereador · 21 prefeito e deputado · 30 governador · 35 senador e presidente.

## Eleição
```
score = 0,30·base + 0,15·mídia + 0,15·dinheiro + 0,10·estratégia
      + 0,15·humor_do_mundo + 0,15·capital
      − 4·escândalos_ativos − rejeição_por_polarização + ruído(σ=6)
```
- Adversários por cargo, força média: vereador 45 · prefeito 50 · deputado 55 · senador e governador 60 · presidente 65, com ±10 de variação.
- Eleições proporcionais (vereador, deputados) usam limiar de cadeiras simplificado: vence quem ficar acima do percentil definido por cargo. Majoritárias comparam com os adversários.
- O resultado é narrado com votos em % e uma frase de contexto, **sem minigame**.

## Avaliação final
- Pesos: posição 25% · desempenho 20% · reputação 15% · consistência 15% · legado em eventos 15% · fidelidade à origem 10%.
- 5 níveis de legado: Anônimo · Local · Regional · Nacional · Histórico.
- 10 arquétipos: Reformador, Articulador, Populista, Tecnocrata, Sobrevivente, Estadista, Promessa não cumprida, Fiel às origens, Traiu a base, Caído em desgraça. A regra de escolha é por dimensão dominante, coberta por testes.
- Finais especiais: Permaneceu na vida civil, Cassado, Aposentado no auge.

## Decisões de produto (ex-perguntas em aberto)
| Pergunta | Decisão |
|---|---|
| Nome | **Mandato** é codinome; fica numa constante única para trocar depois (decisão final é humana) |
| Modo rápido | Sim, na engine (`startPhase`), sem tela própria no MVP |
| Idade inicial | Livre dentro da faixa da origem |
| Eleição como minigame | Não, resultado narrado |
| Partida longa ou curta | ~30 min, com continuação por replay |
| Carreira não eleitoral | Fora do MVP |
| Monetização | Fora do escopo |
| Idiomas | Só pt-BR, textos inline no conteúdo |
| Stack de UI | Angular mantido, mas só entra na trilha humana; engine independe de framework |
| Testes | Vitest |
| Cliente inicial | **CLI de terminal jogável** antes de qualquer UI web |

## Convenções de conteúdo
- Texto de evento: 40–90 palavras, sátira leve, sem nomes de pessoas reais, sem juízo partidário.
- Todo evento tem `tags`, `sources` (quando âncora) e `status: "rascunho"` até a revisão humana.
- Partidos fictícios (seed): Partido Democrático Popular (PDP), Aliança Progressista Nacional (APN), Movimento Trabalho e Terra (MTT), Partido da Ordem e Mercado (POM), Frente Cidadã (FC), Centro Federativo (CF).

## Técnicas
- Node LTS atual, pnpm, TypeScript strict, Vitest, ESLint e Prettier.
- Pacotes: `@mandato/engine`, `@mandato/content`, `@mandato/tools`, `@mandato/cli`, `apps/web` (só placeholder até a trilha humana).
- RNG: mulberry32 com seed em string (hash). Seed diária: `YYYY-MM-DD` no fuso America/Sao_Paulo.
- Save: `{ saveVersion: 1, contentVersion, seed, decisions[] }`.
