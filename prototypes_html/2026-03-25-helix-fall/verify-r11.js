const { chromium } = require('playwright');
const path = require('path');

const root = 'C:/Users/robby/.openclaw/workspace/prototypes_html/2026-03-25-helix-fall';
const url = 'file:///' + path.resolve(root, 'index.html').replace(/\\/g,'/');

function assert(cond, msg){ if(!cond) throw new Error(msg); }

async function loadPage(){
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', msg => { if(msg.type() === 'error') errors.push('console:' + msg.text()); });
  await page.goto(url);
  return { browser, page, errors };
}

async function setupFor(page, section){
  await page.evaluate((section) => {
    const d = window.__helixDebug;
    d.startGame();
    let p = d.findUpcoming();
    d.setTowerAngle(d.angleForSection(p, section));
    d.setTowerVel(0);
    d.setInputKeyDir(0);
    d.setPlayerVelocity(24);
    d.setCameraY(p.y - 150 - d.getState().player.y);
  }, section);
}

(async() => {
  const results = {};

  {
    const { browser, page, errors } = await loadPage();
    await setupFor(page, 'safe');
    const before = await page.evaluate(() => {
      const d = window.__helixDebug;
      const p = d.findUpcoming();
      return { platformId:p.i, platformY:p.y };
    });
    await page.evaluate(() => window.__helixDebug.step(20));
    const after = await page.evaluate((platformId) => {
      const s = window.__helixDebug.getState();
      const p = s.platforms.find(x => x.i === platformId);
      return { player:s.player, world:s.world, platform:p, bottom:s.player.y + s.world.cameraY + s.player.r };
    }, before.platformId);
    assert(errors.length === 0, 'page errors during safe test: ' + errors.join(' | '));
    assert(after.player.alive, 'safe test: player died');
    assert(!after.platform.cleared, 'safe test: safe platform was cleared');
    assert(after.player.vy < 0, 'safe test: player did not bounce upward');
    assert(after.bottom <= before.platformY + 0.51, `safe test: player tunneled through cyan (${after.bottom} > ${before.platformY})`);
    results.safe = after;
    await browser.close();
  }

  {
    const { browser, page, errors } = await loadPage();
    await setupFor(page, 'gap');
    const before = await page.evaluate(() => {
      const d = window.__helixDebug;
      const p = d.findUpcoming();
      return { platformId:p.i, score:d.getState().world.score };
    });
    await page.evaluate(() => window.__helixDebug.step(20));
    const after = await page.evaluate((platformId) => {
      const s = window.__helixDebug.getState();
      const p = s.platforms.find(x => x.i === platformId);
      return { player:s.player, world:s.world, platform:p };
    }, before.platformId);
    assert(errors.length === 0, 'page errors during gap test: ' + errors.join(' | '));
    assert(after.player.alive, 'gap test: player died');
    assert(after.platform.cleared, 'gap test: platform did not clear through black gap');
    assert(after.world.score > before.score, 'gap test: score did not increase');
    results.gap = after;
    await browser.close();
  }

  {
    const { browser, page, errors } = await loadPage();
    await setupFor(page, 'danger');
    await page.evaluate(() => window.__helixDebug.step(20));
    const after = await page.evaluate(() => window.__helixDebug.getState());
    assert(errors.length === 0, 'page errors during danger test: ' + errors.join(' | '));
    assert(!after.player.alive, 'danger test: player survived red');
    assert(!after.world.playing, 'danger test: game still running after red');
    results.danger = after;
    await browser.close();
  }

  console.log(JSON.stringify({ ok:true, url, results }, null, 2));
})().catch(err => {
  console.error(err.stack || String(err));
  process.exit(1);
});