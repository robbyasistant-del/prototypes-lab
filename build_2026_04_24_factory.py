from pathlib import Path
from textwrap import dedent

root = Path(r"C:\Users\robby\.openclaw\workspace\Product_prototypes_html")
date = "2026-04-24"

games = {
    f"{date}-threadline-temple": {
        "title": "Threadline Temple",
        "index": dedent(r'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Threadline Temple</title>
<style>
:root{--bg:#09121e;--bg2:#13253f;--panel:rgba(11,20,36,.82);--line:rgba(126,198,255,.18);--ink:#edf5ff;--muted:#a5bddf;--cyan:#8ce6ff;--gold:#ffd166;--pink:#ff8bc7;--green:#7dffb6;--bad:#ff6b7f}
*{box-sizing:border-box}body{margin:0;font-family:Inter,Segoe UI,Arial,sans-serif;background:radial-gradient(circle at top,#1a3661,#08111d 60%);color:var(--ink);min-height:100vh}
#app{max-width:1400px;margin:auto;padding:16px;display:grid;grid-template-columns:330px 1fr;gap:16px}.panel{background:var(--panel);backdrop-filter:blur(14px);border:1px solid var(--line);border-radius:24px;box-shadow:0 22px 70px rgba(0,0,0,.28)}aside{padding:18px}.tag{display:inline-block;padding:7px 11px;border-radius:999px;background:rgba(140,230,255,.12);color:var(--cyan);font-size:12px;letter-spacing:.08em;text-transform:uppercase}h1{margin:10px 0 8px;font-size:34px;line-height:.95}.lede,.help,.small{color:var(--muted);line-height:1.5;font-size:14px}.stats{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:16px 0}.stat{padding:12px;border-radius:18px;background:rgba(255,255,255,.04)}.stat b{display:block;font-size:24px;margin-top:4px}button{border:0;border-radius:14px;padding:12px 16px;font-weight:800;cursor:pointer;color:#07111c;background:linear-gradient(135deg,var(--cyan),#c6fbff)}button.secondary{background:rgba(255,255,255,.08);color:var(--ink)}.badges{margin-top:12px;padding:12px;border-radius:18px;background:rgba(255,255,255,.04);font-size:13px}.badges .on{color:var(--green)}main{padding:14px;position:relative}.banner{padding:12px 16px;border-radius:16px;background:linear-gradient(90deg,rgba(140,230,255,.18),rgba(255,209,102,.16));font-size:14px}.feedback{position:absolute;right:24px;top:24px;z-index:3;padding:10px 14px;border-radius:14px;background:rgba(7,14,25,.8);color:var(--gold);font-weight:800}.boardWrap{margin-top:14px;display:grid;grid-template-columns:1fr 270px;gap:14px}.boardBox{padding:14px;border-radius:22px;background:rgba(255,255,255,.03)}#board{display:grid;grid-template-columns:repeat(6,minmax(60px,1fr));gap:10px;touch-action:none}.cell{aspect-ratio:1/1;border-radius:20px;display:grid;place-items:center;font-size:30px;font-weight:900;background:linear-gradient(180deg,#17304e,#0d1c2f);border:1px solid rgba(255,255,255,.08);position:relative;box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 10px 20px rgba(0,0,0,.16)}.cell.active{transform:translateY(-3px);border-color:var(--cyan);box-shadow:0 0 0 2px rgba(140,230,255,.22),0 12px 24px rgba(0,0,0,.25)}.cell.done{background:linear-gradient(180deg,#224f48,#12322d);border-color:rgba(125,255,182,.3)}.cell.wrong{animation:shake .25s linear 1}@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}.side{padding:14px;border-radius:22px;background:rgba(255,255,255,.03)}.targets{display:flex;flex-direction:column;gap:10px}.target{padding:12px;border-radius:16px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06)}.target.done{border-color:rgba(125,255,182,.35);background:rgba(125,255,182,.08)}.target .theme{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:var(--cyan)}.target b{display:block;margin-top:3px;font-size:20px}.progress{height:10px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden;margin-top:10px}.progress span{display:block;height:100%;background:linear-gradient(90deg,var(--cyan),var(--gold))}.overlay{position:absolute;inset:0;background:rgba(4,9,16,.62);display:flex;align-items:center;justify-content:center}.overlay.hidden{display:none}.card{width:min(560px,92%);padding:28px;text-align:center}.card h2{margin:0 0 8px;font-size:38px}.card p{color:var(--muted);line-height:1.55}.cta{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px}.trailSvg{position:absolute;inset:0;pointer-events:none}.trailSvg polyline{fill:none;stroke:rgba(140,230,255,.8);stroke-width:12;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 8px rgba(140,230,255,.3))}
@media(max-width:980px){#app{grid-template-columns:1fr}.boardWrap{grid-template-columns:1fr}#board{grid-template-columns:repeat(6,minmax(42px,1fr))}.feedback{position:static;margin-top:12px}}
</style>
</head>
<body>
<div id="app">
<aside class="panel">
<span class="tag">strand path / puzzle sprint</span>
<h1>Threadline Temple</h1>
<p class="lede">Draw glowing paths across the rune board to reveal 4 hidden trend-words. The theme is visible immediately. Win by finding all 4 before your <b>6 sparks</b> run out.</p>
<div class="stats">
  <div class="stat">Score<b id="score">0</b></div>
  <div class="stat">Best<b id="best">0</b></div>
  <div class="stat">Sparks<b id="lives">6</b></div>
  <div class="stat">Found<b id="foundCount">0 / 4</b></div>
</div>
<div><button id="startBtn">Enter Temple</button> <button id="clearBtn" class="secondary">Clear Path</button></div>
<div class="help" style="margin-top:14px"><b>How to play:</b> drag across adjacent tiles to spell a target word. Words are based on live market signals: word obsession, social heat, connection puzzles, and hidden-thread discovery.</div>
<div class="badges">Badges:<br><span id="b1">• Smooth Finder</span><br><span id="b2">• Zero-Waste Mystic</span><br><span id="b3">• Temple Master</span></div>
<p class="small" style="margin-top:14px">Immediate feedback, full win/lose states, persistent best score, no external assets.</p>
</aside>
<main class="panel">
<div class="banner"><b>Goal:</b> Find <b>WORDLE</b>, <b>THREAD</b>, <b>SOCIAL</b>, and <b>LINKS</b>. Drag through neighboring tiles only. Wrong submit burns 1 spark. Long chains = more score.</div>
<div class="feedback" id="feedback">Temple quiet. Your first path matters.</div>
<div class="boardWrap">
  <div class="boardBox" id="boardBox" style="position:relative">
    <svg class="trailSvg" id="trailSvg"></svg>
    <div id="board"></div>
  </div>
  <div class="side">
    <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)">Trend relics</div>
    <div class="targets" id="targets"></div>
    <div class="progress"><span id="progressBar" style="width:0%"></span></div>
    <div class="small" style="margin-top:12px">This is a tactile “trace the idea” loop inspired by Strands/Connections energy but played as a neon path ritual instead of a standard word grid.</div>
  </div>
</div>
<div class="overlay" id="overlay"><div class="panel card"><h2 id="ovTitle">Threadline Temple</h2><p id="ovText">Ancient trend runes are tangled. Trace the hidden words by dragging across adjacent tiles. Find all 4 words to win; 6 failed invocations and the temple seals shut.</p><div class="cta"><button id="playBtn">Start tracing</button></div></div></div>
</main>
</div>
<script>
const level={grid:[['W','O','R','D','L','E'],['N','I','K','S','L','H'],['T','H','R','E','A','D'],['S','Q','O','C','I','A'],['P','L','S','O','C','L'],['Y','U','L','I','N','S']],words:[{word:'WORDLE',theme:'Daily word obsession'},{word:'THREAD',theme:'Conversation gravity'},{word:'SOCIAL',theme:'X/Reddit/TikTok heat'},{word:'LINKS',theme:'Connections instinct'}]};
const board=document.getElementById('board'), trailSvg=document.getElementById('trailSvg'), overlay=document.getElementById('overlay');
const els={score:score,best:best,lives:lives,foundCount,feedback,targets,progressBar,ovTitle,ovText};
let state={running:false,score:0,lives:6,found:new Set(),selected:[],pointerDown:false,best:+localStorage.threadlineTempleBest||0};
const cells=[];
function setFeedback(t){els.feedback.textContent=t}
function renderTargets(){els.targets.innerHTML=''; for(const t of level.words){const done=state.found.has(t.word); const div=document.createElement('div'); div.className='target'+(done?' done':''); div.innerHTML=`<div class="theme">${t.theme}</div><b>${done?t.word:'??????'.slice(0,t.word.length)}</b>`; els.targets.appendChild(div);} }
function renderHud(){els.score.textContent=state.score; els.best.textContent=state.best; els.lives.textContent=state.lives; els.foundCount.textContent=`${state.found.size} / ${level.words.length}`; els.progressBar.style.width=(state.found.size/level.words.length*100)+'%'; renderTargets();}
function buildBoard(){board.innerHTML=''; cells.length=0; level.grid.forEach((row,r)=>row.forEach((letter,c)=>{const el=document.createElement('div'); el.className='cell'; el.textContent=letter; el.dataset.r=r; el.dataset.c=c; el.dataset.letter=letter; el.addEventListener('pointerdown',e=>{if(!state.running)return; state.pointerDown=true; beginCell(el);}); el.addEventListener('pointerenter',()=>{if(state.running&&state.pointerDown)addCell(el)}); el.addEventListener('pointerup',()=>{if(state.running)submitPath()}); board.appendChild(el); cells.push(el);})); updateTrail();}
function cellKey(el){return el.dataset.r+','+el.dataset.c}
function posOf(el){const a=el.getBoundingClientRect(), b=board.getBoundingClientRect(); return [a.left-b.left+a.width/2, a.top-b.top+a.height/2];}
function updateTrail(){const box=board.getBoundingClientRect(); trailSvg.setAttribute('viewBox',`0 0 ${box.width||600} ${box.height||600}`); trailSvg.innerHTML=state.selected.length?`<polyline points="${state.selected.map(posOf).map(p=>p.join(',')).join(' ')}"></polyline>`:''; cells.forEach(c=>c.classList.toggle('active',state.selected.includes(c)));}
function clearPath(){state.selected=[]; updateTrail();}
function adjacent(a,b){const dr=Math.abs(+a.dataset.r-+b.dataset.r), dc=Math.abs(+a.dataset.c-+b.dataset.c); return dr<=1&&dc<=1&&(dr+dc>0)}
function beginCell(el){clearPath(); state.selected=[el]; updateTrail(); setFeedback('Path started: '+el.dataset.letter)}
function addCell(el){const last=state.selected[state.selected.length-1]; if(!last)return; if(state.selected.includes(el))return; if(adjacent(last,el)){ state.selected.push(el); updateTrail(); setFeedback(state.selected.map(x=>x.dataset.letter).join('')); }}
function flashWrong(){for(const c of state.selected)c.classList.add('wrong'); setTimeout(()=>state.selected.forEach(c=>c.classList.remove('wrong')),250)}
function submitPath(){if(!state.selected.length)return; const word=state.selected.map(c=>c.dataset.letter).join(''); const target=level.words.find(w=>w.word===word && !state.found.has(w.word)); if(target){ state.found.add(word); state.score+=120+word.length*15+Math.max(0,state.lives-1)*5; if(state.selected.length===word.length)document.getElementById('b1').classList.add('on'); for(const c of state.selected)c.classList.add('done'); setFeedback('Relic restored: '+word+' +'+(120+word.length*15)); if(state.found.size===level.words.length){ document.getElementById('b2').classList.toggle('on',state.lives===6); win(); return; } } else { state.lives--; flashWrong(); setFeedback('False thread. Spark lost.'); if(state.lives<=0){ lose('The temple seals after too many false traces.'); return; } }
 clearPath(); renderHud(); }
function start(){state={running:true,score:0,lives:6,found:new Set(),selected:[],pointerDown:false,best:+localStorage.threadlineTempleBest||0}; cells.forEach(c=>c.classList.remove('done')); clearPath(); renderHud(); overlay.classList.add('hidden'); setFeedback('Trace your first relic now.');}
function finishOverlay(title,text){els.ovTitle.textContent=title; els.ovText.textContent=text; overlay.classList.remove('hidden');}
function win(){state.running=false; state.best=Math.max(state.best,state.score); localStorage.threadlineTempleBest=state.best; document.getElementById('b3').classList.add('on'); renderHud(); finishOverlay('Temple Master','You restored all 4 relic-words with '+state.lives+' sparks left. One more try: can you do it flawlessly for a cleaner mastery run?');}
function lose(text){state.running=false; state.best=Math.max(state.best,state.score); localStorage.threadlineTempleBest=state.best; renderHud(); finishOverlay('Game Over',text+' Final score: '+state.score+'.');}
addEventListener('pointerup',()=>{state.pointerDown=false}); addEventListener('resize',updateTrail);
document.getElementById('playBtn').onclick=start; document.getElementById('startBtn').onclick=start; document.getElementById('clearBtn').onclick=()=>{clearPath(); setFeedback('Path cleared.');};
buildBoard(); renderHud();
</script>
</body>
</html>'''),
        "report": dedent(r'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Threadline Temple - Report</title><style>body{margin:0;font-family:Inter,Segoe UI,Arial,sans-serif;background:#0b1020;color:#eaf1ff;padding:24px;line-height:1.65}main{max-width:980px;margin:auto;background:#121a31;border:1px solid #33456d;border-radius:24px;padding:28px}h2{color:#9fd0ff}</style></head><body><main><h1>Threadline Temple — Strategy Report</h1><p>Date: 2026-04-24 · Folder: <code>2026-04-24-threadline-temple</code></p><p><b>Trend signal used:</b> ranking data still heavily favors Wordle, Connections, and Strands-like discovery loops. This prototype translates that appetite into a tactile neon path-tracing ritual rather than a standard crossword or anagram.</p><h2>Core loop</h2><p>Players drag across adjacent letter tiles to reveal four market-signal words. Immediate feedback comes from the glowing path, spark loss on bad submits, and live target completion.</p><h2>Rewards / retention</h2><ul><li>Score reward weighted by precision and remaining sparks</li><li>Badges for clean tracing, no-waste runs, and full completion</li><li>Persistent best score for repeat attempts</li><li>Explicit win and fail states</li></ul><h2>SEO / ASO / SEM</h2><ul><li>strands inspired browser game</li><li>trace the hidden word game</li><li>connections puzzle alternative</li><li>html5 word path puzzle</li></ul><h2>KPIs</h2><ul><li>First-session completion rate</li><li>Average wrong traces per run</li><li>Median time to first word</li><li>Repeat-rate after near-miss losses</li></ul><h2>Experiments</h2><ul><li>Daily seeded temple boards</li><li>Longer relic words on streak days</li><li>Theme packs tied to live trend categories</li></ul><h2>Risks</h2><ul><li>Need enough board variety over time</li><li>Path hit-boxes must stay forgiving on mobile</li></ul></main></body></html>''')
    },
    f"{date}-signal-safari": {
        "title": "Signal Safari",
        "index": dedent(r'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Signal Safari</title>
<style>
:root{--bg:#120d08;--panel:rgba(36,21,12,.84);--ink:#fff3e7;--muted:#d7bfad;--gold:#ffd166;--green:#7dffb1;--red:#ff7285;--blue:#8edbff;--line:rgba(255,255,255,.08)}*{box-sizing:border-box}body{margin:0;font-family:Inter,Segoe UI,Arial,sans-serif;background:radial-gradient(circle at top,#5d351c,#120804 60%);color:var(--ink)}#app{max-width:1400px;margin:auto;padding:16px;display:grid;grid-template-columns:320px 1fr;gap:16px}.panel{background:var(--panel);border:1px solid rgba(255,209,102,.16);border-radius:24px;backdrop-filter:blur(12px);box-shadow:0 22px 70px rgba(0,0,0,.28)}aside{padding:18px}.tag{display:inline-block;padding:7px 11px;border-radius:999px;background:rgba(255,209,102,.12);color:var(--gold);font-size:12px;letter-spacing:.08em;text-transform:uppercase}h1{margin:10px 0 8px;font-size:34px;line-height:.95}.lede,.help,.small{color:var(--muted);font-size:14px;line-height:1.5}.stats{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:16px 0}.stat{padding:12px;border-radius:18px;background:rgba(255,255,255,.04)}.stat b{display:block;font-size:24px;margin-top:4px}button{border:0;border-radius:14px;padding:12px 16px;font-weight:800;cursor:pointer;background:linear-gradient(135deg,var(--gold),#ff9d42);color:#2a1308}button.secondary{background:rgba(255,255,255,.08);color:var(--ink)}.badges{margin-top:12px;padding:12px;border-radius:18px;background:rgba(255,255,255,.04);font-size:13px}.badges .on{color:var(--green)}main{padding:14px;position:relative}.banner{padding:12px 16px;border-radius:16px;background:linear-gradient(90deg,rgba(255,209,102,.18),rgba(142,219,255,.14));font-size:14px}.feedback{position:absolute;right:24px;top:24px;padding:10px 14px;border-radius:14px;background:rgba(24,12,7,.82);color:var(--gold);font-weight:800;z-index:3}.arena{margin-top:14px;position:relative;height:74vh;border-radius:24px;overflow:hidden;background:linear-gradient(180deg,#3d2616,#1b0f08 65%,#120804)}.lane{position:absolute;top:0;bottom:0;width:33.333%;border-left:1px solid rgba(255,255,255,.08)}.lane:nth-child(1){left:0}.lane:nth-child(2){left:33.333%}.lane:nth-child(3){left:66.666%}.laneHead{position:absolute;top:12px;left:50%;transform:translateX(-50%);padding:8px 10px;border-radius:999px;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.lane:nth-child(1) .laneHead{background:rgba(125,255,177,.16);color:var(--green)}.lane:nth-child(2) .laneHead{background:rgba(142,219,255,.16);color:var(--blue)}.lane:nth-child(3) .laneHead{background:rgba(255,114,133,.16);color:#ff9aa8}.jeep{position:absolute;bottom:22px;left:calc(16.666% - 46px);width:92px;height:52px;border-radius:18px;background:linear-gradient(180deg,#ffe2a3,#ffb44c);border:2px solid rgba(0,0,0,.15);box-shadow:0 14px 26px rgba(0,0,0,.22);transition:left .12s ease}.jeep:before,.jeep:after{content:'';position:absolute;bottom:-12px;width:22px;height:22px;border-radius:50%;background:#2f190f;box-shadow:inset 0 0 0 3px #6b4527}.jeep:before{left:10px}.jeep:after{right:10px}.crate{position:absolute;left:50%;transform:translateX(-50%);width:min(220px,78%);padding:14px 16px;border-radius:20px;background:rgba(19,10,6,.9);border:1px solid var(--line);text-align:center;box-shadow:0 16px 30px rgba(0,0,0,.22)}.crate .type{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--gold)}.crate b{display:block;margin-top:5px;font-size:24px}.flash{position:absolute;inset:auto 18px 18px auto;padding:10px 14px;border-radius:14px;background:rgba(19,10,6,.82);font-size:14px}.overlay{position:absolute;inset:0;background:rgba(8,3,1,.6);display:flex;align-items:center;justify-content:center}.overlay.hidden{display:none}.card{width:min(560px,92%);padding:28px;text-align:center}.card h2{margin:0 0 8px;font-size:38px}.card p{color:var(--muted);line-height:1.55}.cta{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px}.dust{position:absolute;width:8px;height:8px;border-radius:50%}
@media(max-width:980px){#app{grid-template-columns:1fr}.arena{height:60vh}.feedback{position:static;margin-top:12px}}
</style>
</head>
<body>
<div id="app">
<aside class="panel">
<span class="tag">lane dodge / trend capture</span>
<h1>Signal Safari</h1>
<p class="lede">Drive a hype-jeep across three lanes and catch the right trend crates: <b>WORD</b>, <b>SOCIAL</b>, and <b>LINK</b>. Avoid the doom crates. Hit <b>1800 points</b> before 3 crashes to win.</p>
<div class="stats"><div class="stat">Score<b id="score">0</b></div><div class="stat">Best<b id="best">0</b></div><div class="stat">Hull<b id="lives">3</b></div><div class="stat">Badges<b id="medals">0</b></div></div>
<div><button id="startBtn">Start chase</button> <button class="secondary" id="pauseBtn">Pause</button></div>
<div class="help" style="margin-top:14px"><b>How to play:</b> use ← ↓ → or tap a lane to move. Catch crates matching their lane color for combo rewards. Wrong capture or hazard hit removes hull instantly.</div>
<div class="badges">Badges:<br><span id="b1">• Combo Rover</span><br><span id="b2">• Clean Driver</span><br><span id="b3">• Signal King</span></div>
<p class="small" style="margin-top:14px">Trend inspiration: word-game dominance, social discovery heat, and connection logic — remixed as a kinetic survival collector instead of another static puzzle.</p>
</aside>
<main class="panel">
<div class="banner"><b>Goal:</b> lane-match the right crates fast. Correct catches build combo score. Reach 1800 to WIN. Three hits = GAME OVER.</div>
<div class="feedback" id="feedback">Dust settling. The chase begins when you move.</div>
<div class="arena" id="arena">
  <div class="lane"><div class="laneHead">WORD</div></div>
  <div class="lane"><div class="laneHead">SOCIAL</div></div>
  <div class="lane"><div class="laneHead">LINK</div></div>
  <div class="jeep" id="jeep"></div>
  <div class="flash" id="flash">Correct lane + correct crate = points.</div>
  <div class="overlay" id="overlay"><div class="panel card"><h2 id="ovTitle">Signal Safari</h2><p id="ovText">A stream of trend crates is crashing through the dunes. Shift lanes, catch the right signal, and keep your hull intact. Wrong catch or hazard = pain.</p><div class="cta"><button id="playBtn">Start safari</button></div></div></div>
</div>
</main>
</div>
<script>
const arena=document.getElementById('arena'), jeep=document.getElementById('jeep'), overlay=document.getElementById('overlay');
const laneNames=['WORD','SOCIAL','LINK']; const laneColors=['#7dffb1','#8edbff','#ff98a7'];
const els={score:score,best:best,lives:lives,medals,feedback,flash,ovTitle,ovText};
let dust=[]; let crates=[]; let lane=0; let combo=0; let medalsCount=0; let timer=70; let state={running:false,paused:false,score:0,lives:3,best:+localStorage.signalSafariBest||0,spawn:0};
function setFeedback(t){els.feedback.textContent=t; els.flash.textContent=t}
function renderHud(){els.score.textContent=state.score; els.best.textContent=state.best; els.lives.textContent=state.lives; els.medals.textContent=medalsCount; jeep.style.left=`calc(${16.666+lane*33.333}% - 46px)`}
function start(){state={running:true,paused:false,score:0,lives:3,best:+localStorage.signalSafariBest||0,spawn:0}; lane=1; combo=0; medalsCount=0; crates.forEach(c=>c.el.remove()); crates=[]; dust=[]; ['b1','b2','b3'].forEach(id=>document.getElementById(id).classList.remove('on')); overlay.classList.add('hidden'); renderHud(); setFeedback('Catch a crate now. Momentum matters.');}
function spawnCrate(){const type=Math.random()<.18?'HAZARD':laneNames[(Math.random()*3)|0]; const laneIndex=(Math.random()*3)|0; const el=document.createElement('div'); el.className='crate'; el.style.top='-90px'; el.style.left=(16.666+laneIndex*33.333)+'%'; el.innerHTML=`<div class="type">${type==='HAZARD'?'do not catch':'trend crate'}</div><b>${type==='HAZARD'?'DOOM':type}</b>`; if(type!=='HAZARD'){ el.style.boxShadow=`0 16px 30px rgba(0,0,0,.22),0 0 0 1px ${laneColors[laneIndex]}55`; } arena.appendChild(el); crates.push({el,type,lane:laneIndex,y:-90,speed:230+Math.random()*120});}
function addDust(x,y,col){for(let i=0;i<14;i++)dust.push({x,y,vx:(Math.random()-.5)*3,vy:Math.random()*-3-1,life:34,col});}
function hitGood(name){combo++; const gain=90+combo*12; state.score+=gain; if(combo>=4)document.getElementById('b1').classList.add('on'); if(state.lives===3&&state.score>=800)document.getElementById('b2').classList.add('on'); if(state.score>=1800){ win(); return; } if(state.score//1>0 && Math.floor(state.score/450)>medalsCount){medalsCount=Math.floor(state.score/450); } setFeedback('Captured '+name+' +'+gain+' | combo x'+combo);}
function hitBad(text){state.lives--; combo=0; setFeedback(text); if(state.lives<=0)lose('Your jeep lost all hull integrity.');}
function win(){state.running=false; document.getElementById('b3').classList.add('on'); state.best=Math.max(state.best,state.score); localStorage.signalSafariBest=state.best; renderHud(); overlay.classList.remove('hidden'); els.ovTitle.textContent='Signal King'; els.ovText.textContent='You reached '+state.score+' points and dominated the trend dunes. Strong “one more try” lever: chase a flawless 3-hull win.';}
function lose(text){state.running=false; state.best=Math.max(state.best,state.score); localStorage.signalSafariBest=state.best; renderHud(); overlay.classList.remove('hidden'); els.ovTitle.textContent='Game Over'; els.ovText.textContent=text+' Final score: '+state.score;}
function moveTo(n){if(!state.running||state.paused)return; lane=Math.max(0,Math.min(2,n)); renderHud(); setFeedback('Lane '+laneNames[lane]+' locked.');}
addEventListener('keydown',e=>{if(e.key==='ArrowLeft')moveTo(lane-1); if(e.key==='ArrowRight')moveTo(lane+1); if(e.key==='ArrowDown')moveTo(1)});
arena.addEventListener('pointerdown',e=>{const r=arena.getBoundingClientRect(); const x=e.clientX-r.left; moveTo(x<r.width/3?0:x<r.width*2/3?1:2)});
document.getElementById('playBtn').onclick=start; document.getElementById('startBtn').onclick=start; document.getElementById('pauseBtn').onclick=()=>{if(!state.running)return; state.paused=!state.paused; setFeedback(state.paused?'Paused.':'Back in the dunes.');};
function loop(){if(state.running && !state.paused){ state.spawn-=1/60; if(state.spawn<=0){spawnCrate(); state.spawn=.55-Math.min(.25,state.score/7000);} crates.forEach(c=>{c.y+=c.speed/60; c.el.style.top=c.y+'px'; if(c.y>arena.clientHeight-110 && !c.hit && c.y<arena.clientHeight-40 && c.lane===lane){ c.hit=True; } }); for(const c of crates){ const close=c.y>arena.clientHeight-130 && c.y<arena.clientHeight-40 && c.lane===lane; if(close && !c.done){ c.done=true; addDust(parseFloat(c.el.style.left)/100*arena.clientWidth,arena.clientHeight-70,c.type==='HAZARD'?'#ff7285':laneColors[c.lane]); if(c.type==='HAZARD')hitBad('Hazard crate! Hull damaged.'); else if(c.type===laneNames[lane])hitGood(c.type); else hitBad('Wrong lane catch. Combo broken.'); c.el.remove(); } else if(c.y>arena.clientHeight+10 && !c.done){ c.done=true; combo=0; if(c.type!=='HAZARD')setFeedback(c.type+' escaped.'); c.el.remove(); } }
 crates=crates.filter(c=>!c.done); }
 dust=dust.filter(d=>--d.life>0); document.querySelectorAll('.dust').forEach(n=>n.remove()); for(const d of dust){ d.x+=d.vx; d.y+=d.vy; d.vy+=.08; const el=document.createElement('div'); el.className='dust'; el.style.left=d.x+'px'; el.style.top=d.y+'px'; el.style.background=d.col; arena.appendChild(el); }
 renderHud(); requestAnimationFrame(loop);} renderHud(); requestAnimationFrame(loop);
</script>
</body>
</html>''').replace('True','true'),
        "report": dedent(r'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Signal Safari - Report</title><style>body{margin:0;font-family:Inter,Segoe UI,Arial,sans-serif;background:#0b1020;color:#eaf1ff;padding:24px;line-height:1.65}main{max-width:980px;margin:auto;background:#121a31;border:1px solid #33456d;border-radius:24px;padding:28px}h2{color:#9fd0ff}</style></head><body><main><h1>Signal Safari — Strategy Report</h1><p>Date: 2026-04-24 · Folder: <code>2026-04-24-signal-safari</code></p><p><b>Trend signal used:</b> social platforms are still trending up while word and connections-style puzzle interest remains dominant in ranking snapshots. This concept turns those buckets into a kinetic lane-capture arcade loop.</p><h2>Core loop</h2><p>Move between three lanes and catch matching trend crates while dodging doom crates. Players get immediate, physical feedback through lane shifts, impact bursts, combo scoring, and hull loss.</p><h2>Rewards / retention</h2><ul><li>Combo-driven score inflation</li><li>Live badge unlocks for clean performance</li><li>Persistent best score and medal count</li><li>Explicit win at 1800 and fail at 3 hull hits</li></ul><h2>SEO / ASO / SEM</h2><ul><li>arcade lane switch browser game</li><li>trend catcher game</li><li>reflex html5 score attack</li><li>one more try arcade web game</li></ul><h2>KPIs</h2><ul><li>Average combo length</li><li>Crash rate by minute</li><li>Win rate by first three runs</li><li>Replay rate after 1500+ scores</li></ul><h2>Experiments</h2><ul><li>Daily lane modifiers</li><li>Boss caravans with double crates</li><li>Meta-unlocks for jeep skins</li></ul><h2>Risks</h2><ul><li>Needs extra stage variety in production</li><li>Collision timing must stay fair on lower-end phones</li></ul></main></body></html>''')
    },
    f"{date}-gossip-garden": {
        "title": "Gossip Garden",
        "index": dedent(r'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Gossip Garden</title>
<style>
:root{--bg:#081412;--panel:rgba(11,28,24,.84);--ink:#ecfff9;--muted:#a7d3c8;--mint:#7dffcb;--cyan:#8de7ff;--pink:#ffa3d1;--gold:#ffd166;--bad:#ff6b7e;--line:rgba(125,255,203,.16)}*{box-sizing:border-box}body{margin:0;font-family:Inter,Segoe UI,Arial,sans-serif;background:radial-gradient(circle at top,#123b34,#07110f 60%);color:var(--ink)}#app{max-width:1420px;margin:auto;padding:16px;display:grid;grid-template-columns:330px 1fr;gap:16px}.panel{background:var(--panel);border:1px solid var(--line);border-radius:24px;backdrop-filter:blur(12px);box-shadow:0 22px 70px rgba(0,0,0,.28)}aside{padding:18px}.tag{display:inline-block;padding:7px 11px;border-radius:999px;background:rgba(125,255,203,.12);color:var(--mint);font-size:12px;letter-spacing:.08em;text-transform:uppercase}h1{margin:10px 0 8px;font-size:34px;line-height:.95}.lede,.help,.small{color:var(--muted);font-size:14px;line-height:1.5}.stats{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:16px 0}.stat{padding:12px;border-radius:18px;background:rgba(255,255,255,.04)}.stat b{display:block;font-size:24px;margin-top:4px}button{border:0;border-radius:14px;padding:12px 16px;font-weight:800;cursor:pointer;background:linear-gradient(135deg,var(--mint),#d0fff1);color:#07140f}button.secondary{background:rgba(255,255,255,.08);color:var(--ink)}.badges{margin-top:12px;padding:12px;border-radius:18px;background:rgba(255,255,255,.04);font-size:13px}.badges .on{color:var(--gold)}main{padding:14px;position:relative}.banner{padding:12px 16px;border-radius:16px;background:linear-gradient(90deg,rgba(125,255,203,.18),rgba(141,231,255,.14));font-size:14px}.feedback{position:absolute;right:24px;top:24px;padding:10px 14px;border-radius:14px;background:rgba(7,18,15,.82);color:var(--gold);font-weight:800;z-index:3}.play{margin-top:14px;display:grid;grid-template-columns:1fr 300px;gap:14px}.garden{padding:14px;border-radius:22px;background:rgba(255,255,255,.03)}#nodes{display:grid;grid-template-columns:repeat(4,minmax(78px,1fr));gap:14px}.node{aspect-ratio:1/1;border-radius:22px;background:linear-gradient(180deg,#204940,#10271f);border:1px solid rgba(255,255,255,.08);position:relative;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:4px;cursor:pointer;box-shadow:0 14px 26px rgba(0,0,0,.18)}.node .icon{font-size:28px}.node .name{font-size:13px;font-weight:700}.node.seeded{box-shadow:0 0 0 2px rgba(125,255,203,.18),0 16px 28px rgba(0,0,0,.22)}.node.safe{background:linear-gradient(180deg,#23504b,#133430)}.node.trending{background:linear-gradient(180deg,#5b2d4d,#2a1733)}.node.dead{opacity:.45;filter:grayscale(.5)}.node.selected{transform:translateY(-4px);border-color:var(--mint)}.node small{font-size:11px;color:var(--muted)}.side{padding:14px;border-radius:22px;background:rgba(255,255,255,.03)}.objective{padding:12px;border-radius:16px;background:rgba(255,255,255,.04);margin-bottom:12px}.meter{height:10px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden;margin-top:8px}.meter span{display:block;height:100%;background:linear-gradient(90deg,var(--mint),var(--gold))}.legend{display:grid;gap:8px;font-size:13px;color:var(--muted)}.overlay{position:absolute;inset:0;background:rgba(4,10,8,.6);display:flex;align-items:center;justify-content:center}.overlay.hidden{display:none}.card{width:min(560px,92%);padding:28px;text-align:center}.card h2{margin:0 0 8px;font-size:38px}.card p{color:var(--muted);line-height:1.55}.cta{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px}
@media(max-width:980px){#app{grid-template-columns:1fr}.play{grid-template-columns:1fr}#nodes{grid-template-columns:repeat(3,minmax(70px,1fr))}.feedback{position:static;margin-top:12px}}
</style>
</head>
<body>
<div id="app">
<aside class="panel">
<span class="tag">network strategy / spread control</span>
<h1>Gossip Garden</h1>
<p class="lede">Plant hype seeds into a social garden. Each turn you choose which node to boost. Trendy nodes spread to neighbors, but overgrowth causes burnout. Reach <b>28 bloom points</b> before the garden rots.</p>
<div class="stats"><div class="stat">Bloom<b id="score">0</b></div><div class="stat">Best<b id="best">0</b></div><div class="stat">Turns<b id="turns">10</b></div><div class="stat">Rot<b id="rot">0 / 6</b></div></div>
<div><button id="startBtn">Plant run</button> <button class="secondary" id="harvestBtn">Harvest turn</button></div>
<div class="help" style="margin-top:14px"><b>How to play:</b> tap a node to plant hype, then harvest the turn. Safe nodes spread gently. Trendy nodes explode faster, but if a node goes above 3 hype it burns out and adds rot.</div>
<div class="badges">Badges:<br><span id="b1">• Gentle Gardener</span><br><span id="b2">• Viral Architect</span><br><span id="b3">• Bloom Baron</span></div>
<p class="small" style="margin-top:14px">Original “spread with burnout” loop inspired by live social-platform trend signals, built for tactical replay and near-miss drama.</p>
</aside>
<main class="panel">
<div class="banner"><b>Goal:</b> create spreading hype without burning the network. Win at 28 bloom. Lose at 6 rot or 0 turns remaining below target.</div>
<div class="feedback" id="feedback">Garden asleep. Pick your first seed.</div>
<div class="play">
  <div class="garden"><div id="nodes"></div></div>
  <div class="side">
    <div class="objective"><b>Why it hooks</b><div class="small">Every turn is a tiny gamble: push a viral node for explosive score, or stabilize the grid to avoid catastrophic burnout.</div><div class="meter"><span id="goalBar" style="width:0%"></span></div></div>
    <div class="legend"><div>🌿 Safe = steady spread</div><div>🌸 Trendy = double bloom nearby</div><div>💀 Burnout = dead node + rot</div><div>✨ Badge unlocks live during play</div></div>
  </div>
</div>
<div class="overlay" id="overlay"><div class="panel card"><h2 id="ovTitle">Gossip Garden</h2><p id="ovText">Grow a web of hype nodes. Each turn, choose one place to seed, then watch the rumor spread. Too much hype in one node causes burnout — and enough burnout ends the run.</p><div class="cta"><button id="playBtn">Start garden</button></div></div></div>
</main>
</div>
<script>
const defs=[['Cafe','☕','safe',[1,4]],['Stream','📺','trendy',[0,2,5]],['Forum','💬','safe',[1,3,6]],['Studio','🎛️','safe',[2,7]],['Club','🪩','trendy',[0,5,8]],['Feed','📱','safe',[1,4,6,9]],['Arcade','🕹️','trendy',[2,5,7,10]],['Lab','🧪','safe',[3,6,11]],['Market','🛍️','safe',[4,9]],['Stage','🎤','trendy',[5,8,10]],['Plaza','🏙️','safe',[6,9,11]],['Orbit','🛰️','trendy',[7,10]]];
const nodesWrap=document.getElementById('nodes'), overlay=document.getElementById('overlay');
const els={score:score,best:best,turns:turns,rot:rot,goalBar,feedback,ovTitle,ovText};
let state={running:false,score:0,best:+localStorage.gossipGardenBest||0,turns:10,rot:0,selected:null,nodes:[]};
function setFeedback(t){els.feedback.textContent=t}
function makeState(){return defs.map(([name,icon,kind,links],i)=>({id:i,name,icon,kind,links,power:0,dead:false}))}
function render(){nodesWrap.innerHTML=''; for(const n of state.nodes){const el=document.createElement('div'); el.className='node '+(n.dead?'dead':n.kind==='trendy'?'trending':'safe')+(state.selected===n.id?' selected':'')+(n.power>0?' seeded':''); el.innerHTML=`<div class="icon">${n.dead?'💀':n.icon}</div><div class="name">${n.name}</div><small>${n.dead?'burned out':'hype '+n.power}</small>`; el.onclick=()=>{if(!state.running||n.dead)return; state.selected=n.id; render(); setFeedback('Seed ready for '+n.name+'. Harvest to resolve.');}; nodesWrap.appendChild(el);} els.score.textContent=state.score; els.best.textContent=state.best; els.turns.textContent=state.turns; els.rot.textContent=state.rot+' / 6'; els.goalBar.style.width=Math.min(100,state.score/28*100)+'%';}
function start(){state={running:true,score:0,best:+localStorage.gossipGardenBest||0,turns:10,rot:0,selected:null,nodes:makeState()}; ['b1','b2','b3'].forEach(id=>document.getElementById(id).classList.remove('on')); overlay.classList.add('hidden'); render(); setFeedback('Choose a node, then harvest the turn.');}
function win(){state.running=false; document.getElementById('b3').classList.add('on'); state.best=Math.max(state.best,state.score); localStorage.gossipGardenBest=state.best; render(); overlay.classList.remove('hidden'); els.ovTitle.textContent='Bloom Baron'; els.ovText.textContent='You reached '+state.score+' bloom with '+(6-state.rot)+' safety left. Excellent “one more try” potential: chase a low-rot perfect garden.';}
function lose(text){state.running=false; state.best=Math.max(state.best,state.score); localStorage.gossipGardenBest=state.best; render(); overlay.classList.remove('hidden'); els.ovTitle.textContent='Game Over'; els.ovText.textContent=text+' Final bloom: '+state.score;}
function overflow(node){if(node.power>3&&!node.dead){node.dead=true; node.power=0; state.rot++; setFeedback(node.name+' burned out! Rot +1.');}}
function harvest(){if(!state.running)return; if(state.selected==null){setFeedback('Pick a node first.'); return;} const chosen=state.nodes[state.selected]; if(chosen.dead){setFeedback('That node is dead.'); return;} chosen.power+=1; state.score+=chosen.kind==='trendy'?2:1; for(const idx of chosen.links){ const n=state.nodes[idx]; if(n.dead)continue; n.power+=chosen.kind==='trendy'?1:0.5; state.score+=n.kind==='trendy'?1:0.5; } for(const n of state.nodes){ if(n.dead)continue; if(n.power>=1&&n.kind==='trendy'){ for(const idx of n.links.slice(0,2)){ const m=state.nodes[idx]; if(!m.dead){ m.power+=0.5; state.score+=0.5; } } } overflow(n); }
 state.turns--; if(state.score>=16)document.getElementById('b2').classList.add('on'); if(state.rot===0&&state.turns<=6)document.getElementById('b1').classList.add('on'); state.score=Math.round(state.score*10)/10; state.selected=null; render(); if(state.score>=28)return win(); if(state.rot>=6)return lose('The network rotted beyond repair.'); if(state.turns<=0)return lose('You ran out of turns before hitting the bloom goal.'); setFeedback('Spread resolved. Plan the next seed.');}
document.getElementById('playBtn').onclick=start; document.getElementById('startBtn').onclick=start; document.getElementById('harvestBtn').onclick=harvest; render();
</script>
</body>
</html>'''),
        "report": dedent(r'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Gossip Garden - Report</title><style>body{margin:0;font-family:Inter,Segoe UI,Arial,sans-serif;background:#0b1020;color:#eaf1ff;padding:24px;line-height:1.65}main{max-width:980px;margin:auto;background:#121a31;border:1px solid #33456d;border-radius:24px;padding:28px}h2{color:#9fd0ff}</style></head><body><main><h1>Gossip Garden — Strategy Report</h1><p>Date: 2026-04-24 · Folder: <code>2026-04-24-gossip-garden</code></p><p><b>Trend signal used:</b> social/X-Reddit-TikTok heat remains up while discovery mechanics continue to dominate. This prototype leans into network propagation instead of matching or spelling: the player manages hype spread and burnout risk.</p><h2>Core loop</h2><p>Select one node to seed, resolve the spread, then react to the new board state. Trendy nodes create bigger cascades but increase burnout risk, generating strong push-your-luck tension.</p><h2>Rewards / retention</h2><ul><li>Visible network growth and bloom-point accumulation</li><li>Badges for low-rot and high-growth play</li><li>Persistent best score</li><li>Explicit win at 28 bloom and fail via rot cap or turn exhaustion</li></ul><h2>SEO / ASO / SEM</h2><ul><li>viral spread strategy browser game</li><li>network puzzle html5 game</li><li>social graph tactics game</li><li>one more turn web game</li></ul><h2>KPIs</h2><ul><li>Average turns survived</li><li>Rot generated per run</li><li>Most common winning opening node</li><li>Replay rate after 24+ bloom near-misses</li></ul><h2>Experiments</h2><ul><li>Daily node maps with seasonal events</li><li>Special influencer nodes</li><li>Meta progression via garden cosmetics</li></ul><h2>Risks</h2><ul><li>Need more scenarios and balancing depth over time</li><li>Numeric spread rules should stay readable for casual players</li></ul></main></body></html>''')
    }
}

for slug, payload in games.items():
    d = root / slug
    d.mkdir(parents=True, exist_ok=True)
    (d / 'index.html').write_text(payload['index'], encoding='utf-8')
    (d / 'report.html').write_text(payload['report'], encoding='utf-8')

cards = []
for d in sorted([p for p in root.iterdir() if p.is_dir()], key=lambda p: p.name, reverse=True):
    if not (d / 'index.html').exists():
        continue
    name = d.name
    date_part = name[:10] if len(name) >= 10 and name[4] == '-' and name[7] == '-' else 'Undated'
    title_bits = name[11:] if date_part != 'Undated' else name
    title = ' '.join(bit.capitalize() for bit in title_bits.replace('_','-').split('-') if bit)
    report_link = f" &middot; <a href='./{name}/report.html'>Read report</a>" if (d / 'report.html').exists() else ''
    cards.append(f"<article class='card' data-date='{date_part}' data-name='{title}'><div class='date'>{date_part}</div><h3>{title}</h3><p><code>{name}</code></p><div class='links'><a href='./{name}/index.html'>Play prototype</a>{report_link}</div></article>")

index_html = f"""<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Prototype Catalog</title><style>body{{font-family:Inter,Segoe UI,Arial,sans-serif;background:#0b1020;color:#ecf2ff;margin:0;padding:22px}}h1{{margin:0 0 6px}}.muted{{color:#9db0d9}}.top{{margin-bottom:18px}}.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;margin-top:18px}}.card{{background:#131c36;border:1px solid #314774;border-radius:14px;padding:14px}}.card:hover{{border-color:#5d7cc0;transform:translateY(-2px)}}.date{{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#8fa4d5}}.card h3{{margin:8px 0 8px;font-size:18px}}.card p{{color:#c7d3f1;font-size:13px;line-height:1.4;margin:10px 0;word-break:break-word}}a{{color:#8bc3ff;text-decoration:none;font-weight:600}}.links{{font-size:14px}}.toolbar{{display:flex;gap:12px;flex-wrap:wrap;align-items:center}}.search,.select{{padding:10px 12px;border-radius:10px;border:1px solid #314774;background:#131c36;color:#ecf2ff;min-width:220px}}.pill{{font-size:12px;color:#9db0d9;background:#131c36;border:1px solid #314774;border-radius:999px;padding:8px 12px}}code{{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px}}</style></head><body><div class='top'><h1>Prototype Catalog</h1><p class='muted'>Auto-generated from top-level prototype folders that contain an <code>index.html</code>. Updated through {date}.</p><div class='toolbar'><input id='search' class='search' placeholder='Search prototypes...'><select id='sortBy' class='select'><option value='date-desc'>Sort: newest first</option><option value='date-asc'>Sort: oldest first</option><option value='name-asc'>Sort: name A-Z</option></select><span class='pill'>Total: {len(cards)} prototypes</span></div></div><div id='grid' class='grid'>{''.join(cards)}</div><script>const search=document.getElementById('search'),sortBy=document.getElementById('sortBy'),grid=document.getElementById('grid');let cards=[...grid.children];function apply(){{const term=search.value.toLowerCase();cards.forEach(card=>{{const ok=card.dataset.name.toLowerCase().includes(term)||card.innerText.toLowerCase().includes(term);card.style.display=ok?'block':'none'}});const visible=cards.filter(c=>c.style.display!=='none');visible.sort((a,b)=>{{if(sortBy.value==='date-asc') return a.dataset.date.localeCompare(b.dataset.date)||a.dataset.name.localeCompare(b.dataset.name); if(sortBy.value==='name-asc') return a.dataset.name.localeCompare(b.dataset.name); return b.dataset.date.localeCompare(a.dataset.date)||a.dataset.name.localeCompare(b.dataset.name)}});visible.forEach(v=>grid.appendChild(v))}}search.oninput=apply;sortBy.onchange=apply;apply();</script></body></html>"""
(root / 'index.html').write_text(index_html, encoding='utf-8')
print('built', len(games), 'games')
