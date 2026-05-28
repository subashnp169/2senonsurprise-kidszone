import { store, LANG, speak, burst, Audio, celebrate } from '../app.js';
import { Storage } from '../services/storage.js';

export const GameView = {
  _el: null,
  _bubbleInterval: null,

  create() {
    const el = document.createElement('div');
    el.className = 'view hidden';
    el.id = 'view-game';
    this._el = el;
    store.sub(s => { if(s.view==='game') this._render(); });
    return el;
  },

  refresh() { if(this._el) this._render(); },

  _render() {
    if(!this._el) return;
    const s  = store.get();
    const L  = LANG[s.lang];
    const step = L.steps[s.step] || L.steps[0];
    const totalSteps = L.steps.length;
    const pct  = Math.round((s.step / totalSteps) * 100);

    // Clear old bubbles
    if(this._bubbleInterval) clearInterval(this._bubbleInterval);

    this._el.innerHTML = `
      <style>
        @keyframes floatUp {
          0% { transform: translateY(100vh) scale(0.8) rotate(-5deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-20vh) scale(1.1) rotate(5deg); opacity: 0; }
        }
        .glass-bubble {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.2));
          box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.8), 0 10px 20px rgba(0, 0, 0, 0.2);
          display: flex; flex-direction: column; justify-content: center; align-items: center;
          cursor: pointer; z-index: 40; border: 2px solid rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(4px);
        }
        .glass-bubble:active { transform: scale(1.3); opacity: 0; transition: all 0.1s; }
      </style>

      <div style="display:flex;flex-direction:column;align-items:center; width:100%;height:100%;padding:60px 20px; overflow:hidden; position:relative;">
        
        <!-- Progress Dots -->
        <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;max-width:320px;z-index:10;">
          ${L.steps.map((_,i)=>`<div class="dot ${i<s.step?'done':i===s.step?'active':''}"></div>`).join('')}
        </div>

        <!-- Audio Prompt (Zero-Text Focus) -->
        <div class="glass" style="margin-top:20px; padding:20px 30px; text-align:center; z-index:10; border-radius: 50px; cursor:pointer;" onclick="window._repeatAudio()">
          <div style="font-size: 2rem;">🔊</div>
          <div class="t-title" style="color:var(--yellow); font-size: 1.2rem;">Tap to hear again</div>
        </div>

        <!-- Bubble Container -->
        <div id="bubble-container" style="position:absolute; inset:0; z-index:5; pointer-events:none;"></div>

      </div>
    `;

    window._repeatAudio = () => speak(step.q, s.lang);
    window._popBubble = (choice, cx, cy) => this._onChoice(choice, cx, cy);

    // Speak the prompt immediately
    setTimeout(() => speak(step.q, s.lang), 500);

    // Start spawning bubbles for this step
    this._spawnBubbles(step);
  },

  _spawnBubbles(step) {
    const container = document.getElementById('bubble-container');
    if(!container) return;

    // Spawn a bubble every 1.5 seconds
    this._bubbleInterval = setInterval(() => {
      // Randomly choose between option 1 and option 2
      const isOption1 = Math.random() > 0.5;
      const choiceNum = isOption1 ? 1 : 2;
      const emoji = isOption1 ? step.o1 : step.o2;
      
      const size = Math.floor(Math.random() * 40) + 120; // 120px to 160px
      const left = Math.floor(Math.random() * 70) + 10; // 10% to 80% width
      const duration = Math.floor(Math.random() * 4) + 5; // 5s to 9s float time

      const bubble = document.createElement('div');
      bubble.className = 'glass-bubble';
      bubble.style.cssText = `
        left: ${left}%; width: ${size}px; height: ${size}px;
        animation: floatUp ${duration}s linear forwards; pointer-events: auto;
      `;
      
      bubble.innerHTML = `<div style="font-size:${size*0.4}px; line-height:1;">${emoji}</div>`;
      
      // Pop event
      bubble.onpointerdown = (e) => {
        e.stopPropagation();
        bubble.remove();
        window._popBubble(choiceNum, e.clientX, e.clientY);
      };

      container.appendChild(bubble);

      // Cleanup bubble after animation
      setTimeout(() => { if(bubble.parentNode) bubble.remove(); }, duration * 1000);
    }, 1500);
  },

  _onChoice(choice, cx, cy) {
    const s = store.get();
    const L = LANG[s.lang];
    const step = L.steps[s.step];
    if(!step) return;

    // Stop spawning current bubbles
    clearInterval(this._bubbleInterval);
    document.getElementById('bubble-container').innerHTML = '';

    /* Score update */
    const cat = step.cat;
    const newScores = { ...s.scores };
    newScores[cat] = Math.min(100, (newScores[cat]||0) + 10);

    /* Sensory Celebration */
    const cheer = L.cheers[Math.floor(Math.random()*L.cheers.length)];
    celebrate(cx, cy, cheer);
    burst(cx, cy, 40); // Big particle explosion
    Audio.pop(); // Bubble pop sound
    setTimeout(() => Audio.correct(), 200); // Success chime

    /* Record to history */
    const historyEntry = {
      ts: Date.now(), step: s.step, cat,
      choice: choice===1 ? step.l1 : step.l2,
      emoji:  choice===1 ? step.o1 : step.o2,
    };
    const newHistory = [...(s.history||[]), historyEntry];

    /* Advance step */
    const nextStep = s.step + 1;
    const newState = { scores:newScores, history:newHistory };

    if(nextStep >= L.steps.length) {
      store.set({ ...newState, step:0 });
      this._onComplete(L);
    } else {
      setTimeout(() => store.set({ ...newState, step:nextStep }), 1000);
      store.set(newState);
    }

    Storage.set('skz_state', JSON.stringify({ scores:newScores, history:newHistory.slice(-50) }));
  },

  _onComplete(L) {
    for(let i=0;i<8;i++) {
      setTimeout(()=> burst(Math.random()*window.innerWidth, Math.random()*window.innerHeight, 40), i*200);
    }
    Audio.correct();
    speak("Wow! You popped all the right bubbles! Amazing!", store.get().lang);

    const overlay = document.createElement('div');
    overlay.style.cssText = `position:fixed;inset:0;z-index:9995; display:flex;flex-direction:column;align-items:center;justify-content:center; background:rgba(13,10,30,.92);backdrop-filter:blur(20px);text-align:center;padding:24px;`;
    overlay.innerHTML = `
      <div style="font-size:6rem;animation:spinStar 1s ease-in-out 3;">🏆</div>
      <div class="t-hero" style="color:var(--yellow);">All Done! 🎉</div>
      <button class="btn-big" style="background:var(--violet);color:#fff;margin-top:20px;" onclick="this.closest('div').remove(); window.location.reload();">Play Again! 🚀</button>
    `;
    document.body.appendChild(overlay);
  }
};
