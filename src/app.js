/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  SENNA KIDS ZONE — app.js                                       ║
 * ║  Global supervisor: state machine, routing, bilingual registry, ║
 * ║  session chronometer, particle engine, Web Audio synthesizer    ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import { AttendanceView } from './components/Attendance.js';
import { GameView }       from './components/GameEngine.js';
import { ParentView }     from './components/ParentPortal.js';
import { Storage }        from './services/storage.js';
import { ParentSync }     from './services/parent-sync.js';

/* ─────────────────────────────────────────────────────────────────
   BILINGUAL REGISTRY  (English + Nepali)
   All UI strings live here — swap lang and everything updates
───────────────────────────────────────────────────────────────── */
export const LANG = {
  en: {
    /* Sleep screen */
    sleep_title: "Time to Sleep! 🌙",
    sleep_desc:  "Our buddy is sleepy. See you tomorrow for more adventures!",
    /* Attendance / fog wipe */
    fog_prompt:  "Wipe the mist to see your face! ✨",
    fog_done:    "Yay! Hello there! 👋",
    /* Game questions — 15 steps */
    steps: [
      { q:"Where are we today?",          o1:"🏫", o2:"🏠", l1:"School",    l2:"Home",      cat:"sel"  },
      { q:"How did you get here?",        o1:"🚌", o2:"🚗", l1:"Bus",       l2:"Car",       cat:"motor"},
      { q:"How do you feel right now?",   o1:"😊", o2:"😴", l1:"Happy",     l2:"Sleepy",    cat:"sel"  },
      { q:"Find the letter A!",           o1:"🅰️", o2:"🅱️", l1:"A",         l2:"B",         cat:"cog"  },
      { q:"Which colour is RED?",         o1:"❤️", o2:"💙", l1:"Red",       l2:"Blue",      cat:"cog"  },
      { q:"Brain break! Pick one!",       o1:"🌳", o2:"🐸", l1:"Stretch",   l2:"Jump",      cat:"motor"},
      { q:"Nepali: Find 'अ' for Amba!",   o1:"अ",  o2:"आ", l1:"अ",          l2:"आ",          cat:"cog"  },
      { q:"Nepali: Find 'क' for Kukur!",  o1:"क",  o2:"ख", l1:"क",          l2:"ख",          cat:"cog"  },
      { q:"Which has only ONE?",          o1:"☀️", o2:"⭐⭐⭐",l1:"One",    l2:"Three",     cat:"cog"  },
      { q:"Find number ONE (१)!",         o1:"🎈", o2:"🎈🎈",l1:"१",        l2:"२",          cat:"cog"  },
      { q:"What do you eat for snack?",   o1:"🍎", o2:"🍕", l1:"Apple",     l2:"Pizza",     cat:"sel"  },
      { q:"Which animal says 'Moo'?",     o1:"🐄", o2:"🐶", l1:"Cow",       l2:"Dog",       cat:"cog"  },
      { q:"What do we use to draw?",      o1:"🖍️", o2:"🔨", l1:"Crayon",    l2:"Hammer",    cat:"motor"},
      { q:"Time to pack up! Toys go…",   o1:"🧺", o2:"🗑️", l1:"Basket",    l2:"Bin",       cat:"motor"},
      { q:"How was your day?",            o1:"⭐", o2:"💤", l1:"Great!",    l2:"Tired",     cat:"sel"  },
    ],
    /* Celebrations */
    cheers: ["Amazing! 🎉","Super! ⭐","Wow! 🌟","Brilliant! 🦋","You rock! 🚀","Perfect! 🌈","Great job! 🎊"],
    /* Parent portal */
    parent_title:    "Parent Dashboard",
    parent_gate_q:   "Solve to unlock:",
    parent_gate_btn: "Verify",
    parent_cancel:   "Cancel",
    parent_resume:   "Resume Play",
    parent_motor:    "Fine Motor Skills",
    parent_cog:      "Cognitive Matching",
    parent_sel:      "Social & Emotional",
    parent_bridge:   "Today's Real-World Mission:",
    parent_print:    "Print Practice Workbook 🖨️",
    parent_premium:  "Unlock Premium Workbooks",
    /* Badges */
    badge_first:  "First Adventure",
    badge_fast:   "Quick Learner",
    badge_motor:  "Busy Hands",
    badge_cog:    "Brain Star",
    badge_sel:    "Kind Heart",
    badge_full:   "All Done!",
    /* Offline bridge messages */
    bridges: [
      "Find 3 red things in your home!",
      "Say the alphabet together out loud!",
      "Draw the letter A in the air with your finger!",
      "Count toys: one, two, three — how many?",
      "Make a funny animal sound together!",
      "Stack pillows like building blocks!",
    ],
    /* Wake / portal */
    wake_btn:  "👨‍👩‍👧 Parent Override",
  },
  ne: {
    sleep_title: "सुत्ने समय आयो! 🌙",
    sleep_desc:  "हाम्रो साथी सुत्न लागेको छ। भोलि फेरि भेटौँला!",
    fog_prompt:  "कुहिरो पुछेर आफ्नो अनुहार हेर्नुस्! ✨",
    fog_done:    "वाह! नमस्ते! 👋",
    steps: [
      { q:"आज हामी कहाँ छौँ?",              o1:"🏫", o2:"🏠", l1:"स्कूल",    l2:"घर",        cat:"sel"  },
      { q:"तिमी कसरी आयौ?",                 o1:"🚌", o2:"🚗", l1:"बस",       l2:"कार",       cat:"motor"},
      { q:"अहिले कस्तो महसुस भइरहेको छ?",    o1:"😊", o2:"😴", l1:"खुसी",     l2:"निन्द्रा",    cat:"sel"  },
      { q:"'A' अक्षर फेला पार्नुस्!",          o1:"🅰️", o2:"🅱️", l1:"A",        l2:"B",         cat:"cog"  },
      { q:"रातो रङ कुन हो?",                  o1:"❤️", o2:"💙", l1:"रातो",     l2:"नीलो",      cat:"cog"  },
      { q:"दिमागी विराम! एउटा छान्नुस्!",       o1:"🌳", o2:"🐸", l1:"तन्काउने", l2:"उफ्रिने",   cat:"motor"},
      { q:"नेपाली: 'अ' अम्बाको लागि!",          o1:"अ",  o2:"आ", l1:"अ",         l2:"आ",          cat:"cog"  },
      { q:"नेपाली: 'क' कुकुरको लागि!",          o1:"क",  o2:"ख", l1:"क",         l2:"ख",          cat:"cog"  },
      { q:"एउटा मात्र भएको कुन हो?",            o1:"☀️", o2:"⭐⭐⭐",l1:"एक",   l2:"तीन",       cat:"cog"  },
      { q:"अङ्क एक (१) फेला पार्नुस्!",          o1:"🎈", o2:"🎈🎈",l1:"१",       l2:"२",          cat:"cog"  },
      { q:"खाजामा के खाने?",                   o1:"🍎", o2:"🍕", l1:"स्याउ",    l2:"पिज्जा",    cat:"sel"  },
      { q:"'म्वाँइँ' भन्ने जनावर कुन हो?",       o1:"🐄", o2:"🐶", l1:"गाई",      l2:"कुकुर",     cat:"cog"  },
      { q:"कोर्न के चाहिन्छ?",                  o1:"🖍️", o2:"🔨", l1:"क्रेयन",   l2:"हथौडा",     cat:"motor"},
      { q:"खेलौना कहाँ राख्ने?",                o1:"🧺", o2:"🗑️", l1:"टोकरी",    l2:"डस्टबिन",   cat:"motor"},
      { q:"आजको दिन कस्तो रह्यो?",             o1:"⭐", o2:"💤", l1:"राम्रो!",   l2:"थकाइलाग्यो",cat:"sel"  },
    ],
    cheers: ["अद्भुत! 🎉","सुपर! ⭐","वाह! 🌟","शानदार! 🦋","तिमी उत्तम छौ! 🚀","एकदम सही! 🌈","बढिया! 🎊"],
    parent_title:    "अभिभावक ड्यासबोर्ड",
    parent_gate_q:   "अनलक गर्न हल गर्नुस्:",
    parent_gate_btn: "प्रमाणित गर्नुस्",
    parent_cancel:   "रद्द गर्नुस्",
    parent_resume:   "खेल जारी राख्नुस्",
    parent_motor:    "हस्तकला सीप",
    parent_cog:      "बौद्धिक मिलान",
    parent_sel:      "सामाजिक र भावनात्मक",
    parent_bridge:   "आजको वास्तविक मिसन:",
    parent_print:    "अभ्यास पुस्तिका प्रिन्ट गर्नुस् 🖨️",
    parent_premium:  "प्रिमियम वर्कबुक अनलक गर्नुस्",
    badge_first:  "पहिलो साहस",
    badge_fast:   "छिटो सिकारु",
    badge_motor:  "व्यस्त हात",
    badge_cog:    "दिमागी तारा",
    badge_sel:    "दयालु मन",
    badge_full:   "सब सकियो!",
    bridges: [
      "घरमा ३ वटा रातो वस्तु खोज्नुस्!",
      "सँगै अक्षरमाला भन्नुस्!",
      "औँलाले हावामा 'A' कोर्नुस्!",
      "खेलौना गन्नुस्: एक, दुई, तीन!",
      "सँगै जनावरको आवाज निकाल्नुस्!",
      "सिरानीहरू ब्लकजस्तै थुपार्नुस्!",
    ],
    wake_btn: "👨‍👩‍👧 अभिभावक ओभरराइड",
  }
};

