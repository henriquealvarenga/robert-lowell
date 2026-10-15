/**
 * Converte o livro Quarto original (../Robert_Lowell_Book_Project) nos arquivos de
 * dados deste projeto. Roda com `npm run convert`.
 *
 * Gera:
 *   src/content/chapters/*.md   capítulos de leitura (content collection)
 *   src/content/crises/*.md     uma entrada por crise (seções H2 do capítulo 3)
 *   src/data/hospital.json      dias de internação por ano (data/days_in_hospital.csv)
 *   src/data/references.json    referências (references.bib)
 *   src/assets/images/*.webp    ilustrações redimensionadas (máx. 1600 px)
 *   scripts/relatorio-conferencia.md  conferência palavra a palavra do texto
 *
 * O texto NÃO é alterado: apenas a sintaxe muda (citações viram chips, notas de
 * rodapé viram HTML, imagens viram figuras). O relatório prova isso.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { BASE } from '../src/config.ts';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, '..');
const SRC = resolve(ROOT, '..', 'Robert_Lowell_Book_Project');

const OUT = {
  chapters: join(ROOT, 'src/content/chapters'),
  crises: join(ROOT, 'src/content/crises'),
  data: join(ROOT, 'src/data'),
  images: join(ROOT, 'src/assets/images'),
  report: join(ROOT, 'scripts/relatorio-conferencia.md'),
};

// ---------------------------------------------------------------------------
// Capítulos: ordem, slug e metadados de navegação
// ---------------------------------------------------------------------------
interface ChapterSpec {
  file: string;
  slug: string;
  nav: string; // rótulo curto para menus
  achievement?: string; // conquista desbloqueada ao concluir a leitura
}
const CHAPTERS: ChapterSpec[] = [
  { file: 'index.qmd', slug: 'introducao', nav: 'Introdução' },
  { file: '1-biografia.qmd', slug: 'biografia', nav: 'Biografia', achievement: 'biografia' },
  { file: '2-bipolaridade.qmd', slug: 'bipolaridade', nav: 'Bipolaridade', achievement: 'bipolaridade' },
  { file: '3-crises.qmd', slug: 'crises', nav: 'As Crises', achievement: 'crises' },
  { file: '4-estabilidade.qmd', slug: 'estabilidade', nav: 'A Estabilidade', achievement: 'litio' },
  { file: '5-ultimos_anos.qmd', slug: 'ultimos-anos', nav: 'Últimos anos', achievement: 'ultimos-anos' },
  { file: '6-historia_familiar.qmd', slug: 'historia-familiar', nav: 'História Familiar', achievement: 'familia' },
  { file: '7-conclusao.qmd', slug: 'conclusao', nav: 'Conclusão', achievement: 'conclusao' },
  { file: '9-about.qmd', slug: 'sobre', nav: 'Sobre' },
];

// Imagens: nome original -> slug (o gráfico estático vira o gráfico interativo)
const IMAGES: Record<string, string> = {
  'cover.png': 'capa',
  'robert lowell.png': 'robert-lowell',
  'bipolar.png': 'bipolar',
  'hotel.png': 'hotel',
  'depression.png': 'depressao',
  'barricade.png': 'barricada',
  'young_lover.jpg': 'cincinnati',
  'party.jpg': 'festa',
  'mclean_hospital.jpg': 'mclean',
  'argentina.jpg': 'argentina',
  'opera.jpg': 'opera',
  'Lithium.png': 'litio',
  'LithiumLevels.png': 'intoxicacao-litio',
};
const CHART_IMAGE = 'internacoes.png';

// Metadados das 11 crises (seções H2 do capítulo 3), na ordem do texto.
// `tipo` só é marcado quando o texto original o permite; `seguidaDe` registra
// a fase que o texto descreve logo após a crise.
interface CrisisMeta {
  slug: string;
  ano: number;
  mes: number;
  local: string;
  tipo: 'mania' | 'depressao';
  seguidaDe?: 'depressao';
}
const CRISES: CrisisMeta[] = [
  { slug: '1949-04-saratoga-springs', ano: 1949, mes: 4, local: 'Saratoga Springs, NY', tipo: 'mania', seguidaDe: 'depressao' },
  { slug: '1949-09-nova-york', ano: 1949, mes: 9, local: 'Nova York, NY', tipo: 'depressao' },
  { slug: '1952-08-salzburg', ano: 1952, mes: 8, local: 'Salzburg, Áustria', tipo: 'mania' },
  { slug: '1954-04-cincinnati', ano: 1954, mes: 4, local: 'Cincinnati, Ohio', tipo: 'mania' },
  { slug: '1957-12-boston', ano: 1957, mes: 12, local: 'Boston, Massachusetts', tipo: 'mania' },
  { slug: '1959-04-mclean', ano: 1959, mes: 4, local: 'Boston, Massachusetts', tipo: 'mania' },
  { slug: '1961-03-nova-york', ano: 1961, mes: 3, local: 'Nova York, NY', tipo: 'mania' },
  { slug: '1962-08-argentina', ano: 1962, mes: 8, local: 'Argentina', tipo: 'mania' },
  { slug: '1963-12-hartford', ano: 1963, mes: 12, local: 'Hartford, CT', tipo: 'mania' },
  { slug: '1965-01-hartford', ano: 1965, mes: 1, local: 'Hartford, CT', tipo: 'mania' },
  { slug: '1966-12-nova-york', ano: 1966, mes: 12, local: 'Nova York, NY', tipo: 'mania' },
];

// ---------------------------------------------------------------------------
// Bibliografia (references.bib)
// ---------------------------------------------------------------------------
interface Reference {
  key: string;
  type: string;
  authors: string[]; // sobrenomes
  authorsFull: string;
  year: string;
  title: string;
  journal?: string;
  booktitle?: string;
  volume?: string;
  number?: string;
  pages?: string;
  doi?: string;
  url?: string;
  publisher?: string;
  address?: string;
  edition?: string;
  isbn?: string;
  label: string; // "(Jamison, 2017)"
}

function parseBib(text: string): Reference[] {
  const refs: Reference[] = [];
  const entryRe = /@(\w+)\s*\{\s*([^,]+),/g;
  let m: RegExpExecArray | null;
  while ((m = entryRe.exec(text))) {
    const type = m[1].toLowerCase();
    const key = m[2].trim();
    // corpo: do fim do cabeçalho até a chave de fechamento correspondente
    let depth = 1;
    let i = entryRe.lastIndex;
    while (i < text.length && depth > 0) {
      if (text[i] === '{') depth++;
      else if (text[i] === '}') depth--;
      i++;
    }
    const body = text.slice(entryRe.lastIndex, i - 1);
    const fields: Record<string, string> = {};
    const fieldRe = /(\w+)\s*=\s*\{/g;
    let f: RegExpExecArray | null;
    while ((f = fieldRe.exec(body))) {
      let d = 1;
      let j = fieldRe.lastIndex;
      while (j < body.length && d > 0) {
        if (body[j] === '{') d++;
        else if (body[j] === '}') d--;
        j++;
      }
      fields[f[1].toLowerCase()] = body.slice(fieldRe.lastIndex, j - 1).replace(/\s+/g, ' ').trim();
      fieldRe.lastIndex = j;
    }
    const authorsFull = fields.author ?? '';
    const authors = authorsFull.split(/\s+and\s+/).map((a) => a.split(',')[0].trim());
    const label = (() => {
      const y = fields.year ?? 's.d.';
      if (authors.length === 1) return `${authors[0]}, ${y}`;
      if (authors.length === 2) return `${authors[0]} & ${authors[1]}, ${y}`;
      return `${authors[0]} et al., ${y}`;
    })();
    refs.push({
      key,
      type,
      authors,
      authorsFull,
      year: fields.year ?? '',
      title: fields.title ?? '',
      journal: fields.journal,
      booktitle: fields.booktitle,
      volume: fields.volume,
      number: fields.number,
      pages: fields.pages,
      doi: fields.doi?.replace(/^https?:\/\/doi\.org\//, ''),
      url: fields.url?.split(/\s+/)[0],
      publisher: fields.publisher,
      address: fields.address,
      edition: fields.edition,
      isbn: fields.isbn,
      label,
    });
  }
  return refs.sort((a, b) => a.authors[0].localeCompare(b.authors[0]) || a.year.localeCompare(b.year));
}

// ---------------------------------------------------------------------------
// Transformações de sintaxe
// ---------------------------------------------------------------------------
const REF_PAGE = `${BASE}/capitulos/referencias/`;

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Converte `[@Key, pag. X]` e variações em chips de citação. */
function convertCitations(md: string, refs: Map<string, Reference>, used: Set<string>) {
  return md.replace(/\[(@[^\]]+)\]/g, (_all, inner: string) => {
    const parts: { key: string; locator: string }[] = [];
    const re = /@([A-Za-z0-9_-]+)\s*,?\s*([^@]*)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(inner))) {
      const locator = m[2].replace(/[,\s]+$/, '').trim();
      parts.push({ key: m[1], locator });
    }
    const chips = parts.map(({ key, locator }) => {
      const ref = refs.get(key);
      if (!ref) throw new Error(`Referência desconhecida: ${key}`);
      used.add(key);
      let loc = '';
      if (locator) {
        const pages = locator.replace(/^(p[áa]g\.?|pp?\.)\s*/i, '').trim();
        const plural = /[-–,]/.test(pages);
        loc = `, ${plural ? 'pp.' : 'p.'} ${pages}`;
      }
      const text = `${ref.label}${loc}`;
      const title = `${ref.authorsFull} (${ref.year}). ${ref.title}`;
      return `<a class="cite" href="${REF_PAGE}#ref-${key}" data-ref="${key}" title="${escapeHtml(title)}">${escapeHtml(text)}</a>`;
    });
    return `<span class="cite-group">(${chips.join('; ')})</span>`;
  });
}

