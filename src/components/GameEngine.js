/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  SENNA KIDS ZONE — GameEngine.js                                ║
 * ║  15-step interactive adventure: floating emoji bubbles, mascot  ║
 * ║  state machine, bilingual TTS, particle celebrations, scoring   ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import { store, LANG, speak, burst, Audio, celebrate, goTo } from '../app.js';
import { Storage } from '../services/storage.js';

/* ── Bubble colours per category ──────────────────────────────── */
const CAT_STYLE = {
  sel:   { bg:'linear-gradient(135deg,#f43f8e,#a855f7)', glow:'rgba(244,63,142,.5)', text:'#fff' },
  cog:   { bg:'linear-gradient(135deg,#22d3ee,#3b82f6)', glow:'rgba(34,211,238,.5)',  text:'#fff' },
  motor: { bg:'linear-gradient(135deg,#4ade80,#22d3ee)', glow:'rgba(74,222,128,.5)',  text:'#0d1a2e' },
};

export const GameView = {
  _el: null,

  create() {
    const el = document.createElement('div');
    el.className = 'view hidden';
    el.id = 'view-game';
    this._el = el;
    this._render();
    // Re-render when store changes (lang toggle, step advance)
    store.sub(s => { if(s.view==='game') this._render(); });
    return el;
  },

  refresh() { if(this._el) this._render(); },

  _render() {
    if(!this._el) return;
    const s  = store.get();
    const L  = LANG[s.lang];
    const step = L.steps[s.step] || L.steps[0];
    const cat  = step.cat;
    const cs   = CAT_STYLE[cat] || CAT_STYLE.cog;
    const totalSteps = L.steps.length;
    const pct  = Math.round((s.step / totalSteps) * 100);

    this._el.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;
                  width:100%;height:100%;padding:clamp(60px,12vw,90px) clamp(12px,3vw,24px) clamp(16px,4vw,28px);
                  gap:clamp(10px,2.5vw,20px);overflow:hidden;">

        <!-- Step dots -->
        <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;max-width:320px;z-index:2;">
          ${L.steps.map((_,i)=>`
            <div class="dot ${i<s.step?'done':i===s.step?'active':''}"></div>
          `).join('')}
        </div>

        <!-- Question card -->
        <div class="glass" style="padding:clamp(14px,3vw,24px) clamp(18px,4vw,32px);
                                   text-align:center;max-width:500px;width:100%;z-index:2;
                                   box-shadow:0 0 40px ${cs.glow};">
          <div class="t-label" style="color:var(--muted);margin-bottom:6px;">
            ${s.step+1} / ${totalSteps}
          </div>
          <div id="game-question" class="t-title" style="color:var(--yellow);line-height:1.3;">
            ${step.q}
          </div>
        </div>

        <!-- Mascot -->
        <div id="mascot-area" style="z-index:2;position:relative;
                                      filter:drop-shadow(0 0 20px ${cs.glow});">
          <div id="mascot" class="t-mega" style="transition:transform .3s cubic-bezier(.34,1.56,.64,1);
                                                  animation:sleepBob 3s ease-in-out infinite;">
            🦉
          </div>
          <!-- Mascot speech bubble -->
          <div id="mascot-bubble" style="position:absolute;top:-10px;right:-20px;
               background:var(--yellow);color:#0d0a1e;font-family:var(--font-fun);
               font-size:.85rem;font-weight:800;padding:4px 10px;border-radius:12px;
               white-space:nowrap;display:none;z-index:3;">
            ✨
          </div>
        </div>

        <!-- Answer bubbles -->
        <div style="display:flex;gap:clamp(20px,6vw,50px);justify-content:center;
                    align-items:center;z-index:2;flex-wrap:wrap;">
          <button class="bub shimmer"
            style="--fd:3.2s;--fd2:0s;
                   width:clamp(120px,28vw,180px);height:clamp(120px,28vw,180px);
                   background:${cs.bg};
                   box-shadow:0 0 30px ${cs.glow},0 12px 40px rgba(0,0,0,.3);"
            data-choice="1"
            onclick="window._gameChoice(1, event)">
            <div style="font-size:clamp(2.8rem,9vw,5rem);line-height:1;">${step.o1}</div>
            <div style="font-family:var(--font-fun);font-size:clamp(.75rem,2.5vw,1.1rem);
                        font-weight:700;color:${cs.text};margin-top:4px;opacity:.9;">${step.l1}</div>
          </button>

          <button class="bub shimmer"
            style="--fd:2.8s;--fd2:.4s;
                   width:clamp(120px,28vw,180px);height:clamp(120px,28vw,180px);
                   background:${cs.bg};
                   box-shadow:0 0 30px ${cs.glow},0 12px 40px rgba(0,0,0,.3);"
            data-choice="2"
            onclick="window._gameChoice(2, event)">
            <div style="font-size:clamp(2.8rem,9vw,5rem);line-height:1;">${step.o2}</div>
            <div style="font-family:var(--font-fun);font-size:clamp(.75rem,2.5vw,1.1rem);
                        font-weight:700;color:${cs.text};margin-top:4px;opacity:.9;">${step.l2}</div>
          </button>
        </div>

        <!-- Overall session progress -->
        <div style="width:min(340px,88vw);z-index:2;display:flex;flex-direction:column;gap:6px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div class="t-label" style="color:var(--muted);font-size:.85rem;">Adventure progress</div>
            <div class="t-label" style="color:var(--cyan);font-size:.85rem;">${pct}%</div>
          </div>
          <div class="prog-track">
            <div class="prog-fill" style="width:${pct}%;background:linear-gradient(90deg,var(--violet),var(--cyan));"></div>
          </div>
        </div>

        <!-- Category score chips -->
        <div style="display:flex;gap:10px;z-index:2;flex-wrap:wrap;justify-content:center;">
          ${this._scoreChips(s.scores)}
        </div>

      </div>
    `;

    // Expose global handler (required because innerHTML resets)
    window._gameChoice = (choice, evt) => this._onChoice(choice, evt);

    // Speak question after short delay
    setTimeout(() => speak(step.q, s.lang), 300);
  },

  _scoreChips(scores) {
    const chips = [
      { key:'motor', label:'🤲 Motor',   col:'var(--green)'  },
      { key:'cog',   label:'🧠 Thinking', col:'var(--cyan)'   },
      { key:'sel',   label:'💛 Feelings', col:'var(--pink)'   },
    ];
    return chips.map(c=>`
      <div style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);
                  border-radius:50px;padding:4px 12px;display:flex;align-items:center;gap:6px;">
        <span style="font-size:.85rem;">${c.label}</span>
        <span style="font-family:var(--font-fun);font-weight:700;color:${c.col};font-size:.9rem;">
          ${Math.round(scores[c.key]||0)}
        </span>
      </div>
    `).join('');
  },

  _onChoice(choice, evt) {
    const s = store.get();
    const L = LANG[s.lang];
    const step = L.steps[s.step];
    if(!step) return;

    /* Coordinates for effects */
    const cx = evt ? evt.clientX : window.innerWidth/2;
    const cy = evt ? evt.clientY : window.innerHeight/2;

    /* Score update */
    const cat = step.cat;
    const newScores = { ...s.scores };
    newScores[cat] = Math.min(100, (newScores[cat]||0) + 10);

    /* Celebration */
    const cheer = L.cheers[Math.floor(Math.random()*L.cheers.length)];
    celebrate(cx, cy, cheer);
    burst(cx, cy, 28);
    Audio.correct();

    /* Mascot reaction */
    const mascot = document.getElementById('mascot');
    const bubble  = document.getElementById('mascot-bubble');
    if(mascot) {
      mascot.style.transform = 'scale(1.35) rotate(10deg)';
      setTimeout(() => mascot.style.transform = '', 600);
    }
    if(bubble) {
      bubble.textContent = cheer;
      bubble.style.display = 'block';
      setTimeout(() => bubble.style.display='none', 1400);
    }

    /* Record to history */
    const historyEntry = {
      ts: Date.now(),
      step: s.step,
      cat,
      choice: choice===1 ? step.l1 : step.l2,
      emoji:  choice===1 ? step.o1 : step.o2,
    };

    const newHistory = [...(s.history||[]), historyEntry];

    /* Badge check */
    const newBadges = this._checkBadges(s.badges, newScores, newHistory, s.step+1, L.steps.length);

    /* Advance step or complete */
    const nextStep = s.step + 1;
    const newState = { scores:newScores, history:newHistory, badges:newBadges };

    if(nextStep >= L.steps.length) {
      /* Session complete — loop back and persist */
      store.set({ ...newState, step:0 });
      this._onComplete(newScores, newBadges, L);
    } else {
      setTimeout(() => {
        store.set({ ...newState, step:nextStep });
      }, 600);
      store.set(newState);
    }

    /* Persist to local storage */
    Storage.set('skz_state', JSON.stringify({ scores:newScores, badges:newBadges, history:newHistory.slice(-50) }));
  },

  _checkBadges(existing, scores, history, stepsDone, totalSteps) {
    const b = new Set(existing);
    if(history.length >= 1)         b.add('first');
    if(history.length >= 5)         b.add('fast');
    if((scores.motor||0) >= 50)     b.add('motor');
    if((scores.cog||0)   >= 50)     b.add('cog');
    if((scores.sel||0)   >= 50)     b.add('sel');
    if(stepsDone >= totalSteps)     b.add('full');
    return [...b];
  },

  _onComplete(scores, badges, L) {
    /* Big fireworks burst */
    for(let i=0;i<6;i++) {
      setTimeout(()=>{
        burst(Math.random()*window.innerWidth, Math.random()*window.innerHeight*0.7, 30);
      }, i*180);
    }
    Audio.correct();
    speak("Wow! You finished all the adventures! Amazing!", store.get().lang);

    /* Show completion overlay briefly */
    const overlay = document.createElement('div');
    overlay.style.cssText = `position:fixed;inset:0;z-index:9995;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      gap:16px;background:rgba(13,10,30,.92);backdrop-filter:blur(20px);text-align:center;padding:24px;`;
    overlay.innerHTML = `
      <div style="font-size:5rem;animation:spinStar 1s ease-in-out 3;">🏆</div>
      <div class="t-hero" style="color:var(--yellow);">All Done! 🎉</div>
      <div class="t-label" style="color:var(--muted);max-width:300px;line-height:1.6;">
        You completed all ${L.steps.length} adventures today!
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin:8px 0;">
        ${badges.map(b=>`<div style="font-size:2rem;">🏅</div>`).join('')}
      </div>
      <button class="btn-big" style="background:var(--violet);color:#fff;margin-top:8px;"
              onclick="this.closest('div').remove()">
        Play Again! 🚀
      </button>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => overlay.remove(), 12000);
  },
};
