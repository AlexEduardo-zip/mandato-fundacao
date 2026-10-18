// Player-facing strings (pt-BR). Kept as data, overridable by content.
export interface GameTexts {
  archetypes: Record<string, { label: string; summary: string }>;
  tiers: string[];
  endings: Record<string, { label: string; summary: string }>;
  verdictSummary: string;
  /** Headline variants per situation; placeholders: {office} {pct} {year}. */
  headlines: Record<string, string[]>;
  summary: { empty: string; election: string; event: string; decision: string; anchor: string };
}

export const defaultTexts: GameTexts = {
  archetypes: {
    reformador: {
      label: "Reformador",
      summary: "Insistiu em mudar as regras do jogo e foi fiel a essa linha até o fim.",
    },
    articulador: {
      label: "Articulador",
      summary: "Fez da conversa e da costura política a sua principal ferramenta.",
    },
    populista: {
      label: "Populista",
      summary: "Falou direto ao povo e colheu o aplauso, com a conta ficando para depois.",
    },
    tecnocrata: {
      label: "Tecnocrata",
      summary: "Governou por planilhas, metas e relatórios, nem sempre com votos.",
    },
    sobrevivente: {
      label: "Sobrevivente",
      summary: "Atravessou crises e legislaturas sem nunca se definir por completo.",
    },
    estadista: {
      label: "Estadista",
      summary: "Chegou longe com reputação intacta e deixou marca no país.",
    },
    promessa_nao_cumprida: {
      label: "Promessa não cumprida",
      summary: "Tinha ambição e talento de sobra, mas a carreira ficou aquém do prometido.",
    },
    fiel_origens: {
      label: "Fiel às origens",
      summary: "Nunca esqueceu de onde veio, e isso moldou cada escolha.",
    },
    traiu_base: {
      label: "Traiu a base",
      summary: "Subiu na vida deixando para trás quem o levou até ali.",
    },
    caido_desgraca: {
      label: "Caído em desgraça",
      summary: "A reputação desabou antes que a carreira terminasse.",
    },
  },
  tiers: ["Anônimo", "Local", "Regional", "Nacional", "Histórico"],
  endings: {
    vida_civil: {
      label: "Permaneceu na vida civil",
      summary: "Nunca cruzou a porta da política e seguiu a vida fora dos holofotes.",
    },
    cassado: {
      label: "Cassado",
      summary: "O mandato terminou por decisão de outros, e não nas urnas.",
    },
    aposentado_no_auge: {
      label: "Aposentado no auge",
      summary: "Saiu de cena no momento certo, com a carreira em alta.",
    },
  },
  verdictSummary: "{archetype}. Cargo mais alto: {office}. Legado: {tier}.",
  headlines: {
    election_win_big: [
      "Vitória esmagadora: {pct}% dos votos para {office}",
      "Urnas falam alto e dão {pct}% ao novo {office}",
    ],
    election_win: [
      "Eleito {office} com {pct}% dos votos",
      "Candidato chega a {office} com {pct}% e promete cumprir o programa",
    ],
    election_loss: [
      "Derrota nas urnas: {pct}% não bastam para {office}",
      "Corrida por {office} termina com {pct}% e silêncio no comitê",
    ],
    mandate_end: ["Mandato de {office} chega ao fim em {year}"],
  },
  summary: {
    empty: "Um ano sem grandes acontecimentos.",
    election: "Eleição para {office}: {result} ({pct}%).",
    event: "Aconteceu: {title}.",
    decision: "Decisão: {text}",
    anchor: "No país: {title}.",
  },
};
