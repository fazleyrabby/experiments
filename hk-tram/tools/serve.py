"""Static dev server for hk-tram with caching disabled: python3 hk-tram/tools/serve.py [port]"""
import http.server, os, sys, functools

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
port = int(sys.argv[1]) if len(sys.argv) > 1 else 4311
http.server.ThreadingHTTPServer(('127.0.0.1', port), functools.partial(NoCache, directory=root)).serve_forever()
