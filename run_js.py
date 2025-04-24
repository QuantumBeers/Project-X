import http.server
import socketserver
import os
import json

PORT = 8069
DIRECTORY = os.getcwd()
STATIC_DIR = os.path.join(DIRECTORY, "static")
SRC_DIR = os.path.join(DIRECTORY, "src")  # ✅ Add src directory
CONFIG_PATH = os.path.join(STATIC_DIR, "config.json")

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith("/static/"):
            self.path = self.path[1:]  # Remove leading slash
            return super().do_GET()

        if self.path.startswith("/src/"):  # ✅ Serve /src/ files properly
            self.path = self.path[1:]  # Remove leading slash
            return super().do_GET()

        if self.path == "/config":
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            with open(CONFIG_PATH, "r") as f:
                self.wfile.write(f.read().encode())
            return

        super().do_GET()

with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
    print(f"Serving at http://localhost:{PORT}/")
    httpd.serve_forever()