/** Markdown inline mínimo (usado só dentro de notas de rodapé e legendas). */
function inlineMd(s: string) {
  return escapeHtml(s)
    .replace(/\\\[/g, '[')
    .replace(/\\\]/g, ']')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

/** Converte notas de rodapé `[^id]` / `[^id]: texto` em HTML com rótulos em português. */
function convertFootnotes(md: string, chapterSlug: string) {
  const defs = new Map<string, string>();
  md = md.replace(/^\[\^([^\]]+)\]:\s*(.+)$/gm, (_all, id: string, text: string) => {
    defs.set(id, text.trim());
    return '';
  });
  const order: string[] = [];
  md = md.replace(/\[\^([^\]]+)\]/g, (_all, id: string) => {
    if (!defs.has(id)) throw new Error(`Nota sem definição: ${id}`);
    if (!order.includes(id)) order.push(id);
    const n = order.indexOf(id) + 1;
    return `<sup class="nota-ref" id="ref-nota-${n}"><a href="#nota-${n}" aria-label="Nota ${n}">${n}</a></sup>`;
  });
  if (order.length === 0) return { md, notes: [] as { id: string; text: string }[] };
  const items = order
    .map((id, i) => {
      const n = i + 1;
      return `<li id="nota-${n}">${inlineMd(defs.get(id)!)} <a href="#ref-nota-${n}" class="nota-volta" aria-label="Voltar ao texto">↩</a></li>`;
    })
    .join('\n');
  const aside = `\n\n<aside class="notas" aria-labelledby="notas-${chapterSlug}">\n<h2 id="notas-${chapterSlug}">Notas</h2>\n<ol>\n${items}\n</ol>\n</aside>\n`;
  return { md: md.trimEnd() + aside, notes: order.map((id) => ({ id, text: defs.get(id)! })) };
}

