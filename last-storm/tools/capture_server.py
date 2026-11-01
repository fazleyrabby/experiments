"""Static server for the film that also accepts uploaded export frames.

Usage: python3 capture_server.py <port> <site_dir> <out_dir>
POST /upload/<name>  -> writes the request body to <out_dir>/<name>
  With "X-Encoding: base64" the body is a base64 string or data: URL, decoded before writing.
"""
import base64
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
        body = self.rfile.read(length)
        if self.headers.get('X-Encoding') == 'base64':
            body = base64.b64decode(body.split(b',', 1)[-1])
        with open(os.path.join(out, name), 'wb') as f:
            f.write(body)
        self.send_response(204)
        self.end_headers()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, *args):
        pass


ThreadingHTTPServer(('127.0.0.1', port), partial(Handler, directory=site)).serve_forever()
