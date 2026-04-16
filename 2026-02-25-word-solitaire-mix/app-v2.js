const VOWELS=new Set(['A','E','I','O','U']);
const COMMON=new Set(['N','R','S','T','L']);
const MID=new Set(['D','G','M','B','C','P']);
const HARD=new Set(['F','H','V','W','Y']);
const RARE=new Set(['K','J','X','Q','Z']);
const AL='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const day=new Date().toISOString().slice(0,10);
let seed=[...day].reduce((a,c)=>a*31+c.charCodeAt(0),17)>>>0;
const rnd=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);

let hand=[]; let canDiscard=true; let totalScore=0; let round=1;
const el={hand:document.getElementById('hand'),msg:document.getElementById('msg'),report:document.getElementById('report')};

function letterPoints(c){
  if(VOWELS.has(c)) return 1;
  if(COMMON.has(c)) return 2;
  if(MID.has(c)) return 3;
  if(HARD.has(c)) return 4;
  if(RARE.has(c)) return 5;
  return 2;
}
function drawLetter(){
  const bag='EEEEEEEEAAAAAAIIIIIOOOOONNNNRRRRSSSSTTTTLLLLDDDDGGGGBBCCPPFFHHVVWWYYKJXQZ';
  return bag[Math.floor(rnd()*bag.length)];
}
function newHand(){hand=Array.from({length:7},()=>drawLetter());canDiscard=true;updateUI();}
function updateUI(){
  el.hand.innerHTML='';
  hand.forEach((c,i)=>{const d=document.createElement('div');d.className='tile';d.innerHTML=`<div>#${i+1}</div><div class='ltr'>${c}</div><div class='pts'>${letterPoints(c)} pts</div>`;el.hand.appendChild(d);});
  document.getElementById('round').textContent=round;
  document.getElementById('discardState').textContent=canDiscard?'Disponible':'Usado';
  document.getElementById('best').textContent=localStorage.getItem('wsm2_best')||0;
  document.getElementById('streak').textContent=localStorage.getItem('wsm2_streak')||0;
}
function canBuild(word,source){const freq={}; for(const c of source)freq[c]=(freq[c]||0)+1; for(const c of word){if(!freq[c])return false; freq[c]--;} return true;}
function multFromUsage(count){ if(count>=3)return 2; if(count===2)return 1.5; return 1; }
function scoreWords(){
  const words=['w1','w2','w3'].map(id=>document.getElementById(id).value.trim().toUpperCase());
  if(words.some(w=>w.length!==5)) return {ok:false,error:'Cada palabra debe tener 5 letras'};
  if(words.some(w=>!/^[A-Z]{5}$/.test(w))) return {ok:false,error:'Solo letras A-Z'};
  if(words.some(w=>!canBuild(w,hand))) return {ok:false,error:'Alguna palabra usa letras fuera de tu mano de 7'};

  const usage={}; words.forEach(w=>[...w].forEach(c=>usage[c]=(usage[c]||0)+1));
  let base=0, bonus=0;
  for(const w of words){for(const c of w){base += letterPoints(c); const m=multFromUsage(usage[c]); bonus += letterPoints(c)*(m-1);}}
  const score=Math.round(base+bonus);
  return {ok:true,words,base,bonus:Math.round(bonus*100)/100,score,usage};
}

document.getElementById('discardBtn').onclick=()=>{
  if(!canDiscard){el.msg.textContent='Ya usaste el descarte de esta ronda';return;}
  const idx=Number(document.getElementById('discardIdx').value)-1;
  if(Number.isNaN(idx)||idx<0||idx>=hand.length){el.msg.textContent='Elige posición válida 1-7';return;}
  const old=hand[idx]; hand[idx]=drawLetter(); canDiscard=false; updateUI();
  el.msg.textContent=`Descartaste ${old} -> nueva letra ${hand[idx]}`;
};

document.getElementById('scoreBtn').onclick=()=>{
  const r=scoreWords(); if(!r.ok){el.msg.textContent=r.error;return;}
  totalScore += r.score;
  const best=Math.max(Number(localStorage.getItem('wsm2_best')||0),totalScore); localStorage.setItem('wsm2_best',String(best));
  const todayKey='wsm2_day'; const streakKey='wsm2_streak';
  if(localStorage.getItem(todayKey)!==day){localStorage.setItem(streakKey,String(Number(localStorage.getItem(streakKey)||0)+1)); localStorage.setItem(todayKey,day);} 
  document.getElementById('result').classList.remove('hidden');
  el.report.textContent=`Word-Solitaire Mix v2\nDate: ${day}\nRound: ${round}\nHand: ${hand.join(' ')}\nWords: ${r.words.join(' | ')}\nBase: ${r.base}\nReuse bonus: +${r.bonus}\nRound score: ${r.score}\nTotal score: ${totalScore}`;
  el.msg.textContent='✅ Puntaje calculado'; updateUI();
};

document.getElementById('nextBtn').onclick=()=>{round++; ['w1','w2','w3','discardIdx'].forEach(id=>document.getElementById(id).value=''); newHand(); el.msg.textContent='Nueva ronda lista';};
document.getElementById('copyBtn').onclick=()=>navigator.clipboard.writeText(el.report.textContent);

newHand();