interface Figure {
  file: string;
  slug: string;
  caption: string;
}

/** Converte `![legenda](images/x.png){atrs}` em figuras; o gráfico vira um slot interativo. */
function convertImages(md: string, relPrefix: string) {
  const figures: Figure[] = [];
  let chartCaption: string | undefined;
  md = md.replace(/^!\[([^\]]*)\]\(([^)]+)\)(\{[^}]*\})?[ \t]*$/gm, (_all, caption: string, src: string) => {
    const file = decodeURIComponent(src.replace(/^images\//, ''));
    if (file === CHART_IMAGE) {
      chartCaption = caption;
      return `<div class="chart-slot" data-chart="internacoes" data-caption="${escapeHtml(caption)}"></div>`;
    }
    const slug = IMAGES[file];
    if (!slug) throw new Error(`Imagem não mapeada: ${file}`);
    figures.push({ file, slug, caption });
    const alt = escapeHtml(caption.replace(/\*/g, ''));
    return [
      `<figure class="ilustracao">`,
      ``,
      `![${alt}](${relPrefix}/assets/images/${slug}.webp)`,
      ``,
      `<figcaption>${inlineMd(caption)} <span class="ai-badge">Ilustração gerada por IA (DALL·E)</span></figcaption>`,
      ``,
      `</figure>`,
    ].join('\n');
  });
  return { md, figures, chartCaption };
}

