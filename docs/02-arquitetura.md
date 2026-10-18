# 02 · Arquitetura

## Princípios
- Engine **pura e headless** (sem DOM), testável em Node.
- **Determinismo**: RNG com seed; o estado inteiro é serializável.
- **Conteúdo como dado**, validado por schema.
- UI fina: renderiza estado e envia decisões.

## Stack proposta

| Camada | Escolha | Motivo |
|---|---|---|
| Linguagem | TypeScript (strict) | Tipagem forte para estado e conteúdo |
| Monorepo | pnpm workspaces | Simples, sem tooling pesado |
| Engine | TS puro (`packages/engine`) | Roda em Node, navegador e testes |
| Conteúdo | JSON/YAML + Zod (`packages/content`) | Validação e tipos gerados |
| UI | Angular (signals) em `apps/web` | Familiaridade do time; alternativa: Svelte/React |
| Testes | Vitest (engine/content), Playwright (e2e) | Rápido; Jest também serve |
| Save | localStorage/IndexedDB | Sem backend no MVP |
| Deploy | Vercel ou GitHub Pages (estático) | Custo zero |
| CI | GitHub Actions | lint, typecheck, test, build, validação de conteúdo |

Não é necessária uma engine de jogo (Unity, Godot, Phaser): o jogo é baseado em texto, escolhas e painéis. Ver ADR-002.

## Estrutura do repositório
```
mandato/
├─ apps/
│  └─ web/                 # UI (placeholder até a trilha humana)
├─ packages/
│  ├─ engine/              # simulação, RNG, resolução de decisões
│  ├─ content/             # eventos, origens, cargos, âncoras (JSON) + schemas
│  ├─ tools/               # simulador em lote, validador, balanceamento
│  └─ cli/                 # cliente de terminal jogável
├─ docs/
└─ .github/workflows/
```

## Motor de simulação
Estado imutável, função pura de transição:

```
S(t+1) = F(S(t), A(t), W(t), R(t))
```
- `S`: estado do político (atributos, recursos, cargo, tags, histórico, agenda de consequências)
- `A`: decisão do jogador
- `W`: mundo no ano `t` (âncoras históricas e variáveis agregadas)
- `R`: aleatoriedade vinda de RNG com seed (ex.: mulberry32/PCG)

Pipeline por turno:
1. Aplicar âncoras do ano ao mundo.
2. Executar consequências agendadas que vencem neste ano.
3. Sortear eventos elegíveis (filtro por condições, peso por tags e estado).
4. Apresentar decisões; ao receber a escolha, resolver efeitos com probabilidades.
5. Resolver eleição, se houver (modelo abaixo).
6. Atualizar dimensões, registrar no histórico e gerar manchetes.

Na `phase = 'civil'` (Fase 0), o pipeline troca os passos 3 e 5: sorteia eventos civis (por origem e genéricos), não há eleição, e o jogador pode abrir uma porta de entrada. Ao abrir, a engine converte prestígio e rede em recursos políticos e muda para `phase = 'politica'` (doc 07).

### Modelo de eleição (v0)
Pontuação = base eleitoral + mídia + dinheiro + estratégia + humor popular do mundo − rejeição (escândalos, polarização) + ruído. Votos em %, comparados a adversários gerados com perfil do cargo. Calibrar por simulação em lote.

## Eventos e condições
Linguagem declarativa de condições (`all/any/not`, comparações de atributo, `hasTag`, `yearBetween`, `office`) interpretada pela engine. Efeitos: `add/set` em atributos, `addTag`, `schedule(eventId, delayYears)`, `unlockOption`.

## Gerador de narrativa
Templates com variáveis e sorteio de variantes por tom, produzindo manchetes, resumo anual e epílogo. Texto autoral nos eventos; geração só para o "colante" entre eles.

## Persistência e versionamento
- Save = `{ saveVersion, contentVersion, seed, decisions[] }`; o estado é recomputado por replay.
- Permite desafio diário (seed por data) e compartilhamento sem backend.
- Migrações simples por `saveVersion`.

## Testes
- Unitários da engine (condições, efeitos, RNG).
- **Testes de propriedade**: determinismo, nenhum atributo fora de faixa.
- **Simulação em lote** (CLI): 10 mil partidas com decisões aleatórias para verificar distribuição de arquétipos, taxa de chegada à presidência, eventos nunca disparados.
- Validação de conteúdo no CI (schema, IDs únicos, referências existentes).
- e2e de uma partida completa.

## Observabilidade
Sem telemetria no MVP. Opcional depois: eventos anônimos de arquétipo final e decisões populares.
