"""Package tracked source and local preview runtimes, excluding user outputs/settings."""
import subprocess
import zipfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
dist = root / "dist"
dist.mkdir(exist_ok=True)
files = subprocess.check_output(["git", "ls-files", "-z"], cwd=root).decode("utf-8").split("\0")
with zipfile.ZipFile(dist / "mihoyo-spine-web.zip", "w", zipfile.ZIP_DEFLATED) as archive:
    for name in files:
        if name and (root / name).is_file():
            content = (root / name).read_bytes()
            if name.endswith(".bat"):
                content = content.replace(b"\r\n", b"\n").replace(b"\n", b"\r\n")
            archive.writestr("mihoyo-spine-web/" + name, content)
print(dist / "mihoyo-spine-web.zip")
