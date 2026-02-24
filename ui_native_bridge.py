import argparse
import json
from pathlib import Path
from datetime import datetime

import mss
import cv2
import numpy as np
import pyautogui


def screenshot(path: Path):
    with mss.mss() as sct:
        monitor = sct.monitors[1]
        img = np.array(sct.grab(monitor))
        img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
        cv2.imwrite(str(path), img)


def click(x: int, y: int, button: str = "left"):
    pyautogui.moveTo(x, y, duration=0.15)
    pyautogui.click(button=button)


def type_text(text: str):
    pyautogui.write(text, interval=0.01)


def main():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_shot = sub.add_parser("shot")
    p_shot.add_argument("--out", default=str(Path.home() / ".openclaw" / "workspace" / "outputs" / "ui" / f"screen_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"))

    p_click = sub.add_parser("click")
    p_click.add_argument("x", type=int)
    p_click.add_argument("y", type=int)
    p_click.add_argument("--button", default="left")

    p_type = sub.add_parser("type")
    p_type.add_argument("text")

    args = parser.parse_args()

    if args.cmd == "shot":
        out = Path(args.out)
        out.parent.mkdir(parents=True, exist_ok=True)
        screenshot(out)
        print(json.dumps({"ok": True, "out": str(out)}))
    elif args.cmd == "click":
        click(args.x, args.y, args.button)
        print(json.dumps({"ok": True, "action": "click", "x": args.x, "y": args.y, "button": args.button}))
    elif args.cmd == "type":
        type_text(args.text)
        print(json.dumps({"ok": True, "action": "type", "len": len(args.text)}))


if __name__ == "__main__":
    pyautogui.FAILSAFE = True
    main()
