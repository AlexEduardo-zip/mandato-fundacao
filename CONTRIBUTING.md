# Contribuindo

## Fluxo

- Trabalhe a partir de `docs/05-backlog.md`, apenas na Trilha A.
- Um commit por história, mensagem começando pelo ID: `E1-3: avaliador de condições`.
- Ao concluir, marque `[x]` na história do backlog no mesmo commit.
- Antes de commitar: `pnpm lint`, `pnpm typecheck`, `pnpm test` (e `pnpm format`).

## Decisões e revisão humana

- Dúvida de design: usar `docs/09-parametros-v0.md`; se não estiver lá, escolher o mais simples e reversível e registrar uma linha em `docs/decisions-log.md`.
- Algo que precisa de olho humano (visual, jurídico, editorial, nome, publicação) vai para `HUMAN_REVIEW.md`.

## Regras do código

- `packages/engine` é puro e determinístico: sem `Math.random`, `Date.now` ou I/O.
- Conteúdo é dado (JSON validado por Zod), nunca texto hardcoded.
- Números de balanceamento ficam em configuração (`packages/content/config`).
- TypeScript strict, nomes em inglês no código, textos do jogo em pt-BR.
- Sem nomes reais de políticos, partidos ou eleitos. Eventos novos entram com `status: "rascunho"`.
