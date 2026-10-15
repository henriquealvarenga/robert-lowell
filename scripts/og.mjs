/**
 * Gera public/og.png (1200×630), o cartão de compartilhamento (Open Graph).
 * Usa só material próprio: a ilustração gerada no DALL·E pelo autor e as
 * fontes do site (licença SIL OFL). Roda com o Chrome instalado via playwright-core.
 */
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const font = (p) => `data:font/woff2;base64,${readFileSync(resolve('node_modules', p)).toString('base64')}`;
const img = `data:image/webp;base64,${readFileSync(resolve('src/assets/images/robert-lowell.webp')).toString('base64')}`;
const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>
@font-face{font-family:F;src:url(${font('@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2')});font-weight:100 900}
@font-face{font-family:S;src:url(${font('@fontsource-variable/source-serif-4/files/source-serif-4-latin-wght-normal.woff2')});font-weight:200 900}
@font-face{font-family:I;src:url(${font('@fontsource-variable/inter/files/inter-latin-wght-normal.woff2')});font-weight:100 900}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;background:#f5f1e9;color:#1e1b18;display:flex;overflow:hidden}
.pic{width:470px;height:630px;flex:none;position:relative;overflow:hidden;background:#ece6da}
.pic img{width:100%;height:100%;object-fit:cover;object-position:72% top;filter:saturate(.8)}
.pic::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(245,241,233,0) 70%,#f5f1e9 100%)}
.txt{flex:1;padding:64px 64px 56px 48px;display:flex;flex-direction:column;justify-content:center;gap:18px}
.eyebrow{font-family:I;font-size:17px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#6d665d}
h1{font-family:F;font-weight:500;font-size:78px;line-height:1.02;letter-spacing:-.01em}
.sub{font-family:S;font-size:27px;line-height:1.35;color:#4a453f}
.src{font-family:I;font-size:18px;line-height:1.45;color:#6d665d;margin-top:8px}
.src em{font-style:normal;color:#8b0000;font-weight:600}
.wave{height:3px;width:120px;background:linear-gradient(90deg,#8b0000,#1f4e8c);border-radius:2px}
.author{font-family:I;font-size:16px;color:#4a453f;margin-top:10px;line-height:1.5}
</style></head><body>
<div class="pic"><img src="${img}" alt=""></div>
<div class="txt">
  <div class="eyebrow">Transtorno bipolar · estudo de caso</div>
  <h1>A Jornada<br>de Lowell</h1>
  <div class="wave"></div>
  <div class="sub">A história do transtorno bipolar do poeta Robert Lowell (1917–1977)</div>
  <div class="src">Resumo didático do livro de <em>Kay Redfield Jamison</em>,<br><em>Robert Lowell: Setting the River on Fire</em> (2017)</div>
  <div class="author">Dr. Henrique Alvarenga da Silva · Médico Psiquiatra<br>CRM-MG 31.778 · RQE 8381</div>
</div>
</body></html>`;

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'public/og.png', type: 'png' });
await browser.close();
console.log('public/og.png gerado');
