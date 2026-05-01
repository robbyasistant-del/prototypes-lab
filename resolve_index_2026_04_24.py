from pathlib import Path
import subprocess

root = Path(r"C:\Users\robby\.openclaw\workspace\Product_prototypes_html")
base = subprocess.check_output(["git", "show", "HEAD:index.html"], cwd=root).decode("utf-8", errors="replace")
base = base.replace("Includes the latest entries through 2026-04-23.", "Includes the latest entries through 2026-04-24.")
base = base.replace("<option value='2026-04-23'>2026-04-23</option>", "<option value='2026-04-24'>2026-04-24</option>\n      <option value='2026-04-23'>2026-04-23</option>")
base = base.replace("<span class='pill'>Total: 147 prototypes</span>", "<span class='pill'>Total: 150 prototypes</span>")
insert = """
<article class='card' data-date='2026-04-24' data-name='Threadline Temple'><div class='date'>2026-04-24</div><h3>Threadline Temple</h3><p><code>2026-04-24-threadline-temple</code></p><div class='rating' data-key='2026-04-24-threadline-temple'><span class='rlabel'>Rate:</span><button class='star' data-v='1'>&#9733;</button><button class='star' data-v='2'>&#9733;</button><button class='star' data-v='3'>&#9733;</button><button class='star' data-v='4'>&#9733;</button></div><div class='links'><a href='./2026-04-24-threadline-temple/index.html'>Play prototype</a> &middot; <a href='./2026-04-24-threadline-temple/report.html'>Read report</a></div></article>
<article class='card' data-date='2026-04-24' data-name='Signal Safari'><div class='date'>2026-04-24</div><h3>Signal Safari</h3><p><code>2026-04-24-signal-safari</code></p><div class='rating' data-key='2026-04-24-signal-safari'><span class='rlabel'>Rate:</span><button class='star' data-v='1'>&#9733;</button><button class='star' data-v='2'>&#9733;</button><button class='star' data-v='3'>&#9733;</button><button class='star' data-v='4'>&#9733;</button></div><div class='links'><a href='./2026-04-24-signal-safari/index.html'>Play prototype</a> &middot; <a href='./2026-04-24-signal-safari/report.html'>Read report</a></div></article>
<article class='card' data-date='2026-04-24' data-name='Gossip Garden'><div class='date'>2026-04-24</div><h3>Gossip Garden</h3><p><code>2026-04-24-gossip-garden</code></p><div class='rating' data-key='2026-04-24-gossip-garden'><span class='rlabel'>Rate:</span><button class='star' data-v='1'>&#9733;</button><button class='star' data-v='2'>&#9733;</button><button class='star' data-v='3'>&#9733;</button><button class='star' data-v='4'>&#9733;</button></div><div class='links'><a href='./2026-04-24-gossip-garden/index.html'>Play prototype</a> &middot; <a href='./2026-04-24-gossip-garden/report.html'>Read report</a></div></article>
""".strip()
base = base.replace("<div id='grid' class='grid'>", "<div id='grid' class='grid'>\n" + insert + "\n", 1)
(root / 'index.html').write_text(base, encoding='utf-8')
print('resolved')
