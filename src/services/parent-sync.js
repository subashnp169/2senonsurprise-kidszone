/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  SENNA KIDS ZONE — parent-sync.js                               ║
 * ║  Zero-latency offline-first sync to Cloudflare Workers API.     ║
 * ║  Queues payloads locally when offline, flushes on reconnect.    ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import { Storage } from './storage.js';

const WORKER_ENDPOINT = '/api/parent-sync';
const QUEUE_KEY       = 'sync_queue';
const MAX_QUEUE       = 20;

export const ParentSync = {

  /* ── Build and send session payload ──────────────────────── */
  async flush(state) {
    const payload = {
      appVersion:   '3.0.0',
      platform:     'senna-kids-zone',
      sessionId:    this._sessionId(),
      syncedAt:     new Date().toISOString(),
      lang:         state.lang || 'en',
      timer:        state.timer || 0,
      stepReached:  state.step  || 0,
      scores:       state.scores || {},
      badges:       state.badges || [],
      history:      (state.history||[]).slice(-20),
      streak:       Storage.getStreak(),
    };

    // Always save locally first
    Storage.logSession(payload);
    this._enqueue(payload);

    // Try to send
    const ok = await this._send(payload);
    if(ok) this._clearQueue();
    else   this._processQueue();   // try older queued items anyway

    return ok;
  },

  /* ── HTTP POST to Cloudflare Worker ──────────────────────── */
  async _send(payload) {
    try {
      const res = await fetch(WORKER_ENDPOINT, {
        method:  'POST',
        headers: { 'Content-Type':'application/json' },
        body:    JSON.stringify(payload),
        signal:  AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch(_) {
      return false;  // offline or worker not deployed yet — graceful
    }
  },

  /* ── Offline queue management ─────────────────────────────── */
  _enqueue(payload) {
    const q = Storage.getJSON(QUEUE_KEY, []);
    q.push(payload);
    if(q.length > MAX_QUEUE) q.splice(0, q.length - MAX_QUEUE);
    Storage.setJSON(QUEUE_KEY, q);
  },

  _clearQueue() {
    Storage.remove(QUEUE_KEY);
  },

  async _processQueue() {
    const q = Storage.getJSON(QUEUE_KEY, []);
    if(!q.length) return;
    const remaining = [];
    for(const item of q) {
      const ok = await this._send(item);
      if(!ok) remaining.push(item);
    }
    Storage.setJSON(QUEUE_KEY, remaining);
  },

  /* ── Stable session ID (per browser session) ─────────────── */
  _sessionId() {
    let id = sessionStorage.getItem('skz_sid');
    if(!id) {
      id = `skz_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
      sessionStorage.setItem('skz_sid', id);
    }
    return id;
  },
};
