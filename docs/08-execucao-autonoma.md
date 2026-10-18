# 08 · Execução autônoma

Como deixar o Claude Code implementando a Trilha A sozinho, épico por épico.

## Preparação (uma vez)
1. Extrair o pacote na raiz de um repositório novo, com git iniciado e uma branch de trabalho.
2. Abrir no VS Code, rodar `/init` e mesclar com o `CLAUDE.md` que já vem no pacote.
3. Criar `docs/decisions-log.md` e `HUMAN_REVIEW.md` vazios (a história E0-5 também cobre isso).
4. Usar o modo **auto** de permissões. Bypass total só em ambiente isolado.

## Regras da rodada
- Um épico por sessão. `/clear` entre eles.
- Cada `/goal` abaixo tem um limite de turnos; se estourar, o Claude para com o estado salvo em commits, e você retoma com o mesmo goal.
- Se o `/goal` não estiver disponível na extensão, rode o `claude` no terminal integrado do VS Code.

## Ordem e goals

Os goals dizem **o que precisa estar verdade no fim**. Como chegar lá fica com o Claude.

**1 · Fundação (E0)**
```
/goal E0-1 a E0-5 concluídas: monorepo com TS strict, lint, Vitest e CI, pacotes engine/content/tools/cli criados, decisions-log e HUMAN_REVIEW existentes; lint, typecheck e test passam; um commit por história e backlog marcado; ou pare após 15 turnos
```

**2 · Núcleo da engine (E1-1 a E1-7)**
```
/goal E1-1 a E1-7 concluídas na engine: RNG com seed, tipos, condições, efeitos com agenda, pipeline de turno, seleção de eventos e resolução de decisões; testes cobrindo determinismo e cada tipo de condição e efeito; nada de Math.random ou Date na engine; commits por história; ou pare após 30 turnos
```

**3 · Eleições, cargos e final (E1-8 a E1-12)**
```
/goal E1-8 a E1-12 concluídas: eleição com adversários, escada de cargos e mandatos, avaliador final com arquétipos e níveis, replay por seed e decisões com migração de save, manchetes; parâmetros lidos do doc 09 via configuração; testes verdes; ou pare após 30 turnos
```

**4 · Vida civil (E6-1 a E6-4, E6-8, E6-9, E6-11, E6-12)**
```
/goal Fase 0 funcionando na engine: turnos civis, regras de entrada, as cinco portas, conversão de prestígio e rede, disponibilidade de origem por época, fidelidade à origem no final e finais especiais; um teste de partida completa da vida civil até o final passa de forma determinística; ou pare após 30 turnos
```

**5 · Conteúdo estrutural (E2-1 a E2-4)**
```
/goal schemas Zod e validador de conteúdo rodando no CI; 17 âncoras históricas com fonte e data, 6 origens e partidos fictícios em dados; todo conteúdo com status rascunho; itens duvidosos listados em HUMAN_REVIEW.md; ou pare após 25 turnos
```

**6 · Eventos (E2-5 a E2-9)**
```
/goal conteúdo de eventos completo e válido: 28 eventos civis, 60 de carreira e textos de arquétipos, legado e finais; todos passam no validador, sem nomes reais e dentro de 40 a 90 palavras; ou pare após 40 turnos
```
Se for longo demais, divida em dois goals: civis e carreira.

**7 · Cliente CLI (E3-0, E3-7, E3-11)**
```
/goal CLI jogável de ponta a ponta: criação, vida civil, turnos, decisões, eleição e final, com save e continuar e modo por script; uma partida completa roda em teste sem erro; ou pare após 25 turnos
```

**8 · Simulação e balanceamento (E1-13, E1-14, E5-1, E5-3, E5-7)**
```
/goal simulação em lote com 10 mil partidas atingindo as metas de balanceamento do backlog, cada ajuste registrado no decisions-log; e2e do CLI e relatório de qualidade do conteúdo passando; metas não atingidas listadas em HUMAN_REVIEW.md; ou pare após 40 turnos
```

**9 · Rejogabilidade (E4-1, E4-3, E4-4, E4-5) e extras (E6-10)**
```
/goal desafio diário por seed, coleção de finais, pacotes de partida e modo "o que teria acontecido" funcionando com testes; mais 8 origens em dados válidos; ou pare após 30 turnos
```

## Revisão ao fim de cada épico
Peça a um subagente: *"revise o diff do épico contra o doc correspondente, aponte só falhas de correção e requisito não atendido"*. Corrigir e rodar os testes de novo antes de fechar.

## O que sobra para você (Trilha B)
Quando o goal 9 fechar, abra `HUMAN_REVIEW.md`. Ele deve conter, no mínimo: fontes das âncoras para conferir, pontos de viés ou estereótipo marcados, metas de balanceamento não atingidas, dúvidas de nome e domínio. Depois, a Trilha B do backlog (UI, visual, revisão editorial e jurídica, playtest, deploy).
