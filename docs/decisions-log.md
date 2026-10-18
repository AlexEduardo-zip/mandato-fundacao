# Log de decisões

Uma linha por decisão tomada durante a implementação: `data · decisão · motivo`.
Parâmetros iniciais estão em `09-parametros-v0.md`; aqui entra só o que mudar ou o que faltar nele.

| Data | Decisão | Motivo |
|---|---|---|
| 2026-10-18 | TypeScript 5.9, ESLint 9 (flat config), Vitest 3, Node 22 no CI | Versões estáveis e amplamente suportadas; TS 7 e ESLint 10 ainda recentes demais |
| 2026-10-18 | Pacotes ESM com `tsc -b` e project references; typecheck e build rodam por pacote | Evita tsconfig raiz e garante ordem de build entre pacotes |
| 2026-10-18 | Vitest resolve `@mandato/*` por alias para `src` (`vitest.shared.ts`) | Testes não dependem de build prévio |
| 2026-10-18 | `docs/` fora do Prettier | Docs são texto editorial, formatação automática geraria ruído |
| 2026-10-18 | Engine proibida de usar Math.random, Date, I/O por regra de ESLint (`no-restricted-syntax`/`no-restricted-imports`) | Garante determinismo no lint, não só em revisão |
