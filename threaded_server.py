import http.server
import socketserver
import sys

PORT = 8000
DIRECTORY = r"C:\Users\Salman\.gemini\antigravity\scratch\legalease"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        pass  # Quiet logging

class ThreadedHTTPServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True

if __name__ == '__main__':
    with ThreadedHTTPServer(("", PORT), Handler) as httpd:
        print(f"Serving at port {PORT} (Threaded)")
        sys.stdout.flush()
        httpd.serve_forever()
