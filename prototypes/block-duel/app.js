const day=new Date().toISOString().slice(0,10);document.getElementById('day').textContent=day;let seed=[...day].reduce((a,c)=>a*33+c.charCodeAt(0),11)>>>0;const rnd=()=>((seed=seed*1664525+1013904223>>>0)/2**32);
let running=false,time=30,score=0,timer=null,mode='normal';
const el={time:timeEl=document.getElementById('time'),score:document.getElementById('score'),ghost:document.getElementById('ghost'),tap:document.getElementById('tap')};
function ghostTarget(){const base=180+Math.floor(rnd()*120);return mode==='daily'?base+30:base;}
let target=ghostTarget();el.ghost.textContent=target;
function load(){document.getElementById('streak').textContent=localStorage.getItem('bd_streak')||0;}
function start(){if(running)return;running=true;time=30;score=0;target=ghostTarget();el.ghost.textContent=target;el.time.textContent=time;el.score.textContent=score;document.getElementById('result').classList.add('hidden');timer=setInterval(()=>{time--;el.time.textContent=time;if(time<=0)finish();},1000);} 
function finish(){running=false;clearInterval(timer);const win=score>=target;const lastDay=localStorage.getItem('bd_day');let streak=Number(localStorage.getItem('bd_streak')||0);if(win&&lastDay!==day){streak++;localStorage.setItem('bd_streak',String(streak));localStorage.setItem('bd_day',day);}if(!win){streak=0;localStorage.setItem('bd_streak','0');}
const title=win?'🏆 WIN':'💥 LOSE';document.getElementById('title').textContent=title;
const txt=`Block Duel\nDate: ${day}\nMode: ${mode}\nYou: ${score}\nGhost: ${target}\nResult: ${win?'WIN':'LOSE'}\nStreak: ${streak}`;document.getElementById('card').textContent=txt;document.getElementById('result').classList.remove('hidden');
const hist=JSON.parse(localStorage.getItem('bd_recent')||'[]');hist.unshift({day,mode,score,target,win});localStorage.setItem('bd_recent',JSON.stringify(hist.slice(0,10)));load();}
el.tap.onclick=()=>{if(!running)return;score += 4 + Math.floor(rnd()*5);el.score.textContent=score;};
document.getElementById('start').onclick=()=>{mode='normal';start();};
document.getElementById('daily').onclick=()=>{mode='daily';start();};
document.getElementById('again').onclick=()=>location.reload();
document.getElementById('copy').onclick=()=>navigator.clipboard.writeText(document.getElementById('card').textContent);
document.getElementById('challenge').onclick=()=>{const t=`I scored ${score} in Block Duel (${mode}) on ${day}. Beat my ghost: ${target}!`;navigator.clipboard.writeText(t);alert('Challenge text copied');};
load();