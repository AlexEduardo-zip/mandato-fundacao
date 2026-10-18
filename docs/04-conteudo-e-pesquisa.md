# 04 · Conteúdo e pesquisa

## Diretrizes editoriais e legais
- Políticos, partidos e eleitos do jogo são **fictícios**. Não usar nomes, rostos ou falas de pessoas reais.
- Eventos reais entram como **âncoras neutras**, descritas pelos fatos públicos, sem juízo partidário.
- Evitar caricaturas de grupos; a sátira mira comportamentos e dilemas, não pessoas.
- Cada âncora deve ter **fonte de referência** (lei, decisão judicial, veículo de imprensa) registrada em `sources` no JSON.
- Revisão por pessoa de fora do time antes de cada release de conteúdo.
- Antes de publicar: avaliar com advogado o uso de fatos recentes envolvendo pessoas vivas.

## Âncoras históricas candidatas (v0, a validar com pesquisa)

| Ano | Âncora | Efeito no mundo (direção) |
|---|---|---|
| 1988 | Promulgação da Constituição | Abertura institucional, expectativa alta |
| 1989 | Primeira eleição presidencial direta pós-ditadura | Polarização e mídia ↑ |
| 1990 | Plano econômico com bloqueio de ativos | Economia ↓, humor ↓ |
| 1992 | Impeachment presidencial | Controle institucional ↑, humor ↓ |
| 1994 | Plano de estabilização monetária | Economia ↑, humor ↑ |
| 1997 | Emenda da reeleição | Estratégia eleitoral e governabilidade ↑ |
| 1999 | Mudança do regime cambial | Economia ↓ |
| 2002 | Alternância de poder no Executivo federal | Polarização ↑, expectativa social ↑ |
| 2005 | Escândalo de compra de apoio parlamentar | Mídia e controle ↑, humor ↓ |
| 2008 | Crise financeira global | Economia ↓ |
| 2013 | Protestos de rua em massa | Humor ↓, mídia ↑, volatilidade ↑ |
| 2014 | Operação anticorrupção de grande escala | Controle ↑, fragmentação ↑ |
| 2016 | Impeachment presidencial | Polarização ↑, governabilidade ↓ |
| 2018 | Eleição com ruptura do sistema partidário | Polarização ↑, mídia digital ↑ |
| 2020 | Pandemia | Economia ↓, mortes, pressão sobre gestão |
| 2022 | Eleição acirrada | Polarização ↑ |
| 2023 | Ataques às sedes dos Poderes | Controle ↑, polarização ↑ |

Tabela sem nomes de pessoas de propósito. A lista final e as datas exatas devem ser confirmadas em fontes primárias (Planalto, TSE, STF, Câmara) durante o épico de conteúdo.

## Fases da carreira (tom e conteúdo)
0. **Vida civil**: atuação na origem (sindicato, escola, campo, empresa, movimento estudantil), prestígio, filiação e porta de entrada (doc 07).
1. **Formação**: primeiros mandatos ou cargos, base local, primeiros apoios.
2. **Ascensão**: eleição municipal/estadual, primeiras alianças e concessões.
3. **Auge**: cargos executivos ou liderança no Congresso, decisões de alto risco.
4. **Crise**: escândalo, derrota, fim de ciclo político.
5. **Legado**: aposentadoria, sucessão, reabilitação ou queda.

## Banco de eventos de carreira (temas)
Aliança com partido maior · Troca de partido · Emenda orçamentária · Investigação · Delação · Debate decisivo · Apoio de empresário · Greve · Crise local (enchente, saúde) · Traição de aliado · Convite para ministério · Reforma impopular · Fake news contra o personagem · Sucessão de padrinho político.

## Eventos de vida civil (temas)
Greve · Assembleia e eleição de diretoria (sindicato, DCE, associação) · Mobilização e ocupação · Conflito fundiário · Crise setorial · Quebra ou fusão de empresa · Projeto comunitário · Convite de partido · Convite de padrinho político · Represália · Escândalo na entidade.

## Impacto das âncoras por origem (a validar)
Uma mesma âncora pesa diferente conforme a origem. Exemplos de direção, sem juízo de valor:
- Plano econômico de 1990: atinge Dinheiro de empresários e a vida de quem tinha poupança.
- Impeachment de 1992: amplia mobilização e Mídia de estudantes.
- Estabilização de 1994: muda a pauta de sindicalistas e trabalhadores.
- Protestos de 2013: aumentam peso de estudantes e líderes comunitários.
- Pandemia de 2020: pressiona profissionais de saúde, professores e empresários.

## Pacotes de pesquisa necessários
- Regras de filiação, domicílio eleitoral e idade mínima por época e por cargo.
- Padrões históricos de mobilização por categoria (sindical, estudantil, rural, empresarial) para calibrar eventos civis.
- Regras eleitorais por época (reeleição, financiamento, calendário, coligações).
- Estrutura e peso dos cargos (competências do prefeito, do governador etc.).
- Dados agregados de economia e popularidade por período para calibrar o mundo.
- Casos de arquétipos de carreira (sem personificar) para validar o avaliador final.

## Pipeline de conteúdo
Rascunho em planilha ou markdown → JSON → validação no CI → simulação em lote → revisão editorial → release.
