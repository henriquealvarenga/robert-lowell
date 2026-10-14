/**
 * Verifica links internos do site compilado (dist/): hrefs, srcs e âncoras.
 * Links externos são apenas listados (e testados com --external).
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASE } from '../src/config.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const checkExternal = process.argv.includes('--external');

function walk(dir: string, out: string[] = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.html')) out.push(p);
  }
  return out;
}

const pages = walk(DIST);
const ids = new Map<string, Set<string>>();
for (const p of pages) {
  const html = readFileSync(p, 'utf8');
  ids.set(p, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
}

function resolveLocal(target: string): string | null {
  if (!target.startsWith(BASE + '/') && target !== BASE) return null;
  let rel = target.slice(BASE.length).replace(/^\//, '');
  if (rel === '' || rel.endsWith('/')) rel += 'index.html';
  const p = join(DIST, decodeURIComponent(rel));
  if (existsSync(p)) return p;
  if (existsSync(p + '/index.html')) return p + '/index.html';
  return null;
}

const errors: string[] = [];
const external = new Set<string>();
for (const p of pages) {
  const html = readFileSync(p, 'utf8');
  const refs = [...html.matchAll(/\s(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  const srcsets = [...html.matchAll(/\ssrcset="([^"]+)"/g)].flatMap((m) => m[1].split(',').map((s) => s.trim().split(/\s+/)[0]));
  for (const raw of [...refs, ...srcsets]) {
    if (raw.startsWith('mailto:') || raw.startsWith('data:') || raw.startsWith('javascript:')) continue;
    if (/^https?:\/\//.test(raw)) {
      external.add(raw);
      continue;
    }
    const [path, hash] = raw.split('#');
    if (path === '') {
      if (hash && !ids.get(p)!.has(decodeURIComponent(hash))) errors.push(`${p.replace(DIST, '')}: âncora #${hash} não existe`);
      continue;
    }
    const file = resolveLocal(path);
    if (!file) {
      errors.push(`${p.replace(DIST, '')}: ${raw} não encontrado`);
      continue;
    }
    if (hash && file.endsWith('.html') && !ids.get(file)?.has(decodeURIComponent(hash))) errors.push(`${p.replace(DIST, '')}: ${raw} — âncora não existe`);
  }
}

console.log(`Páginas: ${pages.length}. Links externos distintos: ${external.size}.`);
if (checkExternal) {
  for (const url of external) {
    try {
      const r = await fetch(url, { method: 'HEAD', redirect: 'follow' });
      if (!r.ok) errors.push(`externo ${url}: HTTP ${r.status}`);
    } catch (e) {
      errors.push(`externo ${url}: ${(e as Error).message}`);
    }
  }
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Nenhum link quebrado.');
