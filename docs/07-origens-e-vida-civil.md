# 07 · Origens e vida civil (Fase 0)

## Ideia
Ninguém nasce vereador. O jogo começa na **vida civil**: o jogador escolhe quem é (sindicalista, professor, trabalhador rural, empresário, estudante em movimento estudantil...) e vive alguns anos atuando na própria área, ganhando prestígio e rede. A política aparece como **porta de entrada** que o jogador escolhe abrir, e a origem define quais portas existem e quanto vale o que ele construiu.

Efeito esperado: o "de onde você veio" vira identidade, muda os recursos iniciais, os eventos e o julgamento final (fidelidade à origem).

## Estrutura da fase
- **Duração**: 3 a 8 turnos anuais (o jogador decide quando abrir a porta; o motor força um desfecho ao fim do oitavo).
- **Decisões**: 1 a 2 por turno, ligadas à atuação (greve, assembleia, campanha, negócio, ocupação, eleição de diretoria).
- **Variáveis próprias**: **Prestígio civil** (0–100) e **Rede** (0–100), mais atributos e recursos comuns.
- **Marcos**: (1) atuar e crescer na área, (2) definir afinidade partidária e filiação, (3) abrir uma porta de entrada.

## Portas de entrada

| Porta | Leva a | Requisitos típicos |
|---|---|---|
| Candidatura direta | Vereador (ou deputado, com prestígio muito alto) | Idade mínima, filiação em dia, Prestígio ≥ limiar |
| Liderança de entidade | Candidato apoiado pela categoria | Cargo na entidade, Rede ≥ limiar |
| Cargo de confiança ou assessoria | Secretaria, gabinete, partido | Convite (evento) ou Capital político |
| Sucessão ou apadrinhamento | Candidatura herdada de aliado | Aliado forte, boa Reputação |
| Chamado em crise | Candidatura emergencial | Evento específico (ex.: mobilização local) |

O jogador também pode adiar a entrada para acumular prestígio, com risco de oportunidade perdida e de a janela eleitoral passar.

## Regras de entrada (validar por época)
- **Idade mínima por cargo**: 18 (vereador), 21 (deputado e prefeito), 30 (governador), 35 (senador e presidente).
- **Filiação partidária e domicílio eleitoral** com prazo antes da eleição (hoje 6 meses; conferir a regra de cada período).
- **Janela eleitoral**: eleições municipais e gerais se alternam a cada 2 anos; a porta só se converte em candidatura na eleição seguinte.

## Origens

| Origem | Força inicial | Fraqueza | Portas mais naturais |
|---|---|---|---|
| Sindicalista | Articulação, Base organizada | Dinheiro, Mídia | Liderança de entidade, candidatura via partido ligado ao movimento |
| Professor | Credibilidade, Base local | Dinheiro, Estratégia eleitoral | Liderança de entidade, chamado em crise |
| Trabalhador rural | Base coesa em cooperativa ou associação | Mídia, Dinheiro | Liderança de entidade, apadrinhamento |
| Empresário | Dinheiro, Rede econômica | Base popular, imagem | Candidatura direta, cargo de confiança |
| Estudante em movimento estudantil | Oratória, mobilização jovem | Dinheiro, Gestão | Assessoria, candidatura via partido, chamado em crise |
| Líder comunitário | Base territorial | Dinheiro, Mídia | Candidatura direta, chamado em crise |
| Advogado | Oratória, Rede jurídica | Base popular | Cargo de confiança, candidatura direta |
| Profissional de saúde | Credibilidade, Base local | Dinheiro | Liderança de entidade, chamado em crise |
| Jornalista ou radialista | Mídia | Base organizada, independência questionada | Candidatura direta |
| Líder religioso | Base fiel | Rejeição de parte do eleitorado | Liderança de entidade, apadrinhamento |
| Militar ou policial (reserva) | Base na categoria, imagem de ordem | Articulação, Mídia | Liderança de entidade, candidatura direta |
| Servidor público | Gestão, conhecimento da máquina | Carisma | Cargo de confiança |
| Herdeiro de família política | Capital político, Dinheiro | Reputação (nepotismo) | Sucessão |
| Criador de conteúdo (a partir de ~2010) | Mídia, alcance | Gestão, base real | Candidatura direta |

Toda origem tem pontos fortes e fracos; nenhuma é "a melhor". A tabela é ponto de partida para balanceamento por simulação em lote.

## Conversão para o jogo político
Na entrada, **Prestígio civil** e **Rede** viram **Base eleitoral** e **Capital político**, com multiplicadores por origem e por porta (ex.: sindicalista converte bem em Base; empresário converte bem em Dinheiro). Compromissos assumidos na vida civil geram **tags de fidelidade** (ex.: `promessa_categoria`) que cobram depois, no mandato.

## Eventos da fase civil
- **Genéricos** (qualquer origem): convite de partido, convite de padrinho político, escândalo na entidade, crise setorial, represália, projeto comunitário.
- **Específicos por origem**: greve e assembleia (sindicalista), conflito fundiário (trabalhador rural), eleição de DCE ou ato público (estudante), quebra ou fusão (empresário), crise na escola (professor).
- **Âncoras históricas** afetam origens de modos diferentes (ver doc 04).

## Origens por época
Cada origem tem `availableFrom` e `availableUntil` (ex.: criador de conteúdo só a partir de ~2010). No MVP o ano inicial é 1988; origens dependentes de época entram com os pacotes de partida.

## Fidelidade à origem
Nova dimensão de avaliação: quanto o político manteve os compromissos com a base de onde veio. Gera arquétipos como **Fiel às origens** e **Traiu a base**, e alimenta o epílogo ("da fábrica ao Planalto", "da sala de aula ao Senado").

## Escopo
- **MVP**: 6 origens jogáveis (sindicalista, professor, trabalhador rural, empresário, estudante em movimento estudantil, líder comunitário), 10 eventos genéricos e 3 exclusivos por origem.
- **Depois**: demais 8 origens, final "permaneceu na vida civil", interações âncora × origem aprofundadas.
