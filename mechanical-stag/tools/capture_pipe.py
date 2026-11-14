"""Static server that pipes raw RGBA frames straight into ffmpeg.

Usage: python3 capture_pipe.py <port> <site_dir> <out.mp4> [width height fps]
POST /start          -> (re)starts ffmpeg
POST /frame          -> body is one raw RGBA frame (width*height*4 bytes), appended in order
POST /end            -> closes ffmpeg and finalises the mp4
POST /save?off=N     -> one chunk of a finished mp4 (from the in-browser encoder), written at byte N of <out.mp4>
Single-threaded on purpose so frames arrive in order.
"""
import subprocess
import sys
from functools import partial
from http.server import HTTPServer, SimpleHTTPRequestHandler

port, site, out = int(sys.argv[1]), sys.argv[2], sys.argv[3]
W, H, FPS = (int(sys.argv[4]), int(sys.argv[5]), int(sys.argv[6])) if len(sys.argv) > 6 else (1920, 1080, 60)
state = {'ff': None, 'n': 0}


def start():
    stop()
    state['n'] = 0
    state['ff'] = subprocess.Popen([
        'ffmpeg', '-y', '-loglevel', 'error',
        '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-tune', 'film',
        '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out,
    ], stdin=subprocess.PIPE)


def stop():
    ff = state['ff']
    if ff:
        ff.stdin.close()
        ff.wait()
        state['ff'] = None


class Handler(SimpleHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length) if length else b''
        if self.path == '/start':
            start()
        elif self.path == '/frame':
            if not state['ff'] or len(body) != W * H * 4:
                self.send_error(400, f'bad frame ({len(body)} bytes)')
                return
            state['ff'].stdin.write(body)
            state['n'] += 1
        elif self.path == '/end':
            stop()
        elif self.path.startswith('/save'):
            off = int(self.path.split('off=')[1]) if 'off=' in self.path else 0
            with open(out, 'wb' if off == 0 else 'r+b') as f:
                f.seek(off)
                f.write(body)
            state['n'] = off + len(body)
        else:
            self.send_error(404)
            return
        self.send_response(200)
        self.send_header('Content-Type', 'text/plain')
        self.end_headers()
        self.wfile.write(str(state['n']).encode())

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, *args):
        pass


HTTPServer(('127.0.0.1', port), partial(Handler, directory=site)).serve_forever()
