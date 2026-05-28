/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  SENNA KIDS ZONE — ParentPortal.js                              ║
 * ║  Secure math-gate, developmental metrics, badge showcase,       ║
 * ║  bridge-to-reality missions, printable tracing workbook         ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import { store, LANG, speak, goTo, Audio } from '../app.js';
import { Storage } from '../services/storage.js';
import { ParentSync } from '../services/parent-sync.js';

export const ParentView = {
  _el: null,
  _answer: 0,

  create() {
    const el = document.createElement('div');
    el.className = 'view hidden';
    el.id = 'view-parent';
    el.style.cssText = 'overflow:hidden;align-items:stretch;padding:0;';
    this._el = el;
    store.sub(s => { if(s.view==='parent') this._render(); });
    return el;
  },

  _render() {
    if(!this._el) return;
    this._buildGate();
  },

  /* ── STEP 1: Math Gate ─────────────────────────────────────── */
  _buildGate() {
    const L = LANG[store.get().lang];
    const a = Math.floor(Math.random()*7)+4;
    const b = Math.floor(Math.random()*6)+3;
    this._answer = a * b;

    this._el.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;
                  width:100%;height:100%;padding:24px;">
        <div class="glass" style="width:100%;max-width:420px;padding:32px 28px;
                                   display:flex;flex-direction:column;gap:20px;
                                   box-shadow:0 0 60px rgba(108,63,197,.4);">

          <!-- Header -->
          <div style="text-align:center;">
            <div style="font-size:3rem;margin-bottom:8px;">🔒</div>
            <div class="t-title" style="color:var(--yellow);">${L.parent_title}</div>
            <div class="t-label" style="color:var(--muted);margin-top:6px;">${L.parent_gate_q}</div>
          </div>

          <!-- Math problem -->
          <div style="background:rgba(244,63,142,.15);border:2px solid rgba(244,63,142,.35);
                      border-radius:20px;padding:20px;text-align:center;">
            <div style="font-family:var(--font-fun);font-size:2.8rem;font-weight:800;
                        color:var(--pink);letter-spacing:.05em;">${a} × ${b} = ?</div>
          </div>

          <!-- Input -->
          <input id="gate-input" class="kz-input" type="number"
                 inputmode="numeric" pattern="[0-9]*"
                 placeholder="Your answer…"
                 onkeydown="if(event.key==='Enter') window._gateVerify()"/>

          <!-- Buttons -->
          <div style="display:flex;gap:12px;">
            <button class="btn-big" style="flex:1;background:linear-gradient(135deg,var(--green),var(--cyan));
                                           color:var(--night);font-size:1.1rem;min-height:56px;"
                    onclick="window._gateVerify()">
              ✅ ${L.parent_gate_btn}
            </button>
            <button class="btn-big" style="flex:1;background:rgba(255,255,255,.08);color:var(--muted);
                                           font-size:1rem;min-height:56px;
                                           border:1.5px solid rgba(255,255,255,.14);"
                    onclick="window._gateCancel()">
              ${L.parent_cancel}
            </button>
          </div>

          <div class="t-label" style="color:var(--muted);text-align:center;font-size:.8rem;opacity:.6;">
            This maths challenge keeps little ones out 😊
          </div>
        </div>
      </div>
    `;

    window._gateVerify = () => {
      const val = parseInt(document.getElementById('gate-input')?.value||'0');
      if(val === this._answer) {
        Audio.correct();
        this._buildDashboard();
      } else {
        Audio.wrong();
        const input = document.getElementById('gate-input');
        if(input) { input.style.borderColor='var(--red)'; input.value=''; }
        setTimeout(()=>{ if(input) input.style.borderColor=''; },1000);
      }
    };
    window._gateCancel = () => goTo('game');
  },

  /* ── STEP 2: Full Dashboard ────────────────────────────────── */
  _buildDashboard() {
    const s = store.get();
    const L = LANG[s.lang];
    const scores  = s.scores  || {motor:0,cog:0,sel:0};
    const badges  = s.badges  || [];
    const history = s.history || [];

    /* Pick bridge message based on lowest score */
    const entries = [
      { key:'motor', val:scores.motor||0 },
      { key:'cog',   val:scores.cog||0   },
      { key:'sel',   val:scores.sel||0   },
    ].sort((a,b)=>a.val-b.val);
    const bridgeIdx = Math.floor(Math.random()*L.bridges.length);
    const bridgeMsg = L.bridges[bridgeIdx];

    /* Stats */
    const totalChoices = history.length;
    const sessionMins  = Math.round((1080 - s.timer) / 60);
    const motorPct     = Math.min(100, Math.round(scores.motor||0));
    const cogPct       = Math.min(100, Math.round(scores.cog||0));
    const selPct       = Math.min(100, Math.round(scores.sel||0));

    /* Badge definitions */
    const BADGES = [
      { id:'first', icon:'🌟', name:L.badge_first },
      { id:'fast',  icon:'⚡', name:L.badge_fast  },
      { id:'motor', icon:'🤲', name:L.badge_motor },
      { id:'cog',   icon:'🧠', name:L.badge_cog   },
      { id:'sel',   icon:'💛', name:L.badge_sel   },
      { id:'full',  icon:'🏆', name:L.badge_full  },
    ];

    this._el.innerHTML = `
      <div class="sy" style="width:100%;height:100%;padding:clamp(60px,12vw,80px) clamp(12px,3vw,20px) clamp(20px,5vw,32px);">
        <div style="max-width:540px;margin:0 auto;display:flex;flex-direction:column;gap:18px;">

          <!-- Title -->
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
            <div>
              <div class="t-title" style="color:var(--yellow);">📊 ${L.parent_title}</div>
              <div class="t-label" style="color:var(--muted);font-size:.85rem;margin-top:2px;">
                Session: ${sessionMins} min · ${totalChoices} interactions
              </div>
            </div>
            <button class="btn-big" style="background:rgba(255,255,255,.08);color:var(--muted);
                                           font-size:.9rem;min-height:40px;padding:8px 16px;"
                    onclick="window._gateCancel()">
              ▶ ${L.parent_resume}
            </button>
          </div>

          <!-- Skill meters -->
          <div class="glass" style="padding:20px;display:flex;flex-direction:column;gap:16px;">
            ${this._meter(L.parent_motor,'🤲',motorPct,'var(--pink)')}
            ${this._meter(L.parent_cog,'🧠',cogPct,'var(--cyan)')}
            ${this._meter(L.parent_sel,'💛',selPct,'var(--green)')}
          </div>

          <!-- Session stats grid -->
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
            <div class="stat-card">
              <div style="font-size:1.8rem;">⏱️</div>
              <div class="t-label" style="color:var(--yellow);font-size:1.2rem;">${sessionMins}<span style="font-size:.75rem;color:var(--muted);">min</span></div>
              <div style="color:var(--muted);font-size:.75rem;font-family:var(--font-fun);">Screen time</div>
            </div>
            <div class="stat-card">
              <div style="font-size:1.8rem;">🎯</div>
              <div class="t-label" style="color:var(--cyan);font-size:1.2rem;">${totalChoices}</div>
              <div style="color:var(--muted);font-size:.75rem;font-family:var(--font-fun);">Interactions</div>
            </div>
            <div class="stat-card">
              <div style="font-size:1.8rem;">🏅</div>
              <div class="t-label" style="color:var(--green);font-size:1.2rem;">${badges.length}</div>
              <div style="color:var(--muted);font-size:.75rem;font-family:var(--font-fun);">Badges earned</div>
            </div>
          </div>

          <!-- Badges showcase -->
          <div class="glass" style="padding:18px;">
            <div class="t-label" style="color:var(--yellow);margin-bottom:12px;">🏅 Achievement Badges</div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
              ${BADGES.map(b=>`
                <div class="badge-card ${badges.includes(b.id)?'':'locked'}">
                  <div style="font-size:2rem;">${b.icon}</div>
                  <div style="font-family:var(--font-fun);font-size:.75rem;color:var(--muted);text-align:center;line-height:1.2;">${b.name}</div>
                  ${badges.includes(b.id)?`<div style="font-size:.65rem;color:var(--green);">✓ Earned</div>`:`<div style="font-size:.65rem;color:rgba(255,255,255,.2);">Locked</div>`}
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Bridge to reality -->
          <div style="background:linear-gradient(135deg,rgba(253,224,71,.12),rgba(108,63,197,.12));
                      border:1.5px solid rgba(253,224,71,.3);border-radius:20px;padding:18px;">
            <div class="t-label" style="color:var(--yellow);margin-bottom:8px;">🌍 ${L.parent_bridge}</div>
            <div class="t-label" style="color:var(--white);line-height:1.6;font-size:1rem;">
              ${bridgeMsg}
            </div>
          </div>

          <!-- Recent activity -->
          ${history.length > 0 ? `
          <div class="glass" style="padding:18px;">
            <div class="t-label" style="color:var(--cyan);margin-bottom:12px;">📋 Recent Choices</div>
            <div style="display:flex;flex-direction:column;gap:8px;">
              ${history.slice(-6).reverse().map(h=>`
                <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;
                            background:rgba(255,255,255,.05);border-radius:12px;">
                  <div style="font-size:1.4rem;">${h.emoji}</div>
                  <div style="flex:1;">
                    <div style="font-family:var(--font-fun);font-size:.85rem;color:var(--white);">${h.choice}</div>
                    <div style="font-size:.72rem;color:var(--muted);">${h.cat} · Step ${h.step+1}</div>
                  </div>
                  <div style="font-size:.7rem;color:var(--muted);">${this._ago(h.ts)}</div>
                </div>
              `).join('')}
            </div>
          </div>` : ''}

          <!-- Premium workbook -->
          <div style="background:linear-gradient(135deg,rgba(168,85,247,.2),rgba(244,63,142,.2));
                      border:1.5px solid rgba(168,85,247,.4);border-radius:24px;padding:22px;
                      display:flex;flex-direction:column;gap:14px;">
            <div style="display:flex;align-items:center;gap:12px;">
              <div style="font-size:2.2rem;">🖨️</div>
              <div>
                <div class="t-label" style="color:var(--yellow);">${L.parent_print}</div>
                <div style="color:var(--muted);font-size:.8rem;">Personalised tracing worksheets based on today's session</div>
              </div>
            </div>
            <button class="btn-big" id="print-btn"
                    style="background:linear-gradient(135deg,var(--violet),var(--pink));
                           color:var(--white);font-size:1rem;min-height:52px;"
                    onclick="window._triggerPrint()">
              🖨️ ${L.parent_print}
            </button>
          </div>

          <!-- Sync status -->
          <div id="sync-status" style="text-align:center;color:var(--muted);font-size:.8rem;font-family:var(--font-fun);">
            Syncing data…
          </div>

          <!-- Bottom spacer -->
          <div style="height:20px;"></div>
        </div>
      </div>
    `;

    /* Async sync */
    ParentSync.flush(s).then(ok=>{
      const el = document.getElementById('sync-status');
      if(el) el.textContent = ok ? '✅ Data synced to cloud' : '📱 Data saved locally (offline)';
    });

    /* Print handler */
    window._triggerPrint = () => this._doPrint(s, L, motorPct, cogPct, selPct);
    window._gateCancel = () => goTo('game');
  },

  _meter(label, icon, pct, col) {
    return `
      <div style="display:flex;flex-direction:column;gap:6px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div style="font-family:var(--font-fun);font-size:.9rem;color:var(--white);">${icon} ${label}</div>
          <div style="font-family:var(--font-fun);font-weight:700;color:${col};font-size:.95rem;">${pct}%</div>
        </div>
        <div class="prog-track">
          <div class="prog-fill" style="width:${pct}%;background:${col};box-shadow:0 0 10px ${col};"></div>
        </div>
      </div>
    `;
  },

  _ago(ts) {
    const mins = Math.round((Date.now()-ts)/60000);
    if(mins<1) return 'just now';
    if(mins<60) return `${mins}m ago`;
    return `${Math.round(mins/60)}h ago`;
  },

  /* ── Print workbook (media print) ─────────────────────────── */
  _doPrint(s, L, motorPct, cogPct, selPct) {
    const win = window.open('','_blank','width=794,height=1123');
    if(!win) return;

    const weak = motorPct <= cogPct && motorPct <= selPct ? 'motor'
               : cogPct  <= selPct ? 'cog' : 'sel';

    const TRACE_EN = {
      motor: ['A','B','C','D','E','1','2','3'],
      cog:   ['△','○','□','⬟','A','B','क','ख'],
      sel:   ['😊','❤️','⭐','🌟','A','B','1','2'],
    };
    const letters = TRACE_EN[weak] || TRACE_EN.cog;

    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/>
    <title>Senna Kids Zone — Practice Workbook</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800&display=swap');
      *{margin:0;padding:0;box-sizing:border-box;}
      body{font-family:'Nunito',sans-serif;background:#fff;color:#1e293b;padding:32px;}
      h1{text-align:center;font-size:2rem;color:#6c3fc5;margin-bottom:4px;}
      h2{font-size:1.1rem;text-align:center;color:#64748b;margin-bottom:28px;font-weight:400;}
      .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:32px;}
      .trace-box{
        border:3px dashed #c4b5fd;
        border-radius:20px;
        height:120px;
        display:flex;align-items:center;justify-content:center;
        font-size:3.5rem;color:rgba(108,63,197,.18);
        position:relative;
      }
      .dotted-line{border-top:2px dashed #e2e8f0;margin:20px 0;}
      .section-title{font-size:1rem;font-weight:700;color:#6c3fc5;margin-bottom:12px;}
      .write-line{
        border-bottom:2px solid #e2e8f0;height:50px;
        display:flex;align-items:flex-end;padding-bottom:4px;
        margin-bottom:16px;
        font-size:.75rem;color:#94a3b8;
      }
      .footer{text-align:center;color:#94a3b8;font-size:.75rem;margin-top:24px;border-top:1px solid #e2e8f0;padding-top:16px;}
      .score-row{display:flex;gap:20px;justify-content:center;margin-bottom:24px;}
      .score-pill{background:#f1f5f9;border-radius:50px;padding:8px 18px;font-size:.85rem;font-weight:700;}
    </style></head><body>
    <h1>🌟 Senna Kids Zone</h1>
    <h2>My Practice Workbook · ${new Date().toLocaleDateString()}</h2>

    <div class="score-row">
      <div class="score-pill">🤲 Motor: ${motorPct}%</div>
      <div class="score-pill">🧠 Thinking: ${cogPct}%</div>
      <div class="score-pill">💛 Feelings: ${selPct}%</div>
    </div>

    <div class="section-title">✏️ Trace these shapes and letters:</div>
    <div class="grid">
      ${letters.map(l=>`<div class="trace-box">${l}</div>`).join('')}
    </div>

    <div class="dotted-line"></div>
    <div class="section-title">📝 Practice writing (trace the dots):</div>
    ${['A  A  A  A  A','B  B  B  B  B','1  1  1  1  1','क  क  क  क  क'].map(t=>`
      <div class="write-line">
        <span style="color:#c4b5fd;font-size:1.6rem;letter-spacing:12px;font-weight:700;">${t}</span>
      </div>
    `).join('')}

    <div class="dotted-line"></div>
    <div class="section-title">🌈 Colour these shapes:</div>
    <div class="grid">
      ${['⭐','🌟','❤️','🔵','🟡','🟢','🔴','🟣'].map(e=>`
        <div class="trace-box" style="font-size:4rem;color:#e2e8f0;">${e}</div>
      `).join('')}
    </div>

    <div class="dotted-line"></div>
    <div class="section-title">🏠 Real-world mission today:</div>
    <p style="font-size:1rem;color:#475569;line-height:1.7;padding:14px;background:#f8fafc;border-radius:12px;border-left:4px solid #6c3fc5;">
      ${L.bridges[Math.floor(Math.random()*L.bridges.length)]}
    </p>

    <div class="footer">
      Generated by Senna Kids Zone · sennaplatform.com · ${new Date().getFullYear()}
    </div>
    </body></html>`);
    win.document.close();
    setTimeout(()=>win.print(),600);
  },
};
