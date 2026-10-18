# Mandato

Simulador de carreira política no Brasil pós-1988, no estilo do Fenômeno Game: o jogador parte da vida civil, entra na política por uma porta e é julgado no final. Tudo em `docs/`; comece pelo `README.md`.

## Onde olhar

- Regras e números: `docs/09-parametros-v0.md` (manda quando houver dúvida)
- O que fazer: `docs/05-backlog.md`, só a **Trilha A**
- Como rodar épicos sozinho: `docs/08-execucao-autonoma.md`

## Como decidir sem perguntar

- Dúvida de design: usar o doc 09; se não estiver lá, escolher o mais simples e reversível.
- Registrar a decisão em `docs/decisions-log.md` (uma linha: data, decisão, motivo) e seguir.
- Precisa de olho humano (visual, jurídico, editorial, nome, publicação)? Anotar em `HUMAN_REVIEW.md` e continuar com o resto.
- Nunca parar para pedir aprovação no meio de um épico.

## Limites

- Não mexer na Trilha B (UI, visual, deploy, telemetria).
- Não usar nomes reais de políticos, partidos ou eleitos.
- Não publicar, fazer deploy nem alterar configuração de contas.

## Engine

- Pura e determinística: nada de `Math.random`, `Date.now` ou I/O dentro de `packages/engine`.
- Conteúdo é dado (JSON validado por Zod), nunca texto hardcoded no código.
- Números de balanceamento ficam em configuração, não espalhados.

## Qualidade

- Cada história termina com testes passando (`pnpm lint`, `pnpm typecheck`, `pnpm test`).
- Um commit por história, mensagem começando pelo ID (ex.: `E1-3: avaliador de condições`).
- Marcar `[x]` na história concluída no backlog.
- Ao fechar um épico, pedir a um subagente para revisar o diff contra o doc correspondente, olhando só correção e requisito.

## Estilo

- TypeScript strict, nomes em inglês no código, textos do jogo em pt-BR.
- Poucos comentários, só onde o porquê não é óbvio.
- Eventos novos sempre com `status: "rascunho"`.