/* ─────────────────────────────────────────────────────────────────
   GLOBAL STATE STORE
───────────────────────────────────────────────────────────────── */
class Store {
  #s; #subs = [];
  constructor(init) { this.#s = init; }
  get()             { return this.#s; }
  set(patch)        { this.#s = {...this.#s, ...patch}; this.#subs.forEach(f => f(this.#s)); }
  sub(fn)           { this.#subs.push(fn); return () => { this.#subs = this.#subs.filter(f=>f!==fn); }; }
}

export const store = new Store({
  view:    'attendance',   // 'attendance' | 'game' | 'parent'
  lang:    'en',
  timer:   1080,           // 18 min in seconds
  step:    0,
  scores:  { motor:0, cog:0, sel:0 },
  badges:  [],
  history: [],
  isPremium: false,
});

/* ─────────────────────────────────────────────────────────────────
   WEB AUDIO SYNTHESIZER  (zero asset, procedural sounds)
───────────────────────────────────────────────────────────────── */
let _ac = null;
function getAC() {
  if (!_ac) _ac = new (window.AudioContext || window.webkitAudioContext)();
  if (_ac.state === 'suspended') _ac.resume();
  return _ac;
}

export const Audio = {
  _tone(freq, type='sine', dur=0.15, vol=0.13, t0=0) {
    try {
      const ac = getAC(), t = ac.currentTime + t0;
      const o = ac.createOscillator(), g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.type = type; o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.start(t); o.stop(t + dur);
    } catch(_) {}
  },
  pop()     { this._tone(660,'sine',.1,.14); this._tone(880,'sine',.08,.12,.04); },
  correct() { [523,659,784,1047].forEach((f,i)=>this._tone(f,'sine',.2,.11,i*.07)); },
  wrong()   { this._tone(220,'sawtooth',.18,.09); this._tone(180,'sawtooth',.15,.07,.1); },
  fog(y)    {
    const scale=[261,294,330,392,440,523,587,659];
    const idx=Math.min(Math.floor((1-y/window.innerHeight)*scale.length),scale.length-1);
    this._tone(scale[idx],'triangle',.22,.1);
  },
  lullaby() { [392,440,349,294].forEach((f,i)=>this._tone(f,'sine',.65,.07,i*.4)); },
  chime()   { [800,1000,1200].forEach((f,i)=>this._tone(f,'sine',.3,.08,i*.12)); },
};

/* ─────────────────────────────────────────────────────────────────
   PARTICLE ENGINE  (canvas, 60 FPS)
───────────────────────────────────────────────────────────────── */
const pCanvas = document.getElementById('particle-canvas');
const pCtx    = pCanvas.getContext('2d');
let particles = [];

class Particle {
  constructor(x,y,col) {
    this.x=x; this.y=y;
    this.vx=(Math.random()-.5)*11;
    this.vy=(Math.random()-.5)*11-3;
    this.r=Math.random()*6+3;
    this.op=1;
    this.decay=Math.random()*.028+.018;
    this.col=col||`hsla(${Math.random()*360|0},95%,65%,1)`;
    this.shape=Math.random()>.5?'circle':'star';
  }
  update() { this.x+=this.vx; this.y+=this.vy; this.vy+=.18; this.op-=this.decay; }
  draw(ctx) {
    ctx.save(); ctx.globalAlpha=Math.max(0,this.op);
    if(this.shape==='star') {
      ctx.fillStyle=this.col;
      ctx.font=`${this.r*2.5}px Arial`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('⭐',this.x,this.y);
    } else {
      ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2);
      ctx.fillStyle=this.col; ctx.fill();
    }
    ctx.restore();
  }
}

export function burst(x, y, count=22, col) {
  for(let i=0;i<count;i++) particles.push(new Particle(x,y,col));
}

function resizePC() { pCanvas.width=window.innerWidth; pCanvas.height=window.innerHeight; }
window.addEventListener('resize', resizePC);
resizePC();

(function particleLoop() {
  pCtx.clearRect(0,0,pCanvas.width,pCanvas.height);
  particles = particles.filter(p=>p.op>0);
  particles.forEach(p=>{ p.update(); p.draw(pCtx); });
  requestAnimationFrame(particleLoop);
})();

/* ─────────────────────────────────────────────────────────────────
   SPEECH NARRATOR  (Web Speech API)
───────────────────────────────────────────────────────────────── */
export function speak(text, lang='en') {
  if(!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang  = lang==='ne' ? 'ne-NP' : 'en-US';
  u.rate  = 0.82;
  u.pitch = 1.28;
  window.speechSynthesis.speak(u);
}

/* ─────────────────────────────────────────────────────────────────
   CELEBRATION POPUP
───────────────────────────────────────────────────────────────── */
export function celebrate(x,y,text) {
  const el = document.createElement('div');
  el.className='celeb';
  el.style.cssText=`left:${x-60}px;top:${y-40}px;font-size:clamp(1.6rem,5vw,2.4rem);color:var(--yellow);`;
  el.textContent=text;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),1600);
}

/* ─────────────────────────────────────────────────────────────────
   ROUTER  (swaps views with CSS transitions)
───────────────────────────────────────────────────────────────── */
const views = {};
function registerView(name, el) { views[name]=el; }

function showView(name) {
  Object.entries(views).forEach(([n,el])=>{
    el.classList.toggle('hidden', n!==name);
  });
}

store.sub(s => showView(s.view));

/* ─────────────────────────────────────────────────────────────────
   SESSION CHRONOMETER  (18-minute safety timer)
───────────────────────────────────────────────────────────────── */
const timerEl   = document.getElementById('hud-timer');
const sunsetEl  = document.getElementById('sunset');
const sleepEl   = document.getElementById('sleep');
const sleepTitle= document.getElementById('sleep-title');
const sleepDesc = document.getElementById('sleep-desc');

function formatTime(s) {
  return `⏰ ${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}

function updateSleepText() {
  const L = LANG[store.get().lang];
  sleepTitle.textContent = L.sleep_title;
  sleepDesc.textContent  = L.sleep_desc;
}

let timerInterval = null;
function startTimer() {
  if(timerInterval) return;
  timerInterval = setInterval(()=>{
    const s = store.get();
    if(s.view==='parent') return;
    const t = s.timer - 1;
    store.set({timer:t});
    timerEl.textContent = formatTime(t);

    if(t===120) sunsetEl.classList.add('on');   // sunset at 2 min left
    if(t<=0)    triggerSleep();
  },1000);
}

function triggerSleep() {
  clearInterval(timerInterval); timerInterval=null;
  updateSleepText();
  sleepEl.classList.add('on');
  Audio.lullaby();
  ParentSync.flush(store.get());
}

export function wakeFromSleep() {
  sleepEl.classList.remove('on');
  sunsetEl.classList.remove('on');
  store.set({timer:1080});
  timerEl.textContent = formatTime(1080);
  startTimer();
}

/* ─────────────────────────────────────────────────────────────────
   LANGUAGE TOGGLE
───────────────────────────────────────────────────────────────── */
const langBtn = document.getElementById('lang-btn');
export function toggleLang() {
  const nl = store.get().lang==='en' ? 'ne' : 'en';
  store.set({lang:nl});
  langBtn.textContent = nl==='en' ? '🌐 EN' : '🌐 नेपाली';
  // re-render current view
  const v = store.get().view;
  if(v==='game') GameView.refresh();
}

/* ─────────────────────────────────────────────────────────────────
   NAVIGATION HELPERS
───────────────────────────────────────────────────────────────── */
export function goTo(view) { store.set({view}); }
export function goParent() { store.set({view:'parent'}); }

document.getElementById('parent-btn').addEventListener('click', ()=>goParent());

/* ─────────────────────────────────────────────────────────────────
   BOOTSTRAP
───────────────────────────────────────────────────────────────── */
async function boot() {
  // Init storage
  await Storage.init();

  // Restore saved state if any
  const saved = Storage.get('skz_state');
  if(saved) {
    try {
      const p = JSON.parse(saved);
      store.set({ scores:p.scores||{motor:0,cog:0,sel:0}, badges:p.badges||[], history:p.history||[] });
    } catch(_) {}
  }

  // Build app shell
  const app = document.getElementById('app');
  app.innerHTML = '';

  // Create views
  const attEl = AttendanceView.create();
  const gameEl = GameView.create();
  const parEl  = ParentView.create();

  registerView('attendance', attEl);
  registerView('game',       gameEl);
  registerView('parent',     parEl);

  app.appendChild(attEl);
  app.appendChild(gameEl);
  app.appendChild(parEl);

  // Show initial view
  showView('attendance');

  // Start session timer
  startTimer();

  // Expose global API (for onclick handlers in HTML)
  window.__SKZ = { toggleLang, goParent, wakeFromSleep };

  // Dismiss splash
  setTimeout(()=>{
    const splash = document.getElementById('splash');
    splash.classList.add('out');
    setTimeout(()=>splash.remove(),800);

    // Welcome narration
    const L = LANG[store.get().lang];
    speak(L.fog_prompt, store.get().lang);
  }, 900);
}

window.addEventListener('DOMContentLoaded', boot);
