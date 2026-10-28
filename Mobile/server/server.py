# Vateko.fun full-song server (VPS): song name -> YouTube audio file served by Caddy.
# GET /resolve?q=<artist title>&dur=<seconds>&k=<token>  ->  {"url": "https://<host>/a/<id>.m4a"}
# googlevideo links are tied to the VPS IP, so the audio is downloaded here and served as a file.
import json, os, re, subprocess, threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

YTDLP = '/opt/ytdlp/bin/yt-dlp'
DIR = '/srv/vateko/a'
HOST = os.environ['VATEKO_HOST']
TOKEN = os.environ['VATEKO_TOKEN']  # shortcut: token ships inside the app, so it only stops casual abuse; add per-user auth if it gets abused
COOKIES = '/opt/vateko/cookies.txt'
BASE = [YTDLP, '--cookies', COOKIES, '--no-warnings']
locks, locks_guard = {}, threading.Lock()


def run(args, timeout=60):
    r = subprocess.run(BASE + args, capture_output=True, text=True, timeout=timeout)
    return r.stdout.strip()


def pick(q, dur):
    # first hit within 15 s of the Deezer length skips covers, live takes and 1 h loops
    hits = [l.split(' ') for l in run(['--flat-playlist', '--print', '%(id)s %(duration)s', f'ytsearch5:{q}']).splitlines()]
    hits = [h for h in hits if len(h) == 2 and re.fullmatch(r'[\w-]{11}', h[0])]
    for vid, d in hits:
        if dur and d not in ('NA', 'None') and abs(float(d) - dur) <= 15:
            return vid
    return hits[0][0] if hits else None


def fetch(vid):
    path = f'{DIR}/{vid}.m4a'
    with locks_guard:
        lock = locks.setdefault(vid, threading.Lock())
    with lock:  # two phones asking for the same song share one download
        if not os.path.exists(path):
            run(['-f', 'bestaudio[ext=m4a]/bestaudio', '-x', '--audio-format', 'm4a', '-o', f'{DIR}/{vid}.%(ext)s', f'https://www.youtube.com/watch?v={vid}'], timeout=180)
    return os.path.exists(path)


class H(BaseHTTPRequestHandler):
    def send(self, code, body):
        b = json.dumps(body).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def do_GET(self):
        u = urlparse(self.path)
        p = {k: v[0] for k, v in parse_qs(u.query).items()}
        if u.path != '/resolve':
            return self.send(404, {'error': 'path'})
        if p.get('k') != TOKEN:
            return self.send(403, {'error': 'token'})
        q = p.get('q', '').strip()[:200]
        if len(q) < 3:
            return self.send(400, {'error': 'q'})
        try:
            dur = float(p.get('dur') or 0)
        except ValueError:
            dur = 0
        try:
            vid = pick(q, dur)
            if not vid or not fetch(vid):
                return self.send(404, {'error': 'notfound'})
        except subprocess.TimeoutExpired:
            return self.send(504, {'error': 'timeout'})
        self.send(200, {'url': f'https://{HOST}/a/{vid}.m4a', 'id': vid})

    def log_message(self, *a):
        pass


if __name__ == '__main__':
    os.makedirs(DIR, exist_ok=True)
    ThreadingHTTPServer(('127.0.0.1', 8090), H).serve_forever()
