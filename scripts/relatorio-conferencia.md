# Relatório de conferência da conversão

Gerado em 2026-10-16T07:55:41.294Z por `scripts/convert.ts`.

Para cada capítulo, o texto original (`.qmd`) e o texto gerado (`.md`) são normalizados
(imagens, notas e citações viram marcadores; espaços são colapsados) e comparados palavra a palavra.
**Qualquer diferença aparece abaixo.** Notas de rodapé e legendas são conferidas separadamente.

| Capítulo | Palavras (original) | Palavras (gerado) | Citações → chips | Notas | Figuras | Resultado |
|---|---:|---:|---:|---:|---:|---|
| index.qmd → introducao.md | 465 | 465 | 1 → 1 chips | 0 | 1 | ✅ idêntico |
| 1-biografia.qmd → biografia.md | 229 | 229 | 2 → 2 chips | 0 | 1 | ✅ idêntico |
| 2-bipolaridade.qmd → bipolaridade.md | 643 | 643 | 13 → 13 chips | 1 | 1 | ✅ idêntico |
| 3-crises.qmd → crises.md | 2328 | 2328 | 23 → 23 chips | 1 | 8 | ✅ idêntico |
| (crises/*.md) | | | | | | ✅ intro + 11 crises = capítulo |
| 4-estabilidade.qmd → estabilidade.md | 726 | 726 | 15 → 16 chips | 0 | 1 | ✅ idêntico |
| 5-ultimos_anos.qmd → ultimos-anos.md | 157 | 157 | 2 → 2 chips | 0 | 1 | ✅ idêntico |
| 6-historia_familiar.qmd → historia-familiar.md | 466 | 466 | 5 → 5 chips | 1 | 0 | ✅ idêntico |
| 7-conclusao.qmd → conclusao.md | 120 | 120 | 0 → 0 chips | 0 | 0 | ✅ idêntico |
| 9-about.qmd → sobre.md | 13 | 13 | 0 → 0 chips | 0 | 0 | ✅ idêntico (3 parágrafo(s) omitido(s), ver abaixo) |

Referências: 7 entradas no .bib, 7 citadas no texto.
Internações: 17 anos no CSV, total de 1086 dias.

## Imagens

- ilustracoes/capa.jpg (Gemini) → capa.webp (1376×768, 209 KB)
- ilustracoes/robert-lowell.jpg (Gemini) → robert-lowell.webp (1376×768, 199 KB)
- ilustracoes/bipolar.jpg (Gemini) → bipolar.webp (1600×893, 229 KB)
- ilustracoes/hotel.jpg (Gemini) → hotel.webp (1600×893, 200 KB)
- ilustracoes/depressao.jpg (Gemini) → depressao.webp (1600×893, 174 KB)
- ilustracoes/barricada.jpg (Gemini) → barricada.webp (1600×893, 163 KB)
- ilustracoes/cincinnati.jpg (Gemini) → cincinnati.webp (1600×893, 279 KB)
- ilustracoes/festa.jpg (Gemini) → festa.webp (1600×893, 332 KB)
- ilustracoes/mclean.jpg (Gemini) → mclean.webp (1600×893, 284 KB)
- ilustracoes/argentina.jpg (Gemini) → argentina.webp (1600×893, 249 KB)
- ilustracoes/opera.jpg (Gemini) → opera.webp (1600×893, 347 KB)
- ilustracoes/litio.jpg (Gemini) → litio.webp (1600×893, 215 KB)
- ilustracoes/intoxicacao-litio.jpg (Gemini) → intoxicacao-litio.webp (1376×768, 162 KB)
- ilustracoes/nova-york-1961.jpg (Gemini) → nova-york-1961.webp (1600×893, 131 KB)
- ilustracoes/hartford-1963.jpg (Gemini) → hartford-1963.webp (1600×893, 240 KB)
- ilustracoes/hartford-1965.jpg (Gemini) → hartford-1965.webp (1600×893, 165 KB)
- ilustracoes/capa-historia-familiar.jpg (Gemini) → capa-historia-familiar.webp (1600×893, 212 KB)
- ilustracoes/capa-conclusao.jpg (Gemini) → capa-conclusao.webp (1600×893, 243 KB)
- ilustracoes/capa-sobre.jpg (Gemini) → capa-sobre.webp (1600×893, 256 KB)
- ilustracoes/capa-referencias.jpg (Gemini) → capa-referencias.webp (1600×893, 259 KB)

## Legendas substituídas

Nas figuras com ilustração nova, a legenda original (o prompt em inglês do DALL·E) é trocada por uma descrição em português da imagem nova. O texto dos capítulos não muda.

- capa: “Escritor à mesa, junto à janela, com um caderno aberto em que uma onda sobe e desce pela página.”
- robert-lowell: “O poeta lendo numa poltrona, num escritório cheio de livros.”
- bipolar: “O poeta de pé junto a uma janela alta: metade do cômodo em luz quente e papéis espalhados, a outra metade em sombra azulada e imóvel.”
- hotel: “Rua vazia à noite; numa janela iluminada de hotel, uma figura de braços erguidos grita para a rua.”
- depressao: “Quarto em penumbra, cortinas quase fechadas; o poeta deitado na cama, vestido, de costas para o quarto.”
- barricada: “Corredor de hotel; porta entreaberta com uma cadeira e um baú encostados por dentro; duas pessoas preocupadas no corredor.”
- cincinnati: “Sala de aula universitária; o professor gesticula à tribuna, folhas voam da mesa, alunos trocam olhares inquietos.”
- festa: “Festa lotada numa sala de estar, à noite; o anfitrião em pé sobre uma cadeira, de copo na mão, falando por cima de todos.”
- mclean: “Manhã de primavera; o poeta, de costas, com uma mala pequena, sobe sozinho o caminho de cascalho até um hospital de tijolos.”
- argentina: “Praça com uma estátua equestre de bronze; o poeta sobe ao pedestal apontando para a frente, enquanto pombos voam e curiosos observam.”
- opera: “Interior de uma ópera; o poeta à beira do fosso da orquestra, braços erguidos como se regesse; músicos olham para cima, imóveis.”
- litio: “O poeta, já na casa dos cinquenta, escreve com calma a uma mesa arrumada; ao lado da xícara, um pequeno frasco de comprimidos.”
- intoxicacao-litio: “Quarto de hospital; o poeta sonolento na cama, de olhos semicerrados, enquanto uma enfermeira confere a prancheta.”

## Trechos dos dados interativos

79 trechos conferidos contra o texto original; 0 ausentes.

## Omissões autorizadas

Parágrafos do original que descrevem apenas o site antigo e, por decisão do autor, não aparecem nesta versão:

- sobre: “Esse é um resumo da história da bipolaridade do poeta norte-americano Robert Lowell, baseado no livro de Kay Redfield Jamison, "*Setting the River on Fire*", destinado a estudantes de psiquiatria e de psicologia, como texto auxiliar nas aulas sobre transtornos do humor.”
- sobre: “São João del Rei, julho de 2024”
- sobre: “Esse site foi criado em Markdown, com o Quarto e o VS Code, e a publicação online foi feita através do GitHub Pages. As imagens do site são meramente ilustrativas, tendo sido geradas pelo DALL·E, um sistema de inteligência artificial criado pela OpenAI.”

**Resultado: todos os capítulos idênticos ao original.**
