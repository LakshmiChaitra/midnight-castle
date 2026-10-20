'use strict';
(() => {
const $ = (id) => document.getElementById(id);
const game = $('game');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const STORE = 'midnight-castle-v1';
const samples = [
  'You are allowed to begin again without pretending the first attempt never mattered.',
  'Somewhere, someone still smiles when they remember a tiny kindness you have already forgotten.',
  'I hope an ordinary Tuesday surprises you with something beautiful. The smallest things count, too.',
  'You do not need a spectacular story to deserve a soft place to land.',
  'The version of you who kept going quietly deserves a little celebration tonight.',
  'If you are between chapters, you are still part of the story. Take your time turning the page.',
  'I used to wait until I felt ready. Then I learned that sometimes ready arrives a little way down the road.',
  'May you find people who make the ordinary parts of your day feel like somewhere you belong.',
  'There is no deadline for becoming someone you feel at home with.',
  'A small good thing happened today. I nearly missed it. This is me reminding us both to look again.',
  'You can love where you have been and still choose somewhere new.',
  'I hope the thing you made just for the joy of it finds its way back into your week.'
].map((text, i) => ({ id: `sample-${i}`, text, sample: true }));
const rewards = [
  { id: 'lantern', cost: 25, icon: '♧', name: 'The wandering lantern', description: 'A tiny golden companion follows you from room to room.' },
  { id: 'stars', cost: 50, icon: '☄', name: 'A sky full of wishes', description: 'Wake the shooting stars. A little meteor shower, whenever you like.' },
  { id: 'roof', cost: 90, icon: '☾', name: 'The door above the stars', description: 'Unlock the secret Moonroof and its final little mystery.' }
];
let stored = {};
try {
  const local = JSON.parse(localStorage.getItem(STORE) || '{}') || {};
  const session = JSON.parse(sessionStorage.getItem(STORE) || '{}') || {};
  stored = (session.updatedAt || 0) > (local.updatedAt || 0) ? session : local;
} catch (_) {}
const initialWritten = Array.isArray(stored.written) ? stored.written.filter(x => x && typeof x.text === 'string' && typeof x.id === 'string' && x.text.trim().length >= 24 && x.text.length <= 500).slice(-100) : [];
const state = {
  read: Array.isArray(stored.read) ? [...new Set(stored.read.filter(x => samples.some(s => s.id === x)))] : [],
  written: initialWritten.filter((x, i, a) => a.findIndex(y => normalize(y.text) === normalize(x.text)) === i),
  redeemed: [], room: 0, hints: stored.hints !== false
};
const allEarned = () => state.read.length * 5 + state.written.length * 20;
if (Array.isArray(stored.redeemed)) {
  let funds = allEarned();
  for (const id of [...new Set(stored.redeemed)]) { const reward = rewards.find(x => x.id === id); if (reward && funds >= reward.cost) { state.redeemed.push(id); funds -= reward.cost; } }
}
const balance = () => allEarned() - rewards.filter(x => state.redeemed.includes(x.id)).reduce((sum, x) => sum + x.cost, 0);
const has = id => state.redeemed.includes(id);
const rooms = [
  { name: 'The Moonlit Gate', chapter: 'I / THE ARRIVAL', title: 'Some places find you.', description: "Beyond this door, someone's words might be waiting for you.", asset: 'castle', objects: [
    { id: 'gate-letter', x: 20.5, y: 63, icon: '✉', label: 'A LETTER FOR YOU', kind: 'post', title: 'A letter on the parapet.', description: 'No address. No name. Just a small wax seal, still warm in the moonlight.' },
    { id: 'castle-door', x: 50, y: 48, icon: '⌁', label: 'ENTER THE CASTLE', kind: 'door', title: 'The door is already open.', description: 'The castle has a habit of knowing when someone is on their way.' },
    { id: 'gate-chest', x: 82, y: 61, icon: '✦', label: "THE KEEPER'S CHEST", kind: 'rewards', title: "The keeper's chest.", description: 'Here, a few kind words can become something magical.' }
  ]},
  { name: 'The Whispering Archive', chapter: 'II / WORDS THAT FOUND THEIR WAY', title: 'Every drawer, a little world.', description: 'Open an envelope. Leave something in return. Nobody needs to know your name.', asset: 'archive', objects: [
    { id: 'archive-envelope', x: 36.5, y: 60, icon: '✉', label: 'THE NAMELESS POST', kind: 'post', title: 'An envelope, waiting.', description: 'Someone left a little light here. You can borrow it for a moment, or leave one of your own.' },
    { id: 'archive-drawers', x: 59, y: 45, icon: '▤', label: 'THE LETTER DRAWER', kind: 'drawer', title: 'The drawer of almost-strangers.', description: 'It opens with the softest sound. Inside: words looking for someone who needs them.' },
    { id: 'archive-orchard', x: 53, y: 64, icon: '❋', label: 'A BOTTLED AFTERNOON', kind: 'memory', title: 'An afternoon that never ended.', description: 'Grass-stained knees. A ceiling fan turning slowly. Someone calling you by a name only they used. The bottle smells like the summer you thought would last forever.' },
    { id: 'archive-dream', x: 85, y: 61, icon: '☾', label: 'A SLEEPING DREAM', kind: 'dream', title: 'Please don’t wake it.', description: 'A tiny dream sleeps inside a teacup. It looks like a house with all the lights on, and everyone you love already inside.' }
  ]},
  { name: 'The Starlit Observatory', chapter: 'III / WHAT WE SEND INTO THE NIGHT', title: 'The stars are listening.', description: 'A desk for the things you want to say. A whole sky to hold them.', asset: 'observatory', objects: [
    { id: 'observatory-desk', x: 30, y: 70, icon: '✎', label: 'LEAVE A LITTLE LIGHT', kind: 'write', title: 'The midnight writing desk.', description: 'The ink never runs out. Write the words you wish someone had told you.' },
    { id: 'observatory-orb', x: 59, y: 49, icon: '✧', label: 'A MESSAGE IN THE STARS', kind: 'post', title: 'A thought, caught in starlight.', description: 'The glass is full of borrowed constellations. Somewhere inside is a letter for you.' },
    { id: 'observatory-scope', x: 75, y: 45, icon: '☄', label: 'MAKE THE SKY MOVE', kind: 'telescope', title: 'A telescope for wishes.', description: 'Some nights need one more shooting star. The keeper knows how to wake them.' }
  ]},
  { name: 'The Secret Moonroof', chapter: 'IV / YOU LEFT THE WORLD A LITTLE LIGHTER', title: 'Look what your kindness opened.', description: 'No clocks. No expectations. Just you, the sky, and the light you left behind.', asset: 'roof', objects: [
    { id: 'roof-stars', x: 55, y: 40, icon: '✦', label: 'A SKY FULL OF WISHES', kind: 'sky', title: 'The castle saved you a sky.', description: 'Every little light matters. Even the ones nobody saw you leave.' },
    { id: 'roof-note', x: 30, y: 70, icon: '✎', label: 'ONE MORE LITTLE LIGHT', kind: 'write', title: 'One more note to the world.', description: 'You made it somewhere lovely. Leave a little of it here for the next person.' }
  ]}
];
const images = {};
for (const name of ['castle', 'archive', 'observatory', 'roof']) { const img = new Image(); img.src = `../assets/${name}.jpg`; img.onload = placeHotspots; images[name] = img; }
let currentLetter = null, previousLetter = null, toastTimer, transitionBusy = false, particles = [], meteors = [], burst = [];
function normalize(text) { return text.trim().toLowerCase().replace(/\s+/g, ' '); }
function save() {
  state.updatedAt = Date.now();
  const snapshot = JSON.stringify(state);
  let saved = false;
  try { localStorage.setItem(STORE, snapshot); saved = true; } catch (_) {}
  try { sessionStorage.setItem(STORE, snapshot); saved = true; } catch (_) {}
  if (!saved) toast('This browser could not save progress. You can still play this session.');
}
function toast(text) { $('toast').textContent = text; $('toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 4000); }
function modal(id) { document.querySelectorAll('dialog[open]').forEach(d => d.close()); $(id).showModal(); }
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', e => { if (e.target !== dialog) return; const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); }));
function renderHud() {
  $('balance').textContent = balance(); $('reward-balance').textContent = balance();
  $('journal-count').textContent = String(state.read.length + state.written.length).padStart(2, '0');
  $('companion').hidden = !has('lantern'); game.classList.toggle('hints-off', !state.hints);
  $('toggle-hints').setAttribute('aria-pressed', String(state.hints));
  $('toggle-hints').innerHTML = `<span class="hint-dot"></span>OBJECT HINTS ${state.hints ? 'ON' : 'OFF'}`;
}
function enterRoom(index, animate = true) {
  if (transitionBusy || index < 0 || index > 3) return;
  if (index === 3 && !has('roof')) { renderRewards(); modal('rewards-dialog'); return; }
  state.room = index;
  const update = () => {
    const room = rooms[index];
    $('scene-art').style.backgroundImage = `url("../assets/${room.asset}.jpg")`;
    game.classList.toggle('sky-room', index === 3);
    $('room-name').textContent = room.name; $('room-chapter').textContent = room.chapter;
    $('room-title').textContent = room.title; $('room-description').textContent = room.description;
    $('move-left').disabled = index === 0; $('move-right').disabled = index === 3;
    $('left-label').textContent = index ? ['THE GATE', 'THE ARCHIVE', 'OBSERVATORY'][index - 1] : '';
    $('right-label').textContent = ['THE ARCHIVE', 'OBSERVATORY', has('roof') ? 'THE MOONROOF' : 'LOCKED ROOF', ''][index];
    document.querySelectorAll('.room-dots i').forEach((dot, i) => dot.classList.toggle('active', i === index));
    $('hotspots').replaceChildren();
    for (const object of room.objects) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'hotspot';
      button.style.width = '12%'; button.style.height = '17%'; button.dataset.object = object.id; button.setAttribute('aria-label', object.label);
      const ring = document.createElement('span'); ring.className = 'hotspot-ring'; ring.textContent = object.icon; ring.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span'); label.className = 'hotspot-label'; label.textContent = object.label;
      button.append(ring, label); button.addEventListener('click', () => interact(object)); $('hotspots').append(button);
    }
    placeHotspots(); renderHud(); if (animate) save();
  };
  if (!animate || reduceMotion.matches) { update(); return; }
  transitionBusy = true;
  const flash = $('room-flash');
  flash.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, fill: 'forwards' }).finished.then(() => {
    update(); flash.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 650, fill: 'forwards' }).finished.then(() => transitionBusy = false);
  });
}
function placeHotspots() {
  const rect = $('scene').getBoundingClientRect(), img = images[rooms[state.room].asset];
  const iw = img?.naturalWidth || 1664, ih = img?.naturalHeight || 941;
  const scale = Math.max(rect.width / iw, rect.height / ih), width = iw * scale, height = ih * scale;
  for (const [i, button] of [...$('hotspots').children].entries()) {
    const o = rooms[state.room].objects[i];
    button.style.setProperty('--x', ((o.x / 100 * width - (width - rect.width) / 2) / rect.width * 100));
    button.style.setProperty('--y', ((o.y / 100 * height - (height - rect.height) / 2) / rect.height * 100));
  }
}
function objectButton(text, handler, secondary = false) { const button = document.createElement('button'); button.type = 'button'; button.className = secondary ? 'secondary-button' : 'gold-button'; button.textContent = text; button.addEventListener('click', handler); $('object-options').append(button); }
function interact(object) {
  if (object.kind === 'door') { enterRoom(1); return; }
  if (object.kind === 'write') { openWrite(); return; }
  if (object.kind === 'rewards') { renderRewards(); modal('rewards-dialog'); return; }
  $('object-icon').textContent = object.icon; $('object-code').textContent = `${rooms[state.room].name.toUpperCase()} / A CURIOSITY`;
  $('object-title').textContent = object.title; $('object-description').textContent = object.description; $('object-options').replaceChildren();
  if (['post', 'drawer'].includes(object.kind)) { objectButton('OPEN A RANDOM LETTER · +5 ✦', () => openLetter()); objectButton('LEAVE A NAMELESS LETTER · +20 ✦', openWrite, true); }
  if (object.kind === 'memory') { objectButton('LEAVE SOMEONE A GOOD MEMORY · +20 ✦', openWrite); objectButton('LET A LETTER FIND ME ↗', openLetter, true); }
  if (object.kind === 'dream') { objectButton('LEAVE A WISH FOR A STRANGER · +20 ✦', openWrite); objectButton('LET IT SLEEP ↶', () => $('object-dialog').close(), true); }
  if (object.kind === 'telescope' || object.kind === 'sky') {
    if (has('stars') || object.kind === 'sky') objectButton('SEND THE STARS WANDERING ↗', () => { $('object-dialog').close(); meteorShower(); toast('Somewhere, someone is making a wish.'); });
    else objectButton('VISIT THE KEEPER’S EXCHANGE ↗', () => { renderRewards(); modal('rewards-dialog'); });
    objectButton('READ A LITTLE LIGHT ↗', openLetter, true);
  }
  modal('object-dialog');
}
function openLetter() {
  const pool = [...samples, ...state.written.map(x => ({ ...x, sample: false }))];
  const unseen = pool.filter(x => x.sample && !state.read.includes(x.id) && x.id !== previousLetter);
  const choices = unseen.length ? unseen : pool.filter(x => x.id !== previousLetter);
  currentLetter = choices[Math.floor(Math.random() * choices.length)] || pool[0]; previousLetter = currentLetter.id;
  $('letter-origin').textContent = currentLetter.sample ? 'SAMPLE LETTER' : 'YOUR LOCAL LETTER';
  $('sealed-letter').hidden = false; $('opened-letter').hidden = true; modal('letter-dialog');
}
$('break-seal').addEventListener('click', () => {
  if (!currentLetter || !$('opened-letter').hidden) return;
  $('sealed-letter').hidden = true; $('opened-letter').hidden = false; $('letter-body').textContent = currentLetter.text;
  if (currentLetter.sample && !state.read.includes(currentLetter.id)) {
    state.read.push(currentLetter.id); $('read-award').textContent = '+5 ✦ A little light, found.'; renderHud(); save();
  } else $('read-award').textContent = currentLetter.sample ? 'A familiar letter. Still yours to read.' : 'A little light you left here.';
  if (!reduceMotion.matches) document.querySelector('.letter-paper').animate([{ opacity: 0, transform: 'translateY(20px) rotate(-3deg)' }, { opacity: 1, transform: 'translateY(0) rotate(0)' }], { duration: 650, easing: 'cubic-bezier(.2,.7,.2,1)' });
});
$('another-letter').addEventListener('click', openLetter);
function openWrite() { $('write-form').hidden = false; $('seal-success').hidden = true; $('write-error').textContent = ''; modal('write-dialog'); }
$('message').addEventListener('input', () => { $('character-count').textContent = `${$('message').value.length} / 500`; $('write-error').textContent = ''; });
$('write-form').addEventListener('submit', event => {
  event.preventDefault(); const text = $('message').value.trim();
  if (text.length < 24) { $('write-error').textContent = 'Leave at least 24 characters, so your letter has a little room to breathe.'; return; }
  if (state.written.some(x => normalize(x.text) === normalize(text))) { $('write-error').textContent = 'That light is already in the drawer. Try leaving a different thought.'; return; }
  if (state.written.length >= 100) { $('write-error').textContent = 'This playtest drawer has room for 100 letters. You can still read and explore.'; return; }
  state.written.push({ id: crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}-${Math.random().toString(16).slice(2)}`, text, date: Date.now() });
  $('write-form').hidden = true; $('seal-success').hidden = false; $('message').value = ''; $('character-count').textContent = '0 / 500';
  renderHud(); save(); if (!reduceMotion.matches) document.querySelector('.success-seal').animate([{ transform: 'scale(.3) rotate(-60deg)', opacity: 0 }, { transform: 'scale(1) rotate(0)', opacity: 1 }], { duration: 750, easing: 'cubic-bezier(.16,1,.3,1)' });
});
$('write-again').addEventListener('click', openWrite);
function renderRewards() {
  renderHud(); $('reward-list').replaceChildren();
  for (const reward of rewards) {
    const article = document.createElement('article'), art = document.createElement('span'), text = document.createElement('div'), title = document.createElement('h3'), desc = document.createElement('p'), button = document.createElement('button');
    art.className = 'reward-art'; art.textContent = reward.icon; art.setAttribute('aria-hidden', 'true'); title.textContent = reward.name; desc.textContent = reward.description; text.append(title, desc);
    button.className = 'gold-button'; button.type = 'button';
    const owned = has(reward.id);
    button.textContent = owned ? reward.id === 'stars' ? 'WISH AGAIN ↗' : reward.id === 'roof' ? 'VISIT ↗' : 'FOLLOWS YOU ✓' : `${reward.cost} ✦ REDEEM`;
    button.disabled = owned ? reward.id === 'lantern' : balance() < reward.cost;
    button.setAttribute('aria-label', owned ? `${reward.name}: ${button.textContent}` : `Redeem ${reward.name} for ${reward.cost} stardust`);
    button.addEventListener('click', () => {
      if (!has(reward.id)) { if (balance() < reward.cost) return; state.redeemed.push(reward.id); save(); renderHud(); }
      $('rewards-dialog').close();
      if (reward.id === 'stars') { meteorShower(); toast('Your sky is awake. Visit the telescope to call the stars again.'); }
      else if (reward.id === 'roof') { enterRoom(3); meteorShower(); toast('A door opens above the stars. Welcome to the Moonroof.'); }
      else { toast('The wandering lantern has chosen you. It follows wherever you go.'); magicalBurst(innerWidth * .84, innerHeight * .72); }
    });
    article.append(art, text, button); $('reward-list').append(article);
  }
}
function openMap() {
  $('map-rooms').replaceChildren();
  rooms.forEach((room, index) => {
    const button = document.createElement('button'); button.className = `map-room${state.room === index ? ' current' : ''}`; button.type = 'button';
    const code = document.createElement('small'), title = document.createElement('strong'), note = document.createElement('small'), icon = document.createElement('span');
    code.textContent = `0${index + 1} / ${index === 3 && !has('roof') ? 'A SECRET' : state.room === index ? 'YOU ARE HERE' : 'WANDER HERE'}`;
    title.textContent = room.name; note.textContent = index === 3 && !has('roof') ? 'UNLOCK IN THE EXCHANGE · 90 ✦' : ['A LETTER ON THE BRIDGE', 'READ & LEAVE LETTERS', 'WRITE INTO THE NIGHT', 'YOUR UNLOCKED HIDEAWAY'][index];
    icon.textContent = ['⌁', '▤', '☾', '✦'][index]; button.append(code, title, note, icon);
    button.addEventListener('click', () => { $('map-dialog').close(); enterRoom(index); }); $('map-rooms').append(button);
  }); modal('map-dialog');
}
function openJournal() {
  $('stat-read').textContent = state.read.length; $('stat-written').textContent = state.written.length; $('stat-earned').textContent = allEarned(); $('journal-letters').replaceChildren();
  if (!state.written.length) { const p = document.createElement('p'); p.textContent = 'The first page is waiting for you.'; $('journal-letters').append(p); }
  for (const [i, letter] of [...state.written].reverse().entries()) { const article = document.createElement('article'), code = document.createElement('span'), text = document.createElement('p'); code.textContent = `SEALED LETTER ${String(state.written.length - i).padStart(2, '0')} / LEFT BY YOU`; text.textContent = letter.text; article.append(code, text); $('journal-letters').append(article); }
  modal('journal-dialog');
}
$('open-map').addEventListener('click', openMap); $('open-rewards').addEventListener('click', () => { renderRewards(); modal('rewards-dialog'); }); $('open-journal').addEventListener('click', openJournal); $('help').addEventListener('click', () => modal('help-dialog'));
$('toggle-hints').addEventListener('click', () => { state.hints = !state.hints; renderHud(); save(); });
$('move-left').addEventListener('click', () => enterRoom(state.room - 1)); $('move-right').addEventListener('click', () => enterRoom(state.room + 1));
$('fullscreen').addEventListener('click', async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await game.requestFullscreen(); } catch (_) { toast('The game already fills this window. Your browser may limit full screen.'); } });
document.addEventListener('fullscreenchange', () => { $('fullscreen').setAttribute('aria-label', document.fullscreenElement ? 'Exit full screen' : 'Enter full screen'); placeHotspots(); resizeCanvas(); });
document.addEventListener('keydown', event => { if (document.querySelector('dialog[open]') || event.altKey || event.ctrlKey || event.metaKey) return; if (['ArrowLeft', 'a', 'A'].includes(event.key)) { event.preventDefault(); enterRoom(state.room - 1); } if (['ArrowRight', 'd', 'D', 'ArrowUp', 'w', 'W'].includes(event.key)) { event.preventDefault(); enterRoom(state.room + 1); } if (event.key === 'm' || event.key === 'M') openMap(); });
$('scene').addEventListener('pointermove', event => { if (reduceMotion.matches || event.pointerType !== 'mouse') return; const r = game.getBoundingClientRect(); $('scene-art').style.setProperty('--px', `${(event.clientX / r.width - .5) * -7}px`); $('scene-art').style.setProperty('--py', `${(event.clientY / r.height - .5) * -5}px`); }, { passive: true });
game.addEventListener('pointerdown', event => { if (!reduceMotion.matches) { const r = game.getBoundingClientRect(); magicalBurst(event.clientX - r.left, event.clientY - r.top); } });
const canvas = $('magic'), ctx = canvas.getContext('2d'); let cw = 0, ch = 0, lastTime = 0;
function resizeCanvas() { const r = game.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2); cw = r.width; ch = r.height; canvas.width = cw * dpr; canvas.height = ch * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); particles = Array.from({ length: cw < 600 ? 28 : 58 }, () => ({ x: Math.random() * cw, y: Math.random() * ch, radius: .5 + Math.random() * 1.2, speed: 3 + Math.random() * 8, phase: Math.random() * 6.28 })); }
function magicalBurst(x, y) { for (let i = 0; i < 13; i++) burst.push({ x, y, vx: (Math.random() - .5) * 80, vy: (Math.random() - .5) * 80, life: .7 + Math.random() * .5 }); }
function meteorShower() { if (reduceMotion.matches) { toast('A sky full of wishes is yours. Motion is reduced for your settings.'); return; } for (let i = 0; i < 18; i++) meteors.push({ x: Math.random() * cw * 1.4, y: Math.random() * ch * .4 - 100, delay: i * .25, life: 1.3 + Math.random(), speed: 400 + Math.random() * 250 }); }
function draw(time) {
  const dt = Math.min((time - lastTime) / 1000 || .016, .04); lastTime = time; ctx.clearRect(0, 0, cw, ch);
  if (!reduceMotion.matches && !document.hidden) {
    for (const p of particles) { p.y -= p.speed * dt; p.x += Math.sin(time / 1700 + p.phase) * dt * 3; if (p.y < 0) p.y = ch; ctx.globalAlpha = .2 + (Math.sin(time / 1100 + p.phase) + 1) * .22; ctx.fillStyle = state.room === 3 ? '#b8befb' : '#edd5a2'; ctx.shadowColor = '#ffe7ac'; ctx.shadowBlur = 7; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill(); }
    ctx.shadowBlur = 0;
    for (const m of meteors) { m.delay -= dt; if (m.delay > 0) continue; m.x -= m.speed * dt; m.y += m.speed * .55 * dt; m.life -= dt; const gradient = ctx.createLinearGradient(m.x, m.y, m.x + 85, m.y - 47); gradient.addColorStop(0, '#fff1cfff'); gradient.addColorStop(1, '#c5c8ff00'); ctx.strokeStyle = gradient; ctx.lineWidth = 1.8; ctx.globalAlpha = Math.min(1, m.life * 2); ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x + 85, m.y - 47); ctx.stroke(); }
    meteors = meteors.filter(m => m.life > 0);
    for (const p of burst) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = '#ffe6a8'; ctx.font = '15px Georgia'; ctx.fillText('✧', p.x, p.y); }
    burst = burst.filter(p => p.life > 0); ctx.globalAlpha = 1;
  } requestAnimationFrame(draw);
}
window.addEventListener('resize', () => { placeHotspots(); resizeCanvas(); });
enterRoom(0, false); resizeCanvas(); requestAnimationFrame(draw);
})();
