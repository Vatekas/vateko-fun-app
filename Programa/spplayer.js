// Spotify Web Playback SDK behind the part of the <audio> API the queue in library.js uses:
// play() / pause(), paused, currentTime, duration and the play / pause / timeupdate / ended events.
// Needs Spotify Premium and castlabs Electron (Widevine); SP.on stays false otherwise.
const SP = Object.assign(new EventTarget(), {
  want: true, device: null, player: null, ready: null,
  paused: true, pos: 0, at: 0, dur: 0, uri: null,
  get on() { return this.want && !!this.device; },
  get currentTime() { return (this.pos + (this.paused ? 0 : performance.now() - this.at)) / 1000; },
  set currentTime(s) { this.pos = s * 1000; this.at = performance.now(); this.player?.seek(Math.round(s * 1000)); },
  get duration() { return this.dur / 1000; },
  play() { return this.player ? this.player.resume() : Promise.reject(new Error('spotify')); },
  pause() { this.player?.pause(); },
  async start(uri, sec = 0) {
    if (!await this.ready) return false;
    this.player.activateElement?.();
    this.uri = uri;
    this.dur = 0;
    return api.spPlay(uri, this.device, sec * 1000);
  },
  init() {
    if (this.ready) return this.ready;
    window.onSpotifyWebPlaybackSDKReady = () => {
      const p = this.player = new Spotify.Player({ name: 'Vateko.fun', getOAuthToken: cb => api.spToken().then(t => t && cb(t)), volume: +(localStorage.vol ?? 1) });
      p.addListener('ready', ({ device_id }) => { this.device = device_id; this.ok(device_id); });
      p.addListener('not_ready', () => { this.device = null; });
      ['initialization_error', 'authentication_error', 'account_error', 'playback_error'].forEach(e => p.addListener(e, ({ message }) => { console.warn('spotify', e, message); if (e !== 'playback_error') this.ok(null); }));
      p.addListener('player_state_changed', s => {
        const was = this.paused, end = !was && this.dur && this.currentTime * 1000 > this.dur - 2500;
        const mine = s?.track_window?.current_track?.uri === this.uri;
        this.paused = !s || s.paused || !mine; // null: playback moved to another device
        if (s && mine) { this.pos = s.position; this.at = performance.now(); this.dur = s.duration; }
        if (this.paused !== was) this.dispatchEvent(new Event(this.paused ? 'pause' : 'play'));
        if (this.paused && end && (!s || s.position === 0)) this.dispatchEvent(new Event('ended'));
      });
      p.connect();
    };
    this.ready = new Promise(res => { this.ok = res; setTimeout(() => res(null), 15000); });
    const s = document.createElement('script');
    s.src = 'https://sdk.scdn.co/spotify-player.js';
    s.onerror = () => this.ok(null);
    document.head.append(s);
    setInterval(() => { if (!this.paused) this.dispatchEvent(new Event('timeupdate')); }, 250);
    return this.ready;
  },
});
api.settings().then(s => { SP.want = s.spotify; });
api.onSettings(s => { SP.want = s.spotify; });
api.spStatus().then(s => { if (s.connected && s.premium) SP.init(); });
