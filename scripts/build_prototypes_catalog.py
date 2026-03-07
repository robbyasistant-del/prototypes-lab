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
"<p class='muted'>Fichas por fecha con enlace a juego y reporte. Puedes puntuar cada prototipo de 1 a 4 estrellas (guardado local en este navegador).</p>",
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

  function paint(card){
    const key = card.dataset.key;
    const v = Number(ratings[key] || 0);
    card.querySelectorAll('.star').forEach(st => {
      const sv = Number(st.dataset.v);
      st.classList.toggle('active', sv <= v);
    });
  }

  document.querySelectorAll('.rating').forEach(card => {
    paint(card);
    card.querySelectorAll('.star').forEach(st => {
      st.addEventListener('click', () => {
        const key = card.dataset.key;
        ratings[key] = Number(st.dataset.v);
        localStorage.setItem(KEY, JSON.stringify(ratings));
        paint(card);
      });
    });
  });
})();
</script>
""")
html.append("</body></html>")

(root / "index.html").write_text("\n".join(html), encoding='utf-8')
print(f"ok: {len(cards)} cards")