function yamlStr(s: string) {
  return JSON.stringify(s);
}

// ---------------------------------------------------------------------------
// Conferência: normaliza original e gerado para comparar palavra a palavra
// ---------------------------------------------------------------------------
function normalizeOriginal(qmd: string) {
  return qmd
    .replace(/^!\[[^\]]*\]\([^)]+\)(\{[^}]*\})?\s*$/gm, '')
    .replace(/^\[\^[^\]]+\]:.*$/gm, '')
    .replace(/\[@[^\]]+\]/g, ' ⟦CITE⟧ ')
    .replace(/\[\^[^\]]+\]/g, ' ⟦NOTA⟧ ')
    .replace(/\{\.unnumbered\}/g, '')
    .replace(/^::: \{#refs\}\s*$|^:::\s*$/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}
function normalizeGenerated(md: string) {
  return md
    .replace(/^---[\s\S]*?---\n/, '')
    .replace(/<figure class="ilustracao">[\s\S]*?<\/figure>/g, '')
    .replace(/<div class="chart-slot"[^>]*><\/div>/g, '')
    .replace(/<aside class="notas"[\s\S]*?<\/aside>/g, '')
    .replace(/<span class="cite-group">\((?:<a class="cite"[^>]*>[^<]+<\/a>(?:; )?)+\)<\/span>/g, ' ⟦CITE⟧ ')
    .replace(/<sup class="nota-ref"[\s\S]*?<\/sup>/g, ' ⟦NOTA⟧ ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Diff de palavras (LCS) — devolve trechos removidos/adicionados. */
function wordDiff(a: string[], b: string[]) {
  const n = a.length, m = b.length;
  const dp: Uint16Array[] = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: string[] = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) out.push(`- ${a[i++]}`);
    else out.push(`+ ${b[j++]}`);
  }
  while (i < n) out.push(`- ${a[i++]}`);
  while (j < m) out.push(`+ ${b[j++]}`);
  return out;
}

// ---------------------------------------------------------------------------
// Execução
// ---------------------------------------------------------------------------
async function main() {
  for (const dir of Object.values(OUT)) {
    if (dir.endsWith('.md')) continue;
    mkdirSync(dir, { recursive: true });
  }
  for (const dir of [OUT.chapters, OUT.crises]) {
    for (const f of readdirSync(dir)) if (f.endsWith('.md')) rmSync(join(dir, f));
  }

  const refList = parseBib(readFileSync(join(SRC, 'references.bib'), 'utf8'));
  const refs = new Map(refList.map((r) => [r.key, r]));
  const used = new Set<string>();
  const report: string[] = [
    '# Relatório de conferência da conversão',
    '',
    `Gerado em ${new Date().toISOString()} por \`scripts/convert.ts\`.`,
    '',
    'Para cada capítulo, o texto original (`.qmd`) e o texto gerado (`.md`) são normalizados',
    '(imagens, notas e citações viram marcadores; espaços são colapsados) e comparados palavra a palavra.',
    '**Qualquer diferença aparece abaixo.** Notas de rodapé e legendas são conferidas separadamente.',
    '',
    '| Capítulo | Palavras (original) | Palavras (gerado) | Citações → chips | Notas | Figuras | Resultado |',
    '|---|---:|---:|---:|---:|---:|---|',
  ];
  const diffs: string[] = [];
  let allOk = true;
  const readingOrder: string[] = [];

  for (const [index, spec] of CHAPTERS.entries()) {
    const qmd = readFileSync(join(SRC, spec.file), 'utf8').replace(/\r\n/g, '\n');
    const titleMatch = qmd.match(/^#\s+(.+?)\s*(\{[^}]*\})?\s*$/m);
    if (!titleMatch) throw new Error(`Sem título: ${spec.file}`);
    const title = titleMatch[1].trim();
    let body = qmd.replace(titleMatch[0], '').trim();

    const img = convertImages(body, '../..');
    body = img.md;
    body = convertCitations(body, refs, used);
    const fn = convertFootnotes(body, spec.slug);
    body = fn.md;

    const words = qmd.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
    const minutes = Math.max(1, Math.round(words / 200));
    const citeCount = (qmd.match(/\[@[^\]]+\]/g) ?? []).length;
    const chipCount = (body.match(/<a class="cite"/g) ?? []).length;
    const cover = img.figures[0]?.slug;

    const frontmatter = [
      '---',
      `title: ${yamlStr(title)}`,
      `nav: ${yamlStr(spec.nav)}`,
      `order: ${index}`,
      `words: ${words}`,
      `minutes: ${minutes}`,
      cover ? `cover: ${yamlStr(`../../assets/images/${cover}.webp`)}` : null,
      spec.achievement ? `achievement: ${yamlStr(spec.achievement)}` : null,
      img.chartCaption ? `chartCaption: ${yamlStr(img.chartCaption)}` : null,
      `source: ${yamlStr(spec.file)}`,
      '---',
      '',
    ]
      .filter((l) => l !== null)
      .join('\n');
    const out = frontmatter + body + '\n';
    writeFileSync(join(OUT.chapters, `${spec.slug}.md`), out);
    readingOrder.push(spec.slug);

    // conferência
    const a = normalizeOriginal(qmd.replace(titleMatch[0], `# ${title}`)).split(' ');
    const b = normalizeGenerated(out.replace(/^---[\s\S]*?---\n/, `# ${title}\n`)).split(' ');
    const d = wordDiff(a, b);
    // notas e legendas
    const origNotes = [...qmd.matchAll(/^\[\^([^\]]+)\]:\s*(.+)$/gm)].map((m) => m[2].trim());
    const genNotes = fn.notes.map((n) => n.text);
    const notesOk = JSON.stringify(origNotes) === JSON.stringify(genNotes);
    const origCaptions = [...qmd.matchAll(/^!\[([^\]]*)\]\(([^)]+)\)/gm)].map((m) => m[1]);
    const genCaptions = [...img.figures.map((f) => f.caption), ...(img.chartCaption ? [img.chartCaption] : [])];
    const captionsOk = origCaptions.every((c) => genCaptions.includes(c)) && origCaptions.length === genCaptions.length;
    const ok = d.length === 0 && notesOk && captionsOk;
    if (!ok) allOk = false;
    report.push(
      `| ${spec.file} → ${spec.slug}.md | ${a.length} | ${b.length} | ${citeCount} → ${chipCount} chips | ${fn.notes.length} | ${img.figures.length} | ${ok ? '✅ idêntico' : '❌ DIFERENÇA'} |`,
    );
    if (d.length) diffs.push(`## ${spec.file}\n\n\`\`\`diff\n${d.join('\n')}\n\`\`\``);
    if (!notesOk) diffs.push(`## ${spec.file} — notas\n\nOriginal: ${JSON.stringify(origNotes)}\nGerado: ${JSON.stringify(genNotes)}`);
    if (!captionsOk) diffs.push(`## ${spec.file} — legendas\n\nOriginal: ${JSON.stringify(origCaptions)}\nGerado: ${JSON.stringify(genCaptions)}`);

    // crises: seções H2 do capítulo 3
    if (spec.file === '3-crises.qmd') {
      const sections = body.split(/^(?=## )/m);
      const intro = sections.shift()!.trim();
      if (sections.length !== CRISES.length) throw new Error(`Esperava ${CRISES.length} crises, achei ${sections.length}`);
      writeFileSync(
        join(OUT.crises, '_intro.md'),
        `---\ntitle: "Introdução"\nslug: intro\norder: 0\nano: 0\nmes: 0\nlocal: ""\ntipo: intro\n---\n\n${intro.replace(/<aside class="notas"[\s\S]*$/, '').trim()}\n`,
      );
      const crisisDocs: string[] = [];
      sections.forEach((sec, i) => {
        const meta = CRISES[i];
        const h = sec.match(/^##\s+(.+)$/m)!;
        const heading = h[1].trim();
        let text = sec.replace(h[0], '').trim();
        // as notas do capítulo ficam no capítulo; na crise, a referência aponta para o capítulo
        text = text.replace(/<aside class="notas"[\s\S]*$/, '').trim();
        text = text.replace(/href="#nota-(\d+)"/g, `href="${BASE}/capitulos/crises/#nota-$1"`);
        const fig = text.match(/!\[[^\]]*\]\(([^)]+)\)/);
        const image = fig ? fig[1] : null;
        const fm = [
          '---',
          `title: ${yamlStr(heading)}`,
          `slug: ${yamlStr(meta.slug)}`,
          `order: ${i + 1}`,
          `ano: ${meta.ano}`,
          `mes: ${meta.mes}`,
          `local: ${yamlStr(meta.local)}`,
          `tipo: ${meta.tipo}`,
          meta.seguidaDe ? `seguidaDe: ${meta.seguidaDe}` : null,
          image ? `image: ${yamlStr(image)}` : null,
          '---',
          '',
        ]
          .filter((l) => l !== null)
          .join('\n');
        writeFileSync(join(OUT.crises, `${String(i + 1).padStart(2, '0')}-${meta.slug}.md`), fm + text + '\n');
        crisisDocs.push(`## ${heading}\n\n${text}`);
      });
      // conferência: intro + crises == capítulo
      const rebuilt = normalizeGenerated([intro, ...crisisDocs].join('\n\n'));
      const chapterNorm = normalizeGenerated(out.replace(/^---[\s\S]*?---\n/, '').replace(/<aside class="notas"[\s\S]*$/, ''));
      const crisesOk = rebuilt.replace(/href="[^"]*#nota-/g, 'href="#nota-') === chapterNorm;
      report.push(`| (crises/*.md) | | | | | | ${crisesOk ? '✅ intro + 11 crises = capítulo' : '❌ DIFERENÇA'} |`);
      if (!crisesOk) allOk = false;
    }
  }

  // Referências
  const unused = refList.filter((r) => !used.has(r.key)).map((r) => r.key);
  writeFileSync(join(OUT.data, 'references.json'), JSON.stringify(refList, null, 2) + '\n');
  report.push('', `Referências: ${refList.length} entradas no .bib, ${used.size} citadas no texto${unused.length ? ` (não citadas: ${unused.join(', ')})` : ''}.`);

  // Internações
  const csv = readFileSync(join(SRC, 'data/days_in_hospital.csv'), 'utf8').trim().split('\n').slice(1);
  const hospital = csv.map((l) => {
    const [ano, dias] = l.split(',').map(Number);
    return { ano, dias };
  });
  writeFileSync(
    join(OUT.data, 'hospital.json'),
    JSON.stringify(
      {
        fonte: 'Adaptado a partir da tabela de hospitalizações de Lowell, Jamison (2017), páginas 112-113.',
        litio: { inicio: 1967, fim: 1975 },
        intoxicacao: 1975,
        anos: hospital,
      },
      null,
      2,
    ) + '\n',
  );
  report.push(`Internações: ${hospital.length} anos no CSV, total de ${hospital.reduce((s, r) => s + r.dias, 0)} dias.`);

  // Imagens
  const sizes: string[] = [];
  for (const [file, slug] of Object.entries(IMAGES)) {
    const src = join(SRC, 'images', file);
    if (!existsSync(src)) throw new Error(`Imagem ausente: ${src}`);
    const dest = join(OUT.images, `${slug}.webp`);
    const info = await sharp(src).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toFile(dest);
    sizes.push(`${file} → ${slug}.webp (${info.width}×${info.height}, ${(info.size / 1024).toFixed(0)} KB)`);
  }
  report.push('', '## Imagens', '', ...sizes.map((s) => `- ${s}`));

  // Trechos usados nos dados interativos (marcos, quiz, caso, família) devem
  // existir, palavra por palavra, no texto original.
  const originals = new Map(CHAPTERS.map((c) => [c.file, readFileSync(join(SRC, c.file), 'utf8')]));
  const normText = (t: string) => t.replace(/\[@[^\]]+\]/g, ' ').replace(/\[\^[^\]]+\]/g, ' ').replace(/\s+/g, ' ');
  const inOriginal = (file: string, trecho: string) => normText(originals.get(file) ?? '').includes(normText(trecho).trim());
  const checks: { arquivo: string; item: string; ok: boolean }[] = [];
  const marcos = JSON.parse(readFileSync(join(OUT.data, 'marcos.json'), 'utf8')) as { id: string; fonte: string; trecho: string }[];
  for (const m of marcos) checks.push({ arquivo: 'marcos.json', item: m.id, ok: inOriginal(m.fonte, m.trecho) });
  const quiz = JSON.parse(readFileSync(join(OUT.data, 'quiz.json'), 'utf8')) as { perguntas: { id: string; fonte: string; trechos: string[]; opcoes: { evidencia?: string; correta: boolean }[] }[] };
  for (const q of quiz.perguntas) {
    checks.push({ arquivo: 'quiz.json', item: q.id, ok: q.trechos.every((t) => inOriginal(q.fonte, t)) });
    for (const o of q.opcoes) if (o.correta) checks.push({ arquivo: 'quiz.json', item: `${q.id} · evidência`, ok: !!o.evidencia && q.trechos.some((t) => normText(t).includes(normText(o.evidencia!))) });
  }
  const caso = JSON.parse(readFileSync(join(OUT.data, 'caso.json'), 'utf8')) as { etapas: { id: string; fonte: string; cenarioFonte?: string; cenario: string[]; revelacao: string[] }[]; fechamento: { fonte: string; trechos: string[] } };
  for (const e of caso.etapas) {
    checks.push({ arquivo: 'caso.json', item: `${e.id} · cenário`, ok: e.cenario.every((t) => inOriginal(e.cenarioFonte ?? e.fonte, t)) });
    checks.push({ arquivo: 'caso.json', item: `${e.id} · revelação`, ok: e.revelacao.every((t) => inOriginal(e.fonte, t)) });
  }
  checks.push({ arquivo: 'caso.json', item: 'fechamento', ok: caso.fechamento.trechos.every((t) => inOriginal(caso.fechamento.fonte, t)) });
  const familia = JSON.parse(readFileSync(join(OUT.data, 'familia.json'), 'utf8')) as { fonte: string; pessoas: Record<string, { trecho: string; fonteAlt?: string }> };
  for (const [id, p] of Object.entries(familia.pessoas)) checks.push({ arquivo: 'familia.json', item: id, ok: inOriginal(p.fonteAlt ?? familia.fonte, p.trecho) });
  const bad = checks.filter((c) => !c.ok);
  if (bad.length) allOk = false;
  report.push('', '## Trechos dos dados interativos', '', `${checks.length} trechos conferidos contra o texto original; ${bad.length} ausentes.`);
  for (const c of bad) report.push(`- ❌ ${c.arquivo}: ${c.item}`);

  report.push('', allOk ? '**Resultado: todos os capítulos idênticos ao original.**' : '**Resultado: há diferenças — ver abaixo.**');
  if (diffs.length) report.push('', ...diffs);
  writeFileSync(OUT.report, report.join('\n') + '\n');
  console.log(report.join('\n'));
  if (!allOk) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
