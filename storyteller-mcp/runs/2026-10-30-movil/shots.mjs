// Capturas de la app tal como está (2026-10-30), escritorio y móvil, con la
// cuenta QA3 y el mundo 146 (historia «La carta del recaudador» con llegadas).
// Uso: QA3_USER=… QA3_PASSWORD=… node shots.mjs [desktop|mobile]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const req = createRequire('C:/Users/tonid/Desktop/dojoCode/storyteller-generator-v2/desktop/package.json');
const { chromium } = req('playwright-core');
const LAB = 'C:/Users/tonid/AppData/Local/Temp/claude/C--Users-tonid-Desktop-dojoCode/ef2394e2-cce6-484b-baac-37d172321955/scratchpad/movil-lab';
const WEB = 'http://localhost:5173';
const API = 'http://localhost:8080';
const WORLD = 146;
const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 } },
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};
const which = process.argv[2] ? [process.argv[2]] : Object.keys(VIEWPORTS);

const login = await fetch(`${API}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: process.env.QA3_USER, password: process.env.QA3_PASSWORD }) });
const { token } = await login.json();
if (!token) throw new Error('login QA3 falló');
const stories = await (await fetch(`${API}/story/list?world_id=${WORLD}`, { headers: { Authorization: `Bearer ${token}` } })).json();
const story = stories[0];
console.log('historia', story?.id, story?.title);

const browser = await chromium.launch({ channel: 'msedge', headless: true });
for (const name of which) {
  const dir = path.join(LAB, name);
  fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(dir)) fs.unlinkSync(path.join(dir, f));
  const ctx = await browser.newContext({ ...VIEWPORTS[name], locale: 'es-ES' });
  await ctx.addInitScript((t) => localStorage.setItem('token', t), token);
  const page = await ctx.newPage();
  page.setDefaultTimeout(8000);
  const notes = [];
  let n = 0;
  const shot = async (label, full = false) => {
    n++;
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(dir, `${String(n).padStart(2, '0')}-${label}.png`), fullPage: full });
  };
  const step = async (label, fn, full = false) => {
    try {
      await fn();
      await shot(label, full);
      notes.push(`${label}: ok`);
    } catch (e) {
      await shot(`${label}-FALLO`);
      notes.push(`${label}: ${e.message.split('\n')[0].slice(0, 120)}`);
    }
  };
  const tab = async (name) => { const b = page.getByRole('button', { name, exact: true }); await b.scrollIntoViewIfNeeded(); await b.click({ force: true }); await page.waitForTimeout(1200); };
  const go = async (url) => { await page.goto(`${WEB}${url}`); await page.waitForLoadState('load'); await page.waitForTimeout(1500); };

  await step('login', async () => { await ctx.clearCookies(); await page.goto(`${WEB}/`); await page.evaluate(() => localStorage.removeItem('token')); await page.reload(); await page.waitForLoadState('networkidle'); });
  await page.evaluate((t) => localStorage.setItem('token', t), token);
  await step('mundos', () => go('/worlds'), true);
  await step('mundo', () => go(`/worlds/${WORLD}`));
  await step('mundo-chat', async () => { const b = page.getByRole('button', { name: 'Abrir el chat del mundo' }); if (await b.count()) { await b.click(); await page.waitForTimeout(1200); } else throw new Error('solo móvil'); });
  await page.keyboard.press('Escape'); await page.waitForTimeout(600);
  await step('lugares', async () => { await tab('Lugares'); });
  await step('personajes', async () => { await tab('Personajes'); });
  await step('personaje-abierto', async () => { await page.getByText('Olga', { exact: true }).first().click(); await page.waitForTimeout(1500); });
  await step('historias', async () => { await tab('Historias'); });
  await step('historia', async () => { await page.getByRole('button', { name: story.title }).click(); await page.waitForTimeout(2500); });
  await step('escena-panel', async () => { await page.waitForTimeout(2500); const rf = page.locator('.react-flow__node', { hasText: 'Paso del Sangriento' }); if (await rf.count()) await rf.first().dispatchEvent('click'); else await page.getByRole('button', { name: /^Detalle de/ }).first().click(); await page.waitForTimeout(1500); });
  await step('escena-taller', async () => { await page.getByRole('button', { name: 'Abrir taller' }).click(); await page.waitForTimeout(3000); });
  await step('taller-evento', async () => { await page.locator('button', { hasText: 'Evento' }).first().click(); await page.waitForTimeout(1200); });
  await page.keyboard.press('Escape'); await page.waitForTimeout(700);
  await step('taller-escena', async () => { await page.locator('button', { hasText: 'tocar para abrir' }).first().click(); await page.waitForTimeout(1200); });
  await page.keyboard.press('Escape'); await page.waitForTimeout(700);
  await step('escena-prosa', async () => { await page.getByRole('button', { name: /prosa|leer historia/i }).first().click(); await page.waitForTimeout(1500); }, true);
  await page.keyboard.press('Escape'); await page.waitForTimeout(700);
  await step('ajustes', () => go('/settings'), true);
  await step('ajustes-generador', () => go('/settings?tab=installation'), true);
  await step('crear-mundo', () => go('/worlds/create'), true);
  await step('mundo-arbol', async () => { await go('/worlds/141'); await page.waitForTimeout(1500); });
  await step('biblia', () => go(`/worlds/${WORLD}/bible`), true);
  fs.writeFileSync(path.join(dir, 'notas.txt'), notes.join('\n'));
  console.log(`== ${name}\n${notes.join('\n')}`);
  await ctx.close();
}
await browser.close();
