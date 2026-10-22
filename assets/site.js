/* Vitor Gorla — shared site behaviour (index.html + services.html) */

/* ── Contact config: fill these in and every WhatsApp / booking button goes live ── */
const WHATSAPP_NUMBER = '';   // international format, digits only, e.g. '4915112345678'
const BOOKING_URL = '';       // e.g. 'https://cal.com/vitorgorla/30min'
const FALLBACK_CONTACT = 'index.html#contact';

const html = document.documentElement;
const lang = () => html.lang;

/* ── Language ── */
function setLang(l) {
  html.lang = l;
  try { localStorage.setItem('lang', l); } catch (_) { /* private mode: choice just isn't remembered */ }
  document.querySelectorAll('.lang button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.set === l)));
  const t = html.dataset[l === 'de' ? 'titleDe' : 'titleEn'];
  if (t) document.title = t;
  document.querySelectorAll('[data-ph-de]').forEach(el => { el.placeholder = el.dataset[l === 'de' ? 'phDe' : 'phEn']; });
  syncContactLinks();
}
document.querySelectorAll('.lang button').forEach(b => b.addEventListener('click', () => setLang(b.dataset.set)));

/* ── WhatsApp + booking links ── */
let quizText;
function syncContactLinks() {
  const hello = lang() === 'de' ? 'Hallo Vitor, ich interessiere mich für eine Website.' : "Hi Vitor, I'm interested in a website.";
  document.querySelectorAll('[data-wa]').forEach(a => {
    const text = a.hasAttribute('data-wa-quiz') && quizText ? quizText : hello;
    a.href = WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}` : FALLBACK_CONTACT;
    if (WHATSAPP_NUMBER) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
  });
  document.querySelectorAll('[data-book]').forEach(a => {
    a.href = BOOKING_URL || FALLBACK_CONTACT;
    if (BOOKING_URL) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
  });
}

/* ── Mobile nav ── */
(function () {
  const ham = document.getElementById('ham');
  const nav = document.getElementById('mobNav');
  if (!ham || !nav) return;
  const set = open => {
    ham.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
    nav.inert = !open;
    document.body.style.overflow = open ? 'hidden' : '';
  };
  nav.inert = true;
  ham.addEventListener('click', () => set(!nav.classList.contains('open')));
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => set(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
})();

/* ── Belt stripes: one tape stripe per quarter of the page scrolled ── */
(function () {
  const stripes = [...document.querySelectorAll('.stripes i')];
  if (!stripes.length) return;
  let queued = false;
  const update = () => {
    queued = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    const earned = max > 0 ? Math.floor((scrollY / max) * 4 + 0.02) : 4;
    stripes.forEach((s, i) => s.classList.toggle('on', i < earned));
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  update();
})();

/* ── Contact form (Formspree, AJAX) ── */
(function () {
  const form = document.getElementById('contactForm');
  if (!form) return;
  const done = document.getElementById('formDone');
  const err = document.getElementById('formError');
  const btn = form.querySelector('button[type="submit"]');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    btn.disabled = true;
    err.hidden = true;
    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`Formspree responded ${res.status}`);
      form.hidden = true;
      done.hidden = false;
      done.focus();
    } catch (_) {
      err.hidden = false;
      btn.disabled = false;
    }
  });
})();

/* ── Services quiz: each answer gets a reply "from me" ──
   Replies live in the HTML (<div id="replies">), one <p> per language,
   so the language toggle also switches bubbles that are already shown. */
(function () {
  const quiz = document.getElementById('quiz');
  if (!quiz) return;
  const msgs = document.getElementById('msgs');
  const replies = document.getElementById('replies');
  const cta = document.getElementById('quizCta');
  const steps = [...quiz.querySelectorAll('.q-step')];
  const state = {};
  let prevKeys = [];

  const reply = key => [...replies.querySelectorAll(`[data-reply="${key}"]`)].map(p => {
    const m = p.cloneNode(true);
    m.className = 'msg';
    return m;
  });

  const recommend = () =>
    state.goal === 'fix' ? 'rec-maintain' : state.care === 'no' ? 'rec-deliver' : 'rec-build-maintain';

  function summary() {
    const label = name => quiz.querySelector(`input[name="${name}"]:checked`)
      ?.closest('.opt').querySelector(`[data-l="${lang()}"]`)?.textContent.trim() || '-';
    return lang() === 'de'
      ? `Hallo Vitor! Ich habe dein Quiz gemacht.\nZiel: ${label('goal')}\nAktuelle Website: ${label('site')}\nWartung: ${label('care')}`
      : `Hi Vitor! I took your quiz.\nGoal: ${label('goal')}\nCurrent website: ${label('site')}\nMaintenance: ${label('care')}`;
  }

  function render() {
    const complete = Boolean(state.goal && state.site && state.care);
    const keys = ['hello', ...['goal', 'site', 'care'].filter(k => state[k]).map(k => `${k}-${state[k]}`)];
    if (complete) keys.push(recommend());
    // replies already on screen stay still; only new or changed ones pop
    const firstNew = keys.findIndex((k, i) => k !== prevKeys[i]);
    msgs.replaceChildren(...keys.flatMap((k, i) => reply(k).map(m => {
      if (firstNew === -1 || i < firstNew) m.style.animation = 'none';
      return m;
    })));
    prevKeys = keys;
    steps.forEach((s, i) => { s.hidden = i > 0 && !state[steps[i - 1].dataset.key]; });
    cta.hidden = !complete;
    quizText = complete ? summary() : undefined;
    syncContactLinks();
  }

  quiz.addEventListener('change', e => {
    state[e.target.name] = e.target.value;
    render();
    const next = steps.find(s => !s.hidden && !state[s.dataset.key]);
    if (next && matchMedia('(max-width: 859px)').matches) next.scrollIntoView({ block: 'center', behavior: 'smooth' });
  });
  document.querySelectorAll('.lang button').forEach(b => b.addEventListener('click', render));
  render();
})();

setLang(lang() === 'de' ? 'de' : 'en');
document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
