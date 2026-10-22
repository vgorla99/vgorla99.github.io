/* Vitor Gorla — shared site behaviour (index.html + services.html) */

/* ── Contact: every WhatsApp and call-back button uses this number ── */
const WHATSAPP_NUMBER = '4915906448571';   // international format, digits only

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

/* ── WhatsApp links: [data-wa] says hello, [data-call] asks for a call back ── */
let quizText;
function syncContactLinks() {
  const de = lang() === 'de';
  const hello = de ? 'Hallo Vitor, ich interessiere mich für eine Website.' : "Hi Vitor, I'm interested in a website.";
  const call = de ? 'Hallo Vitor, bitte ruf mich wegen einer Website zurück. Am besten erreichbar: ' : 'Hi Vitor, please call me back about a website. Best time to reach me: ';
  const link = (a, text) => {
    a.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  };
  document.querySelectorAll('[data-wa]').forEach(a => link(a, a.hasAttribute('data-wa-quiz') && quizText ? quizText : hello));
  document.querySelectorAll('[data-call]').forEach(a => link(a, quizText ? `${quizText}\n\n${call}` : call));
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

/* ── Motion & depth ──
   One rAF-throttled scroll loop drives: belt stripes (one per quarter of the page),
   the fixed background layers (--sy), giant section words (--py) and parallax layers (--dy). */
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;
html.classList.add('js');

(function () {
  const depth = document.createElement('div');
  depth.className = 'depth';
  depth.setAttribute('aria-hidden', 'true');
  depth.innerHTML = '<div class="depth-glow depth-glow--mat"></div><div class="depth-glow depth-glow--red"></div><div class="depth-mat"></div><div class="depth-spot"></div><div class="depth-grain"></div>';
  document.body.prepend(depth);

  const stripes = [...document.querySelectorAll('.stripes i')];
  const words = [...document.querySelectorAll('.sec[data-bg]')];
  // [element, depth factor, element whose position is measured]
  const layers = [
    ...[...document.querySelectorAll('.shot-phone')].map(el => [el, -0.14, el.parentElement]),
    ...[...document.querySelectorAll('.fan figure')].map((el, i) => [el, [0.10, -0.06, 0.16][i] ?? 0, el.parentElement]),
  ];

  let queued = false;
  const update = () => {
    queued = false;
    const vh = innerHeight;
    const max = document.documentElement.scrollHeight - vh;
    const earned = max > 0 ? Math.floor((scrollY / max) * 4 + 0.02) : 4;
    stripes.forEach((s, i) => s.classList.toggle('on', i < earned));
    if (calm) return;
    html.style.setProperty('--sy', scrollY.toFixed(1));
    const offset = el => { const r = el.getBoundingClientRect(); return r.bottom < -200 || r.top > vh + 200 ? null : r.top + r.height / 2 - vh / 2; };
    words.forEach(s => { const o = offset(s); if (o !== null) s.style.setProperty('--py', (o * -0.22).toFixed(1)); });
    layers.forEach(([el, f, ref]) => { const o = offset(ref); if (o !== null) el.style.setProperty('--dy', (o * f).toFixed(1)); });
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  update();

  if (calm || !finePointer) return;
  // background spotlight + glow drift follow the pointer
  addEventListener('pointermove', e => {
    html.style.setProperty('--mx', `${e.clientX}px`);
    html.style.setProperty('--my', `${e.clientY}px`);
    html.style.setProperty('--mxn', (e.clientX / innerWidth - 0.5).toFixed(3));
  }, { passive: true });
})();

/* ── Steppers ([data-steps="<default index>"]) ──
   Desktop: the active item follows the pointer (and keyboard focus).
   Mobile: the list pins below the nav and slides sideways one item per ~55vh of scroll,
   then releases and the page continues. Wrapped as .pin > .pin-stick > list + dots. */
(function () {
  const mobile = matchMedia('(max-width: 859px)');
  const pins = [...document.querySelectorAll('[data-steps]')].map(list => {
    const items = [...list.children];
    const pin = document.createElement('div');
    const stick = document.createElement('div');
    const dots = document.createElement('div');
    pin.className = 'pin';
    stick.className = 'pin-stick';
    dots.className = 'pin-dots';
    dots.setAttribute('aria-hidden', 'true');
    items.forEach(() => dots.append(document.createElement('i')));
    // the section heading pins with the list, so each pinned frame reads as a full slide
    const head = list.parentElement.querySelector(':scope > .sec-head');
    list.before(pin);
    pin.append(stick);
    stick.append(...(head ? [head] : []), list, dots);

    const setActive = i => {
      items.forEach((el, j) => el.classList.toggle('is-active', j === i));
      [...dots.children].forEach((d, j) => d.classList.toggle('on', j === i));
    };
    setActive(Number(list.dataset.steps) || 0);
    items.forEach((el, i) => {
      el.addEventListener('pointerenter', () => { if (!mobile.matches) setActive(i); });
      el.addEventListener('focusin', () => setActive(i));
    });
    return { pin, stick, list, items, setActive };
  });
  if (!pins.length) return;

  const layout = () => pins.forEach(p => {
    const on = mobile.matches && !calm;
    p.pin.classList.toggle('is-pinned', on);
    p.list.style.transform = '';
    p.pin.style.height = on ? `${p.stick.offsetHeight + (p.items.length - 1) * innerHeight * 0.55}px` : '';
  });
  let queued = false;
  const scroll = () => {
    queued = false;
    pins.forEach(p => {
      if (!p.pin.classList.contains('is-pinned')) return;
      const stickTop = parseFloat(getComputedStyle(p.stick).top) || 0;
      const range = p.pin.offsetHeight - p.stick.offsetHeight;
      const prog = Math.min(1, Math.max(0, (stickTop - p.pin.getBoundingClientRect().top) / range));
      // snap: each step slides exactly one card into place (CSS eases the move)
      const i = Math.round(prog * (p.items.length - 1));
      const max = p.list.scrollWidth - p.stick.clientWidth;
      p.list.style.transform = `translate3d(${-Math.min(p.items[i].offsetLeft, max)}px, 0, 0)`;
      p.setActive(i);
    });
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(scroll); } };
  layout();
  scroll();
  // heights change once web fonts and images arrive
  document.fonts?.ready.then(() => { layout(); queue(); });
  addEventListener('load', () => { layout(); queue(); });
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', () => { layout(); queue(); });
  document.querySelectorAll('.lang button').forEach(b => b.addEventListener('click', () => { layout(); queue(); }));
})();

/* ── 3D scroll reveal: tag groups, stagger siblings with --i ── */
(function () {
  const groups = ['.sec-head', '.pin-stick', '.rows > .row', '.proof', '.know', '.quiz', '.faq', '.contact-grid', '.final .wrap'];
  const children = { '.proof': '.case', '.know': ':scope > div', '.faq': 'details', '.contact-grid': ':scope > *', '.final .wrap': ':scope > *', '.sec-head': ':scope > *', '.quiz': ':scope > *' };
  const targets = [];
  groups.forEach(sel => document.querySelectorAll(sel).forEach(g => {
    const kids = children[sel] ? [...g.querySelectorAll(children[sel])] : [g];
    kids.forEach((el, i) => { el.setAttribute('data-rv', ''); el.style.setProperty('--i', Math.min(i, 6)); targets.push(el); });
  }));
  if (!('IntersectionObserver' in window)) { targets.forEach(el => el.classList.add('in')); return; }
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  targets.forEach(el => io.observe(el));
})();

/* ── Pointer tilt on hero portrait, phone fan and screenshots ── */
(function () {
  if (calm || !finePointer) return;
  document.querySelectorAll('.portrait, .fan, .shot-frame').forEach(el => {
    el.classList.add('tilt');
    const strength = el.classList.contains('shot-frame') ? 5 : 9;
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateX(${(-y * strength).toFixed(2)}deg) rotateY(${(x * strength).toFixed(2)}deg)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
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

  // Rule: answer 1 unlocks 2, answer 2 unlocks 3. Clicking the selected answer
  // deselects it and clears + re-locks every question after it.
  // `click` (not `change`) because re-clicking a checked radio fires no change.
  quiz.addEventListener('click', e => {
    const input = e.target.closest('input[type="radio"]');
    if (!input) return;
    const k = input.name;
    if (state[k] === input.value) {
      const order = steps.map(s => s.dataset.key);
      order.slice(order.indexOf(k)).forEach(key => {
        delete state[key];
        quiz.querySelectorAll(`input[name="${key}"]`).forEach(i => { i.checked = false; });
      });
    } else {
      state[k] = input.value;
    }
    render();
    const next = steps.find(s => !s.hidden && !state[s.dataset.key]);
    if (next && matchMedia('(max-width: 859px)').matches) next.scrollIntoView({ block: 'center', behavior: 'smooth' });
  });
  document.querySelectorAll('.lang button').forEach(b => b.addEventListener('click', render));
  render();
})();

setLang(lang() === 'de' ? 'de' : 'en');
document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
