# A Jornada de Lowell

Resumo didático, em formato interativo, do livro *Robert Lowell: Setting the River on Fire* (Vintage, 2017), de Kay Redfield Jamison, sobre o transtorno bipolar do poeta Robert Lowell (1917–1977). Material de ensino para estudantes de psiquiatria e psicologia, por Dr. Henrique Alvarenga da Silva.

- Site novo: https://henriquealvarenga.com/robert-lowell/
- Versão original em formato de texto (Quarto): https://henriquealvarenga.com/RobertLowell/

## Como funciona

- O texto **não é escrito aqui**: `npm run convert` lê o projeto Quarto do resumo em `../Robert_Lowell_Book_Project` (arquivos `.qmd`, `references.bib`, `data/days_in_hospital.csv`, `images/`) e gera `src/content/`, `src/data/*.json` e `src/assets/images/`. O script também escreve `scripts/relatorio-conferencia.md`, uma conferência palavra a palavra entre o original e o gerado.
- Os trechos usados no quiz, no caso clínico, na linha do tempo e na árvore familiar (`src/data/*.json`) são verificados pelo mesmo script contra o texto original.
- Astro (saída estática), TypeScript, D3 para o gráfico de internações, GSAP ScrollTrigger para a linha do tempo. Fontes locais (Fontsource). Sem rastreadores, cookies ou serviços externos.

## Scripts

```
npm run convert   # reconverte o resumo (precisa do projeto Quarto ao lado)
npm run dev       # desenvolvimento
npm run build     # gera dist/
npm run links     # confere links internos em dist/
node scripts/smoke.mjs   # teste de fumaça com o Chrome instalado (playwright-core)
```

## Publicação

GitHub Pages via Actions (`.github/workflows/deploy.yml`), como *project site* sob o domínio personalizado do site pessoal (`base: '/robert-lowell'`).
