const SIZE = 5;
const DIRECTIONS = ['↑','→','↓','←'];
const VECTORS = {'↑':[-1,0],'→':[0,1],'↓':[1,0],'←':[0,-1]};
const FIXED_BY_DIFF = { easy:0, medium:3, hard:6 };

const daySeedEl = document.getElementById('daySeed');
const timeEl = document.getElementById('time');
const movesEl = document.getElementById('moves');
const streakEl = document.getElementById('streak');
const multEl = document.getElementById('mult');
const gridEl = document.getElementById('grid');
const resultEl = document.getElementById('result');
const resultTitle = document.getElementById('resultTitle');
const shareCard = document.getElementById('shareCard');
const diffEl = document.getElementById('difficulty');

let state = {grid:[], moves:0, time:60, timer:null, dayKey:'', solved:false, start:0, end:24, fixed:new Set(), diff:'easy'};

function hashSeed(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function rand(seed){return ()=> (seed = (seed * 1664525 + 1013904223) >>> 0) / 2**32;}
function idx(r,c){return r*SIZE+c;}
function rc(i){return [Math.floor(i/SIZE), i%SIZE];}

function pickStartEnd(rng){
  const vertical = rng() < 0.5;
  if(vertical){
    const c = Math.floor(rng()*SIZE);
    const c2 = Math.floor(rng()*SIZE);
    return { start: idx(0,c), end: idx(SIZE-1,c2) };
  }
  const r = Math.floor(rng()*SIZE);
  const r2 = Math.floor(rng()*SIZE);
  return { start: idx(r,0), end: idx(r2,SIZE-1) };
}

function buildDaily(){
  const day = new Date().toISOString().slice(0,10);
  state.dayKey = day;
  state.diff = diffEl.value;
  daySeedEl.textContent = `${day} · ${state.diff}`;

  const rng = rand(hashSeed(`${day}:${state.diff}`));
  state.grid = Array.from({length: SIZE*SIZE}, ()=>DIRECTIONS[Math.floor(rng()*4)]);

  const pos = pickStartEnd(rng);
  state.start = pos.start;
  state.end = pos.end;

  const fixedCount = FIXED_BY_DIFF[state.diff] ?? 0;
  state.fixed = new Set();
  const candidates = Array.from({length: SIZE*SIZE}, (_,i)=>i).filter(i => i!==state.start && i!==state.end);
  while(state.fixed.size < Math.min(fixedCount, candidates.length)){
    const k = Math.floor(rng()*candidates.length);
    state.fixed.add(candidates.splice(k,1)[0]);
  }
}

function currentStreak(){return Number(localStorage.getItem('aes_streak')||0);}
function streakMultiplier(streak){return 1 + 0.1*streak;}

function draw(){
  gridEl.innerHTML = '';
  state.grid.forEach((d,cellIdx)=>{
    const div = document.createElement('button');
    let cls = 'cell';
    if(cellIdx===state.start) cls += ' start';
    if(cellIdx===state.end) cls += ' end';
    if(state.fixed.has(cellIdx)) cls += ' fixed';
    div.className = cls;
    div.textContent = cellIdx===state.start?'S':cellIdx===state.end?'E':d;
    div.onclick = ()=>rotate(cellIdx);
    gridEl.appendChild(div);
  });
  movesEl.textContent = state.moves;
  timeEl.textContent = state.time;
  const st = currentStreak();
  streakEl.textContent = String(st);
  multEl.textContent = `x${streakMultiplier(st).toFixed(1)}`;
}

function rotate(cellIdx){
  if (cellIdx===state.start || cellIdx===state.end || state.solved || state.fixed.has(cellIdx)) return;
  const cur = state.grid[cellIdx];
  const next = DIRECTIONS[(DIRECTIONS.indexOf(cur)+1)%4];
  state.grid[cellIdx] = next;
  state.moves++;
  draw();
  if(checkSolved()) finish(true);
}

function checkSolved(){
  let [r,c] = rc(state.start);
  const [er,ec] = rc(state.end);
  let steps=0;
  while(steps<50){
    if(r===er && c===ec) return true;
    const i = idx(r,c);
    const dir = state.grid[i];
    const [dr,dc] = VECTORS[dir] || [0,0];
    r += dr; c += dc; steps++;
    if(r<0||c<0||r>=SIZE||c>=SIZE) return false;
  }
  return false;
}

function startTimer(){
  clearInterval(state.timer);
  state.timer = setInterval(()=>{
    if(state.solved) return;
    state.time--;
    timeEl.textContent = state.time;
    if(state.time<=0) finish(false);
  },1000);
}

function finish(win){
  state.solved = true;
  clearInterval(state.timer);
  const today = state.dayKey;
  const played = localStorage.getItem('aes_last_day');
  let streak = currentStreak();
  if (win && played !== today){
    streak += 1;
    localStorage.setItem('aes_streak', String(streak));
    localStorage.setItem('aes_last_day', today);
  }
  if (!win) {
    streak = 0;
    localStorage.setItem('aes_streak', '0');
  }

  const raw = Math.max(0, 1000 - state.moves*25 + state.time*8 + (win?200:0));
  const streakMult = streakMultiplier(streak);
  const diffMult = state.diff === 'hard' ? 1.35 : state.diff === 'medium' ? 1.15 : 1.0;
  const score = Math.round(raw * streakMult * diffMult);
  resultTitle.textContent = win ? '✅ Escaped!' : '⏰ Time up';
  shareCard.textContent = `Arrow Escape Daily v2\nDate: ${today}\nDifficulty: ${state.diff}\nResult: ${win?'WIN':'LOSE'}\nRaw score: ${raw}\nStreak mult: x${streakMult.toFixed(1)}\nDifficulty mult: x${diffMult.toFixed(2)}\nFinal score: ${score}\nMoves: ${state.moves}\nTime left: ${Math.max(0,state.time)}s\nStreak: ${streak}`;
  resultEl.classList.remove('hidden');
  draw();
}

function reset(){
  state = {...state, moves:0, time:60, solved:false};
  resultEl.classList.add('hidden');
  buildDaily();
  draw();
  startTimer();
}

document.getElementById('copy').onclick = async ()=>{
  await navigator.clipboard.writeText(shareCard.textContent);
  alert('Share text copied');
};
document.getElementById('next').onclick = reset;
document.getElementById('reset').onclick = reset;
diffEl.onchange = reset;

reset();
