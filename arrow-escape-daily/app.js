const SIZE = 5;
const DIRS = ['U', 'R', 'D', 'L'];
const ARROW = { U:'↑', R:'→', D:'↓', L:'←' };
const VECTORS = { U:[-1,0], R:[0,1], D:[1,0], L:[0,-1] };
const FIXED_ALWAYS = 3;
const TARGET_SOLVE_MOVES = 8;

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

let state = {
  grid:[],
  solution:[],
  moves:0,
  time:60,
  timer:null,
  dayKey:'',
  solved:false,
  start:0,
  end:24,
  fixed:new Set(),
  diff:'easy',
};

function hashSeed(str){
  let h=2166136261;
  for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); }
  return h>>>0;
}
function rand(seed){ return ()=> (seed = (seed * 1664525 + 1013904223) >>> 0) / 2**32; }
function idx(r,c){ return r*SIZE+c; }
function rc(i){ return [Math.floor(i/SIZE), i%SIZE]; }
function inBounds(r,c){ return r>=0 && c>=0 && r<SIZE && c<SIZE; }

function borderCells(){
  const out=[];
  for(let i=0;i<SIZE*SIZE;i++){
    const [r,c]=rc(i);
    if(r===0 || c===0 || r===SIZE-1 || c===SIZE-1) out.push(i);
  }
  return out;
}

function neighbors(i){
  const [r,c]=rc(i);
  const out=[];
  for(const d of DIRS){
    const [dr,dc]=VECTORS[d];
    const nr=r+dr,nc=c+dc;
    if(inBounds(nr,nc)) out.push(idx(nr,nc));
  }
  return out;
}

function dirFromTo(a,b){
  const [ar,ac]=rc(a), [br,bc]=rc(b);
  if(br===ar-1 && bc===ac) return 'U';
  if(br===ar+1 && bc===ac) return 'D';
  if(br===ar && bc===ac+1) return 'R';
  if(br===ar && bc===ac-1) return 'L';
  return null;
}

function pickStartEnd(rng){
  const borders = borderCells();
  for(let tries=0; tries<200; tries++){
    const s = borders[Math.floor(rng()*borders.length)];
    const e = borders[Math.floor(rng()*borders.length)];
    if(s===e) continue;
    const [sr,sc]=rc(s), [er,ec]=rc(e);
    const dist = Math.abs(sr-er)+Math.abs(sc-ec);
    if(dist>=4) return {start:s,end:e};
  }
  return {start:idx(0,0), end:idx(SIZE-1,SIZE-1)};
}

function buildPath(rng, start, end, minLen){
  const maxLen = 14;
  const targetLen = Math.min(maxLen, Math.max(minLen+1, 10 + Math.floor(rng()*3)));

  function dfs(cur, path, used){
    if(path.length > targetLen) return null;
    const manhattan = (()=>{ const [r1,c1]=rc(cur), [r2,c2]=rc(end); return Math.abs(r1-r2)+Math.abs(c1-c2); })();
    const remain = targetLen - path.length;
    if(manhattan > remain) return null;

    if(cur===end && path.length>=minLen+1){
      return path;
    }

    const cand = neighbors(cur).filter(n=>!used.has(n));
    // Shuffle deterministic
    for(let i=cand.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); [cand[i],cand[j]]=[cand[j],cand[i]]; }

    for(const n of cand){
      used.add(n);
      path.push(n);
      const got = dfs(n, path, used);
      if(got) return got;
      path.pop();
      used.delete(n);
    }
    return null;
  }

  const init=[start];
  const used=new Set(init);
  return dfs(start, init, used);
}

function cwDistance(from, to){
  const a=DIRS.indexOf(from), b=DIRS.indexOf(to);
  return (b-a+4)%4;
}

// Dijkstra over cells minimizing total clockwise rotations. On ties (same cost),
// prefer paths that traverse more fixed cells.
function solveDetails(grid, start, end, fixed){
  const N = SIZE*SIZE;
  const dist = Array(N).fill(Infinity);
  const fixedSeen = Array(N).fill(-1);
  const used = Array(N).fill(false);
  const parent = Array(N).fill(-1);

  dist[start] = 0;
  fixedSeen[start] = fixed.has(start) ? 1 : 0;

  function edgesFrom(i){
    const [r,c] = rc(i);
    const out = [];

    const nonRot = (i===start || i===end || fixed.has(i));
    if(nonRot){
      const d = grid[i];
      const [dr,dc] = VECTORS[d];
      const nr=r+dr, nc=c+dc;
      if(inBounds(nr,nc)) out.push({to:idx(nr,nc), w:0});
      return out;
    }

    for(const d of DIRS){
      const [dr,dc] = VECTORS[d];
      const nr=r+dr, nc=c+dc;
      if(!inBounds(nr,nc)) continue;
      out.push({to:idx(nr,nc), w:cwDistance(grid[i], d)});
    }
    return out;
  }

  for(let it=0; it<N; it++){
    let u=-1, best=Infinity, bestFixed=-1;
    for(let i=0;i<N;i++){
      if(used[i]) continue;
      if(dist[i] < best || (dist[i]===best && fixedSeen[i] > bestFixed)){
        best = dist[i]; bestFixed = fixedSeen[i]; u=i;
      }
    }
    if(u===-1 || !Number.isFinite(dist[u])) break;
    if(u===end) break;
    used[u]=true;

    for(const e of edgesFrom(u)){
      if(e.to===start) continue; // avoid parent cycles back into start
      const nc = dist[u] + e.w;
      const nf = fixedSeen[u] + (fixed.has(e.to) ? 1 : 0);
      if(nc < dist[e.to] || (nc===dist[e.to] && nf > fixedSeen[e.to])){
        dist[e.to] = nc;
        fixedSeen[e.to] = nf;
        parent[e.to] = u;
      }
    }
  }

  if(!Number.isFinite(dist[end])) return {cost:Infinity, path:[], touchesFixed:false};

  const path=[];
  const seen = new Set();
  for(let cur=end; cur!==-1; cur=parent[cur]){
    if(seen.has(cur)) break; // safety against accidental parent loops
    seen.add(cur);
    path.push(cur);
  }
  path.reverse();
  const touchesFixed = path.some(i => fixed.has(i));
  return {cost:dist[end], path, touchesFixed};
}

