/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  SENNA KIDS ZONE — storage.js                                   ║
 * ║  Local-first persistence: localStorage with graceful fallback,  ║
 * ║  session history ring buffer, daily streak tracker              ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

export const Storage = {
  _prefix: 'skz_',
  _ready:  false,

  async init() {
    // Test localStorage availability
    try {
      localStorage.setItem('__skz_test','1');
      localStorage.removeItem('__skz_test');
      this._ready = true;
    } catch(_) {
      this._ready = false;
      console.warn('[Storage] localStorage unavailable — running in-memory mode.');
    }

    // Update daily streak
    this._updateStreak();
    return this;
  },

  get(key) {
    if(!this._ready) return null;
    try { return localStorage.getItem(this._prefix + key); }
    catch(_) { return null; }
  },

  set(key, value) {
    if(!this._ready) return false;
    try { localStorage.setItem(this._prefix + key, value); return true; }
    catch(_) { return false; }
  },

  remove(key) {
    if(!this._ready) return;
    try { localStorage.removeItem(this._prefix + key); } catch(_) {}
  },

  getJSON(key, fallback=null) {
    const raw = this.get(key);
    if(!raw) return fallback;
    try { return JSON.parse(raw); } catch(_) { return fallback; }
  },

  setJSON(key, val) { return this.set(key, JSON.stringify(val)); },

  /* ── Daily streak ───────────────────────────────────────────── */
  _updateStreak() {
    const today  = new Date().toISOString().slice(0,10);
    const data   = this.getJSON('streak', { date:'', count:0 });
    const prev   = new Date(data.date);
    const now    = new Date(today);
    const diff   = Math.round((now-prev)/(1000*60*60*24));

    if(data.date === today) {
      // Same day — no change
    } else if(diff === 1) {
      // Consecutive day
      this.setJSON('streak', { date:today, count:data.count+1 });
    } else {
      // Reset streak
      this.setJSON('streak', { date:today, count:1 });
    }
  },

  getStreak() {
    return this.getJSON('streak', { date:'', count:0 });
  },

  /* ── Session log (ring buffer, keeps last 30 sessions) ─────── */
  logSession(summary) {
    const log = this.getJSON('session_log', []);
    log.push({ ...summary, ts: Date.now() });
    if(log.length > 30) log.splice(0, log.length-30);
    this.setJSON('session_log', log);
  },

  getSessionLog() {
    return this.getJSON('session_log', []);
  },

  /* ── Clear all app data (parent reset) ─────────────────────── */
  clearAll() {
    if(!this._ready) return;
    const keys = Object.keys(localStorage).filter(k=>k.startsWith(this._prefix));
    keys.forEach(k=>localStorage.removeItem(k));
  },
};
