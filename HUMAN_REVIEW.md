# Revisão humana

Tudo que o Claude não deve decidir sozinho entra aqui durante a Trilha A. Formato: `[ ] área · item · por quê`.

## Âncoras e fontes

- [ ] conteúdo · Todas as 17 âncoras (`packages/content/data/anchors.json`) · foram escritas de memória, sem consulta às fontes; conferir fatos, datas e redação neutra antes de qualquer release
- [ ] conteúdo · Fontes sem URL (TSE, Senado, STF, Banco Central, PF/MPF, OMS, cobertura jornalística) · só as leis e emendas do Planalto têm link; localizar a página primária de cada uma
- [ ] conteúdo · URLs do Planalto (leis 8.024/1990, 8.880/1994, 13.979/2020 e EC 16/1997) · padrão de endereço presumido, abrir e confirmar que cada link existe
- [ ] conteúdo · Data de 1989-11-15 (primeiro turno) · a âncora cobre a eleição inteira, que teve segundo turno em dezembro; confirmar qual data citar
- [ ] conteúdo · Data de 1992-12-29 (julgamento no Senado) · o processo começou em setembro; confirmar o marco mais adequado e a redação do vice assumindo
- [ ] conteúdo · Data de 1999-01-15 (câmbio flutuante) · a banda foi alargada em 13/01 e abandonada em 15/01; confirmar e achar a norma do Banco Central
- [ ] conteúdo · Data de 2005-06-06 e fontes do escândalo de 2005 · data aproximada da denúncia pública; confirmar, e decidir se citar a ação penal do STF é adequado
- [ ] conteúdo · Data de 2013-06-17 e causa dos protestos · confirmar o marco (manifestações de junho) e a descrição do gatilho
- [ ] conteúdo · Âncora de 2016 · confirmar a data (31/08/2016) e o texto sobre as acusações, sem juízo sobre o mérito
- [ ] conteúdo · Âncoras de 2014, 2020, 2022 e 2023 · fatos recentes: checar a descrição neutra e se algum ponto exige revisão jurídica
- [ ] conteúdo · Efeitos de mundo das âncoras (±4 a ±12) · são direção do doc 04 com magnitudes provisórias; calibrar na simulação em lote (E5-1)

## Viés, tom e estereótipos

- [ ] conteúdo · Textos das âncoras 2002, 2016, 2018 e 2022 · tratam de alternância de poder e eleições polarizadas; revisar se algum trecho soa a juízo partidário
- [ ] conteúdo · Perfis dos partidos fictícios (`parties.json`, campo `leaning`) · a posição no eixo econômico e social pode ser lida como alusão a partidos reais; revisar
- [ ] conteúdo · Pontos fortes e fracos das origens · conferir se não reforçam estereótipos de categorias (sindicalista, trabalhador rural, empresário etc.)

## Jurídico

- [ ] jurídico · Âncoras sobre fatos recentes com pessoas vivas (2014 a 2023) · avaliar com advogado antes de publicar, conforme docs/04
- [ ] jurídico · Siglas e nomes fictícios (PDP, APN, MTT, POM, FC, CF) · checar semelhança com partidos ou marcas registradas reais
- [ ] jurídico · Lista de termos proibidos do validador (`validate.ts`) · foi montada de memória e é incompleta; ampliar com nomes e siglas reais

## Balanceamento (metas não atingidas)

- [ ] balanceamento · Multiplicadores de conversão, bônus de atributo e recursos iniciais das 6 origens · valores provisórios, sem simulação em lote ainda

## Nome, domínio e publicação

## Visual e interface
