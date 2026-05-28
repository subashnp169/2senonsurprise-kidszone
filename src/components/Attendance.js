/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  SENNA KIDS ZONE — Attendance.js                                ║
 * ║  Holographic Magic Mirror: WebRTC front-cam clipped in circle,  ║
 * ║  interactive fog-wipe grid, cartoon lion fallback, motion spark  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import { store, LANG, speak, burst, Audio, goTo } from '../app.js';

/* ── Constants ────────────────────────────────────────────────── */
const FOG_COLS     = 18;
const FOG_ROWS     = 18;
const WIPE_RADIUS  = 36;      // px brush radius for fog removal
const CLEAR_THRESH = 0.14;    // fraction of fog remaining → advance to game

export const AttendanceView = {
  _el:   null,
  _raf:  null,
  _stream: null,

  create() {
    const el = document.createElement('div');
    el.className = 'view';
    el.id = 'view-attendance';
    el.innerHTML = this._html();
    this._el = el;

    // Defer canvas init until el is in DOM
    requestAnimationFrame(() => this._init());
    return el;
  },

  _html() {
    const L = LANG[store.get().lang];
    return `
      <div style="display:flex;flex-direction:column;align-items:center;gap:clamp(16px,4vw,32px);
                  padding:clamp(12px,3vw,24px);width:100%;max-width:520px;">

        <!-- Decorative stars -->
        <div style="position:absolute;inset:0;pointer-events:none;overflow:hidden;">
          <div class="dec" style="--fd:7s;--dd:0s;top:8%;left:12%;font-size:2rem;opacity:.4;">⭐</div>
          <div class="dec" style="--fd:5s;--dd:1s;top:15%;right:14%;font-size:1.5rem;opacity:.3;">✨</div>
          <div class="dec" style="--fd:8s;--dd:2s;bottom:18%;left:8%;font-size:1.8rem;opacity:.35;">🌟</div>
          <div class="dec" style="--fd:6s;--dd:.5s;bottom:22%;right:10%;font-size:1.2rem;opacity:.3;">💫</div>
        </div>

        <!-- Prompt text -->
        <div id="att-prompt" class="t-title" style="color:var(--yellow);text-align:center;
             text-shadow:0 0 30px rgba(253,224,71,.5);z-index:2;padding:0 16px;">
          ${L.fog_prompt}
        </div>

        <!-- Mirror container -->
        <div id="fog-wrap" style="position:relative;">
          <div class="ring"></div>
          <div class="ring ring2"></div>
          <canvas id="fog-canvas" style="display:block;border-radius:50%;cursor:crosshair;"></canvas>
        </div>

        <!-- Progress hint -->
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;z-index:2;width:min(260px,80vw);">
          <div class="t-label" style="color:var(--muted);">Keep wiping! ✋</div>
          <div class="prog-track" style="width:100%;">
            <div id="att-progress" class="prog-fill shimmer"
                 style="background:linear-gradient(90deg,var(--cyan),var(--violet));width:0%;"></div>
          </div>
        </div>

        <!-- Skip button (long-press fallback for parents) -->
        <button id="att-skip" class="btn-big" style="background:rgba(255,255,255,.08);color:var(--muted);
                font-size:1rem;min-height:44px;padding:10px 20px;border:1.5px solid rgba(255,255,255,.12);"
                onpointerdown="this._t=Date.now()"
                onpointerup="window._attSkip && window._attSkip(this)">
          Press & hold to skip →
        </button>
      </div>
    `;
  },

  async _init() {
    const canvas = document.getElementById('fog-canvas');
    if(!canvas) return;

    /* Size canvas = circle that fits screen nicely */
    const dim = Math.min(window.innerWidth * 0.72, window.innerHeight * 0.52, 360);
    canvas.width = canvas.height = dim;

    const ctx  = canvas.getContext('2d');
    const half = dim / 2;

    /* Build fog cell grid */
    const cellW  = dim / FOG_COLS;
    const cellH  = dim / FOG_ROWS;
    let fogCells = [];
    for(let r=0; r<FOG_ROWS; r++) {
      for(let c=0; c<FOG_COLS; c++) {
        const cx = c*cellW + cellW/2;
        const cy = r*cellH + cellH/2;
        const dist = Math.hypot(cx-half, cy-half);
        if(dist <= half) {
          fogCells.push({ x:c*cellW, y:r*cellH, w:cellW, h:cellH, active:true });
        }
      }
    }
    const totalFog = fogCells.length;

    /* Try camera */
    let video = null;
    let camOk = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video:{facingMode:'user',width:480,height:480}, audio:false });
      this._stream = stream;
      video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      await video.play().catch(()=>{});
      camOk = true;
    } catch(_) { camOk = false; }

    /* Render loop */
    let mascotFrame = 0;
    const mascotEmojis = ['🦁','🦁','😺','🐻','🦁'];

    const draw = () => {
      ctx.clearRect(0,0,dim,dim);

      /* Clip to circle */
      ctx.save();
      ctx.beginPath();
      ctx.arc(half,half,half,0,Math.PI*2);
      ctx.clip();

      /* Background: camera or cartoon */
      if(camOk && video && video.readyState>=2) {
        ctx.save();
        ctx.translate(dim,0);
        ctx.scale(-1,1); // mirror flip
        ctx.drawImage(video,0,0,dim,dim);
        ctx.restore();
      } else {
        /* Cartoon gradient background */
        const grad = ctx.createRadialGradient(half,half,0,half,half,half);
        grad.addColorStop(0,'#1e3a5f');
        grad.addColorStop(1,'#0d1a2e');
        ctx.fillStyle = grad;
        ctx.fillRect(0,0,dim,dim);

        /* Animated mascot */
        mascotFrame++;
        const bob = Math.sin(mascotFrame*0.04)*6;
        ctx.font = `${dim*0.55}px Arial`;
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(mascotEmojis[Math.floor(mascotFrame/30)%mascotEmojis.length], half, half+bob);

        /* Sparkles */
        if(mascotFrame%40===0) burst(half*Math.random()*2, dim*Math.random(), 4, 'rgba(253,224,71,.9)');
      }

      /* Draw active fog cells */
      const activeFog = fogCells.filter(c=>c.active);
      const fogRatio  = activeFog.length / totalFog;

      /* Fog colour transitions from light blue → purple → cleared */
      activeFog.forEach(cell => {
        const alpha = 0.88 + Math.random()*0.06;
        ctx.fillStyle = `rgba(186,230,253,${alpha})`;
        ctx.fillRect(cell.x, cell.y, cell.w+1, cell.h+1);
      });

      /* Frost shimmer on fog */
      if(fogRatio > 0.5) {
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(0,0,dim,dim);
      }

      ctx.restore();

      /* Update progress bar */
      const cleared = 1 - fogRatio;
      const progEl  = document.getElementById('att-progress');
      if(progEl) progEl.style.width = `${(cleared*100).toFixed(1)}%`;

      /* Advance to game when mostly cleared */
      if(fogRatio < CLEAR_THRESH) {
        this._advance();
        return;
      }

      this._raf = requestAnimationFrame(draw);
    };
    this._raf = requestAnimationFrame(draw);

    /* Touch/pointer handlers for fog wiping */
    const wipe = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = dim / rect.width;
      const scaleY = dim / rect.height;
      const lx = (clientX - rect.left) * scaleX;
      const ly = (clientY - rect.top)  * scaleY;

      let wiped = false;
      fogCells.forEach(cell => {
        if(!cell.active) return;
        const cx = cell.x + cell.w/2;
        const cy = cell.y + cell.h/2;
        if(Math.hypot(cx-lx, cy-ly) < WIPE_RADIUS) {
          cell.active = false;
          wiped = true;
        }
      });
      if(wiped) {
        Audio.fog(clientY);
        burst(clientX, clientY, 3, 'rgba(34,211,238,.8)');
        /* Update motor score */
        const s = store.get();
        store.set({ scores: {...s.scores, motor: Math.min(100, s.scores.motor+1)} });
      }
    };

    canvas.addEventListener('pointermove', e => {
      if(e.buttons > 0 || e.pointerType==='touch') wipe(e.clientX, e.clientY);
    }, {passive:true});
    canvas.addEventListener('pointerdown', e => wipe(e.clientX, e.clientY), {passive:true});

    /* Touch multi-finger */
    canvas.addEventListener('touchmove', e => {
      Array.from(e.touches).forEach(t => wipe(t.clientX, t.clientY));
    }, {passive:true});

    /* Skip (long-press ≥ 1.5 s) */
    window._attSkip = (btn) => {
      if(Date.now()-btn._t >= 1500) this._advance();
    };
  },

  _advance() {
    if(this._raf) { cancelAnimationFrame(this._raf); this._raf=null; }
    if(this._stream) { this._stream.getTracks().forEach(t=>t.stop()); this._stream=null; }

    const L = LANG[store.get().lang];
    Audio.chime();
    burst(window.innerWidth/2, window.innerHeight/2, 35, 'rgba(34,211,238,.9)');
    speak(L.fog_done, store.get().lang);

    setTimeout(() => goTo('game'), 700);
  },

  destroy() {
    if(this._raf) cancelAnimationFrame(this._raf);
    if(this._stream) this._stream.getTracks().forEach(t=>t.stop());
  }
};
