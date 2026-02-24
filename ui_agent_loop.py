import json
import time
from datetime import datetime
from pathlib import Path

from ui_native_bridge import screenshot

ROOT = Path(r"C:\Users\robby\.openclaw\workspace")
OUT = ROOT / "outputs" / "ui"
OUT.mkdir(parents=True, exist_ok=True)
INTERVAL = 3.0  # seconds
KEEP = 10       # keep last N screenshots


def main():
    while True:
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        target = OUT / f"live_{ts}.png"
        screenshot(target)

        shots = sorted(OUT.glob("live_*.png"))
        if len(shots) > KEEP:
            for old in shots[:-KEEP]:
                old.unlink(missing_ok=True)

        status = {
            "last_capture": str(target),
            "timestamp": ts,
            "interval_s": INTERVAL,
        }
        (OUT / "ui-agent-status.json").write_text(json.dumps(status, ensure_ascii=False, indent=2), encoding="utf-8")
        time.sleep(INTERVAL)


if __name__ == "__main__":
    main()
