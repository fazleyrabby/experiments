"""Static server for the scene that also accepts uploaded capture frames.

Usage: python3 capture_server.py <port> <site_dir> <out_dir>
POST /upload/<name>  -> writes the request body to <out_dir>/<name>
"""
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from functools import partial

port, site, out = int(sys.argv[1]), sys.argv[2], sys.argv[3]
os.makedirs(out, exist_ok=True)


class Handler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if not self.path.startswith('/upload/'):
            self.send_error(404)
            return
        name = os.path.basename(self.path[len('/upload/'):])
        if not name:
            self.send_error(400)
            return
        length = int(self.headers.get('Content-Length', 0))
        with open(os.path.join(out, name), 'wb') as f:
            f.write(self.rfile.read(length))
        self.send_response(204)
        self.end_headers()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, *args):
        pass


ThreadingHTTPServer(('127.0.0.1', port), partial(Handler, directory=site)).serve_forever()
