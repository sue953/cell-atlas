"""Serve the bundled classroom page on a local, automatically chosen port."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import webbrowser

root = Path(__file__).resolve().parent / "dist"
server = ThreadingHTTPServer(("127.0.0.1", 0), partial(SimpleHTTPRequestHandler, directory=str(root)))
url = f"http://127.0.0.1:{server.server_port}/"
print(f"细胞之间已启动：{url}\n关闭此窗口或按 Ctrl+C 结束。", flush=True)
webbrowser.open(url)
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    server.server_close()