function buildDaily(){
  const day = new Date().toISOString().slice(0,10);
  state.dayKey = day;
  state.diff = diffEl.value;
  daySeedEl.textContent = `${day} • ${state.diff}`;

  const rng = rand(hashSeed(`${day}:${state.diff}:v3`));

  let built = false;
  const maxAttempts = 1200;
  for(let attempt=0; attempt<maxAttempts && !built; attempt++){
    const {start,end} = pickStartEnd(rng);

    // Exactly 3 fixed cells, excluding S/E.
    const fixed = new Set();
    const candidates = Array.from({length: SIZE*SIZE}, (_,i)=>i).filter(i => i!==start && i!==end);
    while(fixed.size < Math.min(FIXED_ALWAYS, candidates.length)){
      const k = Math.floor(rng()*candidates.length);
      fixed.add(candidates.splice(k,1)[0]);
    }

    // Random board
    const grid = Array.from({length: SIZE*SIZE}, ()=>DIRS[Math.floor(rng()*4)]);

    // Border safety: S cannot point outside.
    const [sr,sc]=rc(start);
    const validStartDirs = DIRS.filter(d=>{ const [dr,dc]=VECTORS[d]; return inBounds(sr+dr, sc+dc); });
    grid[start] = validStartDirs[Math.floor(rng()*validStartDirs.length)];

    // Fixed cells keep their generated direction (non-rotatable).

    const solved = solveDetails(grid, start, end, fixed);
    if(!Number.isFinite(solved.cost)) continue;
    if(solved.cost !== TARGET_SOLVE_MOVES) continue;
    if(!solved.touchesFixed) continue;

    state.start = start;
    state.end = end;
    state.fixed = fixed;
    state.solution = [];
    state.grid = grid;
    built = true;
  }

  if(!built){
    // resilient fallback: always render playable board immediately
    const {start,end} = pickStartEnd(rng);
    const fixed = new Set();
    const candidates = Array.from({length: SIZE*SIZE}, (_,i)=>i).filter(i => i!==start && i!==end);
    while(fixed.size < Math.min(FIXED_ALWAYS, candidates.length)){
      const k = Math.floor(rng()*candidates.length);
      fixed.add(candidates.splice(k,1)[0]);
    }
    const grid = Array.from({length: SIZE*SIZE}, ()=>DIRS[Math.floor(rng()*4)]);
    const [sr,sc]=rc(start);
    const validStartDirs = DIRS.filter(d=>{ const [dr,dc]=VECTORS[d]; return inBounds(sr+dr, sc+dc); });
    grid[start] = validStartDirs[Math.floor(rng()*validStartDirs.length)];

    state.start = start;
    state.end = end;
    state.fixed = fixed;
    state.solution = [];
    state.grid = grid;
  }
}

function currentStreak(){ return Number(localStorage.getItem('aes_streak')||0); }
function streakMultiplier(streak){ return 1 + 0.1*streak; }

function draw(){
  gridEl.innerHTML = '';
  state.grid.forEach((d,cellIdx)=>{
    const div = document.createElement('button');
    let cls = 'cell';
    if(cellIdx===state.start) cls += ' start';
    if(cellIdx===state.end) cls += ' end';
    if(state.fixed.has(cellIdx)) cls += ' fixed';
    div.className = cls;
    const symbol = ARROW[d] || d;
    div.textContent = cellIdx===state.start ? `S ${symbol}` : cellIdx===state.end ? 'E' : symbol;
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
  const next = DIRS[(DIRS.indexOf(cur)+1)%4];
  state.grid[cellIdx] = next;
  state.moves++;
  draw();
  if(checkSolved()) finish(true);
}

function checkSolved(){
  let [r,c] = rc(state.start);
  const [er,ec] = rc(state.end);
  let steps=0;
  while(steps<80){
    if(r===er && c===ec) return true;
    const i = idx(r,c);
    const dir = state.grid[i];
    const v = VECTORS[dir];
    if(!v) return false;
    r += v[0]; c += v[1]; steps++;
    if(!inBounds(r,c)) return false;
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
  shareCard.textContent = `Arrow Escape Daily\nDate: ${today}\nDifficulty: ${state.diff}\nResult: ${win?'WIN':'LOSE'}\nRaw score: ${raw}\nStreak mult: x${streakMult.toFixed(1)}\nDifficulty mult: x${diffMult.toFixed(2)}\nFinal score: ${score}\nMoves: ${state.moves}\nTime left: ${Math.max(0,state.time)}s\nStreak: ${streak}`;
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
