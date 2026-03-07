from pathlib import Path
import re

root = Path(r"C:/Users/robby/.openclaw/workspace/prototypes_html")
folders = [p for p in root.iterdir() if p.is_dir()]

def sort_key(p: Path):
    m = re.match(r"(\d{4}-\d{2}-\d{2})-(.+)", p.name)
    if m:
        return (0, m.group(1), p.name)
    return (1, "", p.name)

folders.sort(key=sort_key, reverse=True)

cards = []
for p in folders:
    m = re.match(r"(\d{4}-\d{2}-\d{2})-(.+)", p.name)
    if m:
        date = m.group(1)
        title = m.group(2).replace('-', ' ').title()
    else:
        date = "legacy"
        title = p.name.replace('-', ' ').title()

    report = p / "report.html"
    desc = "Playable prototype with linked report."
    if report.exists():
        try:
            txt = report.read_text(encoding='utf-8', errors='ignore')
            mdesc = re.search(r"<p>(.*?)</p>", txt, re.S | re.I)
            if mdesc:
                desc = re.sub(r"<[^>]+>", "", mdesc.group(1)).strip()
                desc = " ".join(desc.split())
        except Exception:
            pass

    cards.append((date, title, p.name, desc))

html = [
"<!doctype html>",
"<html lang='es'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>",
"<title>Prototypes Catalog</title>",
"<style>body{font-family:Inter,Segoe UI,Arial;background:#0b1020;color:#ecf2ff;margin:0;padding:22px}h1{margin:0 0 6px}.muted{color:#9db0d9}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:14px;margin-top:18px}.card{background:#131c36;border:1px solid #314774;border-radius:12px;padding:12px}.date{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#8fa4d5}.card h3{margin:6px 0 8px}.card p{color:#c7d3f1;font-size:14px;line-height:1.4;min-height:58px}a{color:#8bc3ff;text-decoration:none;font-weight:600}.rating{margin:8px 0 10px;display:flex;align-items:center;gap:6px}.star{background:none;border:none;cursor:pointer;color:#5b6b91;font-size:20px;line-height:1;padding:0}.star.active{color:#ffd166}.rlabel{font-size:11px;color:#9db0d9}</style></head><body>",
"<h1>Catálogo de Prototipos</h1>",
"<p class='muted'>Fichas por fecha con enlace a juego y reporte. Puedes puntuar cada prototipo de 1 a 4 estrellas. Guardado local + opción de guardado global en <code>ratings.json</code> del repo.</p>",
"<div style='margin:10px 0 6px;display:flex;gap:8px;flex-wrap:wrap;align-items:center'>",
"<button id='saveGlobal' style='background:#1f7a4f;color:#fff;border:1px solid #2aa86b;border-radius:8px;padding:7px 10px;cursor:pointer;font-weight:600'>Guardar rating global</button>",
"<button id='loadGlobal' style='background:#1f2a44;color:#fff;border:1px solid #385083;border-radius:8px;padding:7px 10px;cursor:pointer;font-weight:600'>Recargar rating global</button>",
"<span id='syncMsg' class='rlabel' style='font-size:12px;color:#9db0d9'></span>",
"</div>",
"<div class='grid'>"
]
for date, title, folder, desc in cards:
    html.append(
        f"<article class='card'><div class='date'>{date}</div><h3>{title}</h3><p>{desc}</p>"
        f"<div class='rating' data-key='{folder}'><span class='rlabel'>Rate:</span>"
        f"<button class='star' data-v='1' title='1 estrella'>★</button>"
        f"<button class='star' data-v='2' title='2 estrellas'>★</button>"
        f"<button class='star' data-v='3' title='3 estrellas'>★</button>"
        f"<button class='star' data-v='4' title='4 estrellas'>★</button></div>"
        f"<a href='./{folder}/index.html'>Play prototype</a> · <a href='./{folder}/report.html'>Read report</a></article>"
    )
html.append("</div>")
html.append("""
<script>
(() => {
  const KEY = 'prototypeRatingsV1';
  const ratings = JSON.parse(localStorage.getItem(KEY) || '{}');
  const owner = 'robbyasistant-del';
  const repo = 'prototypes-lab';
  const path = 'prototypes_html/ratings.json';

  function paint(card){
    const key = card.dataset.key;
    const v = Number(ratings[key] || 0);
    card.querySelectorAll('.star').forEach(st => {
      const sv = Number(st.dataset.v);
      st.classList.toggle('active', sv <= v);
    });
  }

  function paintAll(){
    document.querySelectorAll('.rating').forEach(paint);
    localStorage.setItem(KEY, JSON.stringify(ratings));
  }

  async function loadGlobal(){
    try{
      const res = await fetch('./ratings.json?ts='+Date.now());
      if(!res.ok) throw new Error('No ratings.json todavía');
      const j = await res.json();
      Object.assign(ratings, j);
      paintAll();
      msg('Global cargado');
    }catch(e){ msg('No se pudo cargar global: '+e.message, true); }
  }

  function msg(t, err=false){
    const m=document.getElementById('syncMsg');
    m.textContent=t;
    m.style.color = err ? '#fca5a5' : '#9df3bf';
    setTimeout(()=>{ m.textContent=''; m.style.color='#9db0d9'; }, 4500);
  }

  async function saveGlobal(){
    const token = prompt('GitHub PAT (scope repo) para guardar ratings globales:');
    if(!token) return;
    try{
      const api = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
      const getRes = await fetch(api, { headers:{ 'Authorization':'Bearer '+token, 'Accept':'application/vnd.github+json' } });
      let sha = null;
      if(getRes.ok){
        const current = await getRes.json();
        sha = current.sha;
      }
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(ratings, null, 2))));
      const body = { message:'Update prototype ratings', content, branch:'master' };
      if(sha) body.sha = sha;
      const putRes = await fetch(api, {
        method:'PUT',
        headers:{ 'Authorization':'Bearer '+token, 'Accept':'application/vnd.github+json', 'Content-Type':'application/json' },
        body: JSON.stringify(body)
      });
      if(!putRes.ok){
        const t = await putRes.text();
        throw new Error('GitHub error: '+t.slice(0,180));
      }
      msg('Guardado global OK');
    }catch(e){ msg('Error guardando global: '+e.message, true); }
  }

  document.querySelectorAll('.rating').forEach(card => {
    paint(card);
    card.querySelectorAll('.star').forEach(st => {
      st.addEventListener('click', () => {
        const key = card.dataset.key;
        ratings[key] = Number(st.dataset.v);
        paintAll();
      });
    });
  });

  document.getElementById('saveGlobal').addEventListener('click', saveGlobal);
  document.getElementById('loadGlobal').addEventListener('click', loadGlobal);
  loadGlobal();
})();
</script>
""")
html.append("</body></html>")

(root / "index.html").write_text("\n".join(html), encoding='utf-8')
print(f"ok: {len(cards)} cards")