# 03 · Modelo de dados

Esboço em TypeScript. Os schemas finais serão escritos em Zod em `packages/content`.

## Estado do político
```ts
interface PlayerState {
  year: number;
  age: number;
  phase: 'civil' | 'politica';
  originId: OriginId;
  civil: { prestige: number; network: number; entryDoorsOpen: EntryDoorId[] }; // Fase 0
  office: OfficeId | null;          // null na vida civil; 'vereador' | 'prefeito' | ...
  party: PartyId;                   // fictício
  attributes: Record<AttrId, number>; // 0..100
  resources: { capital: number; money: number; base: number; media: number };
  hidden: { scandalRisk: number; synergies: string[] };
  tags: Record<string, number>;     // acumuladores: 'aliado_centrao', 'processado'
  scheduled: ScheduledEvent[];      // consequências futuras
  history: HistoryEntry[];
}
```

## Mundo
```ts
interface WorldState {
  economy: number; mood: number; congressFragmentation: number;
  mediaPressure: number; oversight: number; polarization: number; // 0..100
}
```

## Origem e portas de entrada
```ts
interface Origin {
  id: OriginId;                     // 'ori_sindicalista', 'ori_professor', ...
  label: string;
  availableFrom?: number;           // ano (ex.: criador de conteúdo ~2010)
  availableUntil?: number;
  startingAttributes: Partial<Record<AttrId, number>>;
  startingResources: Partial<{ capital: number; money: number; base: number; media: number }>;
  weaknesses: string[];
  civilPrestige: number; civilNetwork: number;   // ponto de partida da Fase 0
  conversion: { toBase: number; toCapital: number; toMoney: number }; // multiplicadores
  entryDoors: EntryDoorId[];
  eventTags: string[];              // eventos civis exclusivos
}

interface EntryDoor {
  id: EntryDoorId;                  // 'candidatura_direta' | 'lideranca_entidade' | ...
  label: string;
  requires: Condition;              // idade, filiação, prestígio, rede
  leadsTo: OfficeId | 'cargo_confianca' | 'assessoria';
  conversionBonus?: Effect[];
}
```

A transição `civil → politica` roda no pipeline do turno: ao abrir uma porta, converte `prestige`/`network` em `base`/`capital`, fixa o cargo inicial na próxima janela eleitoral e define `phase = 'politica'`.

## Evento
```ts
interface GameEvent {
  id: string;
  kind: 'anchor' | 'career';
  title: string;
  text: string;                    // pt-BR
  when?: Condition;                // elegibilidade
  weight?: number | WeightRule[];  // chance relativa
  anchorYear?: number;             // só para âncoras
  worldEffects?: Effect[];         // âncoras movem o mundo
  choices?: Choice[];
  tags?: string[];
}
```

## Decisão (Choice)
```ts
interface Choice {
  id: string;
  label: string;
  requires?: Condition;            // ex.: capital >= 30
  outcomes: Outcome[];             // resolvido por probabilidade
}
interface Outcome {
  chance: number | Formula;        // pode depender de atributos
  text: string;
  effects: Effect[];
}
```

## Condição e efeito
```ts
type Condition =
  | { all: Condition[] } | { any: Condition[] } | { not: Condition }
  | { attr: AttrId; op: '>=' | '<=' | '=='; value: number }
  | { hasTag: string; min?: number }
  | { office: OfficeId | OfficeId[] }
  | { phase: 'civil' | 'politica' }
  | { origin: OriginId | OriginId[] }
  | { age: { op: '>=' | '<='; value: number } }
  | { yearBetween: [number, number] }
  | { world: keyof WorldState; op: string; value: number };

type Effect =
  | { add: AttrId | ResourceId; value: number }
  | { addTag: string; value?: number }
  | { removeTag: string }
  | { schedule: { eventId: string; delayYears: number; chance?: number } }
  | { setOffice: OfficeId }
  | { headline: string };
```

## Eleição
```ts
interface Election { year: number; level: 'municipal' | 'geral'; offices: OfficeId[]; }
```

## Avaliação
```ts
interface Verdict {
  archetype: string; legacyTier: number; // 1..N
  dimensions: Record<'capacidade'|'desempenho'|'reputacao'|'recursos'|'posicao'|'consistencia'|'legado'|'fidelidade_origem', number>;
  timeline: HistoryEntry[]; summary: string;
}
```

## Convenções de conteúdo
- IDs em `snake_case`, prefixo por tipo (`ev_`, `org_`, `ori_`).
- Todo texto em pt-BR, sem nomes de pessoas reais.
- Cada evento declara `tags` para facilitar balanceamento e busca.
- Números de efeito em faixa pequena (±1 a ±15) para manter controlabilidade.
