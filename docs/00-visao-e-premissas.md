# 00 · Visão e premissas

## Visão
Um simulador rápido (20–30 min por partida) em que o jogador conduz uma carreira política de décadas dentro do sistema brasileiro pós-1988, tomando poucas decisões, mas que ecoam por anos.

## Pilares
1. **Poucas decisões, muito eco**: o jogador decide nos pontos críticos; o motor simula o resto.
2. **Influenciar, não controlar**: atributos e escolhas mudam probabilidades, o mundo reage.
3. **Consequência acumulada**: escolhas antigas voltam (alianças, escândalos, reputação).
4. **Vários tipos de sucesso**: reformador, articulador, populista, tecnocrata, sobrevivente.
5. **História emergente**: manchetes e relatos gerados pelas regras, não roteiros fixos por partida.
6. **De onde você vem importa**: a carreira começa na vida civil (sindicato, escola, campo, empresa, movimento estudantil), e a origem molda recursos, caminhos e o julgamento final.

## Público
Jogadores casuais de simuladores de escolhas, interessados em política e história, em navegador (desktop e mobile).

## Escopo do MVP
- Uma era: pós-1988, jogável da vida civil à presidência.
- Criação de personagem com origem, atributos e traços (6 origens no MVP; ver doc 07).
- Fase 0 de vida civil (3 a 8 turnos) com portas de entrada para a política.
- Turno anual, com ciclo eleitoral real (municipal e geral alternados).
- ~90 eventos autorais (~60 de carreira e ~30 de vida civil), com tags e condições.
- Avaliação final com arquétipo, legado, fidelidade à origem e linha do tempo.
- Save local, sem conta e sem backend.
- Primeiro cliente jogável em **terminal** (CLI); a interface web entra depois, na trilha humana (ADR-008 e ADR-009).

## Fora do MVP
Multiplayer, ranking online, outras eras, voz/áudio, monetização, localização além do pt-BR.

## Premissas editoriais (inegociáveis)
- **Personagens fictícios**: partidos, políticos e eleitos do jogo são inventados. Eventos históricos reais servem de pano de fundo ("Plano econômico de estabilização", "impeachment", "protestos de 2013").
- **Sem opinião do autor**: o jogo expõe trade-offs, não declara certo e errado partidário.
- **Sem glorificar crimes**: corrupção e abuso têm custo real no sistema.
- **Tom**: sátira leve e dramatização, evitando sensacionalismo.

## Premissas técnicas
- Engine **headless e determinística** (mesma seed + mesmas decisões = mesmo resultado).
- Conteúdo **orientado a dados** (JSON validado), fora do código.
- Tudo roda no cliente no MVP.
