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
| 2026-10-18 | Ids de atributos, recursos e mundo em inglês no código (`oratory`, `capital`, `economy`...); stats numéricos endereçáveis por `StatId` (atributos, recursos, `prestige`, `network`, `scandalRisk`) | Regra de nomes em inglês; um único espaço de nomes simplifica `attr` e `add` |
| 2026-10-18 | Efeitos extras além do doc 03: `set` e `addWorld`; evento ganha `effects`, `scheduledOnly`, `cooldownTurns` | Âncoras precisam mover o mundo; eventos de consequência não podem sair no sorteio |
| 2026-10-18 | `chance` de outcome é peso relativo (número ou `Formula` = base + Σ coef·stat/100, limitada a 0..1) | Autoria mais simples que exigir soma 1; fórmula cobre "depende de atributos" |
| 2026-10-18 | `WeightRule` = `{ when?, mult }`, multiplica o peso base | "Peso por tags e estado" sem expressões livres |
| 2026-10-18 | Config da engine em `packages/engine/src/config.ts` (conteúdo pode sobrescrever); recurso inicial padrão 10, atributo 30 | `content` depende de `engine`, então o default mora na engine; recurso inicial 10 é provisório até as origens (E6) |
| 2026-10-18 | Eleição: rejeição por polarização = max(0, polarização−50)·0,2; escândalos ativos = tag `scandal_active`; ruído gaussiano (Box-Muller) também nos adversários; % de votos = fatia do score entre todos os candidatos | Doc 09 não define esses termos; mais simples e ajustável em `config.election` |
| 2026-10-18 | Proporcionais: vence quem passa o quantil do score dos adversários (vereador 0,5 e 9 rivais; deputado 0,6 e 9 rivais); majoritárias: maior score (3 rivais; presidente 4) | Doc 09 pede "percentil por cargo"; valores provisórios para calibrar no E5-1 |
| 2026-10-18 | Cargos como dados em `config.offices` (id: vereador, prefeito, deputado, senador, governador, presidente); senador e governador no mesmo degrau (rank 4) | Config única; Executivo/Legislativo explícito |
