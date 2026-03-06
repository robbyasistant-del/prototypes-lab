const day=new Date().toISOString().slice(0,10);
let seed=[...day].reduce((a,c)=>a*33+c.charCodeAt(0),29)>>>0;
const rnd=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);

const arena=document.getElementById('arena');
const timeEl=document.getElementById('time');
const scoreEl=document.getElementById('score');
const comboEl=document.getElementById('combo');
const ghostEl=document.getElementById('ghost');
const msg=document.getElementById('msg');

let lanes=[],blocks=[],running=false,t=45,score=0,combo=0,mode='normal',tick=null,spawnTick=null,speed=2.2,target=0,overdrive=false,overdriveCd=0;

function setupArena(){arena.innerHTML='';lanes=[];for(let i=0;i<3;i++){const lane=document.createElement('div');lane.className='lane';lane.dataset.i=i;const hit=document.createElement('div');hit.className='hit';lane.appendChild(hit);arena.appendChild(lane);lanes.push(lane);}}
function ghost(){const base=350+Math.floor(rnd()*180);return mode==='daily'?base+70:base;}

function spawn(){if(!running)return;const lane=Math.floor(rnd()*3);const b=document.createElement('div');b.className='block';b.style.top='-50px';b.dataset.l=lane;lanes[lane].appendChild(b);blocks.push({el:b,lane,y:-50,reject:false});}

function update(){
  blocks.forEach(o=>{o.y += speed + (overdrive?1.3:0); o.el.style.top=o.y+'px';});
  blocks = blocks.filter(o=>{if(o.y>340){o.el.remove(); if(!o.reject){combo=0; comboEl.textContent=combo;} return false;} return true;});
  if(overdriveCd>0){overdriveCd-=0.05;if(overdriveCd<=0){overdrive=false;msg.textContent='Overdrive off';}}
}

function judge(lane){
  if(!running)return;
  const candidates=blocks.filter(b=>b.lane===lane);
  if(!candidates.length){reject('No block in lane');return;}
  candidates.sort((a,b)=>Math.abs((a.y+22)-282)-Math.abs((b.y+22)-282));
  const b=candidates[0];
  const center=b.y+22; const dist=Math.abs(center-282); // hit zone center
  if(dist<=26){
    const base=20 + Math.max(0,10-Math.floor(dist/3));
    combo++; const mult=1 + Math.min(1.5, combo*0.08); const od=overdrive?2:1;
    const gain=Math.round(base*mult*od); score += gain;
    scoreEl.textContent=score; comboEl.textContent=combo;
    b.el.remove(); blocks=blocks.filter(x=>x!==b);
    msg.textContent=`Nice +${gain}`;
  } else reject('Bad timing');
}

function reject(reason){
  combo=0; comboEl.textContent=combo; score=Math.max(0,score-18); scoreEl.textContent=score;
  msg.textContent=`REJECT: ${reason} (-18)`;
}

function start(){
  running=true; t=45; score=0; combo=0; speed=2.2; overdrive=false; overdriveCd=0; blocks=[];
  target=ghost(); ghostEl.textContent=target; scoreEl.textContent=0; comboEl.textContent=0; timeEl.textContent=t;
  document.getElementById('result').classList.add('hidden'); msg.textContent='Duel started'; setupArena();
  clearInterval(tick); clearInterval(spawnTick);
  tick=setInterval(()=>{update();},50);
  spawnTick=setInterval(()=>{spawn(); if(rnd()<0.25)spawn();},700);
  const timer=setInterval(()=>{t--; timeEl.textContent=t; if(t<=0){clearInterval(timer);finish();}},1000);
}

function finish(){running=false; clearInterval(tick); clearInterval(spawnTick);
  const win=score>=target; let streak=Number(localStorage.getItem('bd2_streak')||0); const dayk=localStorage.getItem('bd2_day');
  if(win && dayk!==day){streak++; localStorage.setItem('bd2_streak',String(streak)); localStorage.setItem('bd2_day',day);} if(!win){streak=0; localStorage.setItem('bd2_streak','0');}
  document.getElementById('streak').textContent=localStorage.getItem('bd2_streak')||0;
  const title=win?'🏆 WIN - Reactor Master':'💥 LOSE - Rejected'; document.getElementById('title').textContent=title;
  const txt=`Block Duel: Reject Reactor\nDate: ${day}\nMode: ${mode}\nScore: ${score}\nGhost: ${target}\nResult: ${win?'WIN':'LOSE'}\nStreak: ${localStorage.getItem('bd2_streak')||0}`;
  document.getElementById('card').textContent=txt; document.getElementById('result').classList.remove('hidden');
}

document.querySelectorAll('.laneBtns button[data-l]').forEach(btn=>btn.onclick=()=>judge(Number(btn.dataset.l)));
document.getElementById('overdrive').onclick=()=>{if(!running)return; if(overdrive)return; overdrive=true; overdriveCd=5; msg.textContent='Overdrive ON (x2, 5s, más velocidad)';};
document.getElementById('start').onclick=()=>{mode='normal';start();};
document.getElementById('daily').onclick=()=>{mode='daily';start();};
document.getElementById('copyResult').onclick=()=>navigator.clipboard.writeText(document.getElementById('card').textContent);
document.getElementById('copyChallenge').onclick=()=>{const t=`I scored ${score} in Block Duel: Reject Reactor. Beat my ghost ${target}!`;navigator.clipboard.writeText(t); alert('Challenge copied');};

document.getElementById('streak').textContent=localStorage.getItem('bd2_streak')||0;
setupArena();
