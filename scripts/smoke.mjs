// Teste de fumaça com o Chrome instalado: console, overflow horizontal, interações.
import { chromium, devices } from 'playwright-core';
const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:4321/robert-lowell';
const OUT = process.env.SHOTS ?? 'scripts/shots';
import { mkdirSync } from 'node:fs';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const problems = [];
async function run(name, ctxOpts, fn) {
  const ctx = await browser.newContext({ ...ctxOpts, reducedMotion: 'no-preference' });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) problems.push(`${name}: console ${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => problems.push(`${name}: pageerror: ${e.message}`));
  page.on('requestfailed', (r) => problems.push(`${name}: request failed: ${r.url()}`));
  try { await fn(page); } catch (e) { problems.push(`${name}: ${e.message}`); }
  await ctx.close();
}
const overflow = async (page, name) => {
  const w = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  if (w[0] > w[1]) problems.push(`${name}: overflow horizontal ${w[0]} > ${w[1]}`);
};
const pages = ['/', '/jornada/', '/capitulos/introducao/', '/capitulos/crises/', '/capitulos/historia-familiar/', '/capitulos/referencias/', '/quiz/', '/caso-clinico/'];
for (const scheme of ['light', 'dark']) {
  for (const p of pages) {
    await run(`mobile ${scheme} ${p}`, { ...devices['iPhone 13'], colorScheme: scheme }, async (page) => {
      await page.goto(BASE + p, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);
      await overflow(page, `mobile ${p}`);
      if (scheme === 'light') await page.screenshot({ path: `${OUT}/m${p.replace(/\//g, '_')}.png`, fullPage: true });
    });
  }
}
// interações no desktop
await run('desktop jornada', { viewport: { width: 1366, height: 900 }, colorScheme: 'light' }, async (page) => {
  await page.goto(BASE + '/jornada/', { waitUntil: 'networkidle' });
  await overflow(page, 'desktop jornada');
  await page.locator('[data-open-crisis="1949-04-saratoga-springs"]').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await page.locator('[data-open-crisis="1949-04-saratoga-springs"]').first().click();
  await page.waitForTimeout(500);
  const open = await page.locator('dialog[open]').count();
  if (open !== 1) problems.push('crise não abriu');
  await page.screenshot({ path: `${OUT}/d_crise-dialog.png` });
  await page.keyboard.press('Escape');
  await page.locator('#grafico-jornada').scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  const bars = await page.evaluate(() => Array.from(document.querySelectorAll('#grafico-jornada rect.bar')).filter((r) => Number(r.getAttribute('height')) > 0).length);
  if (bars < 10) problems.push(`gráfico: só ${bars} barras com altura`);
  await page.locator('#grafico-jornada [data-period="pos"]').click();
  await page.waitForTimeout(900);
  await page.locator('#grafico-jornada rect.bar[tabindex="0"]').first().hover();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/d_grafico-pos.png` });
  const ach = await page.evaluate(() => JSON.parse(localStorage.getItem('jornada-lowell:v1') || '{}'));
  if (!ach.achievements?.includes('grafico') || !ach.achievements?.includes('primeira-internacao')) problems.push(`conquistas: ${JSON.stringify(ach)}`);
  await page.locator('#progresso').scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/d_progresso.png` });
});
await run('desktop familia', { viewport: { width: 1366, height: 900 }, colorScheme: 'dark' }, async (page) => {
  await page.goto(BASE + '/capitulos/historia-familiar/', { waitUntil: 'networkidle' });
  await page.locator('[data-person="harriet"]').click();
  await page.waitForTimeout(400);
  await page.locator('[data-family-tree]').screenshot({ path: `${OUT}/d_familia.png` });
});
await run('desktop quiz', { viewport: { width: 1366, height: 900 }, colorScheme: 'light' }, async (page) => {
  await page.goto(BASE + '/quiz/', { waitUntil: 'networkidle' });
  const first = page.locator('[data-q]').first();
  await first.locator('input').nth(0).check();
  await first.locator('input').nth(5).check();
  await first.locator('[data-check]').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/d_quiz-feedback.png` });
});
await run('desktop caso', { viewport: { width: 1366, height: 900 }, colorScheme: 'light' }, async (page) => {
  await page.goto(BASE + '/caso-clinico/', { waitUntil: 'networkidle' });
  const first = page.locator('[data-etapa]').first();
  await first.locator('input').nth(1).check();
  await first.locator('[data-reveal]').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/d_caso-revelacao.png`, fullPage: false });
});
await browser.close();
console.log(problems.length ? problems.join('\n') : 'Sem problemas.');
process.exit(problems.length ? 1 : 0);
