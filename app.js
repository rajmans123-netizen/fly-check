// Fly Check: can I carry this on a flight in India? Scan a power bank, a bottle or a pack (read in this page by ocr.js), or search.
// The rules are in rules.js; nothing is sent anywhere.
import { ITEMS, POPULAR, SOURCES, BATTERY_RULES, byId, search, findItems, verdict, checkBattery, classify } from './rules.js';
import { readText, warmUp } from './ocr.js';
const $ = id => document.getElementById(id);
const store = { get(k, d) { try { const v = localStorage.getItem('fc.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } }, set(k, v) { try { localStorage.setItem('fc.' + k, JSON.stringify(v)); } catch { } } };
const S = { res: null, name: '', text: '', bag: store.get('bag', []), demo: false };
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
function toast(t) { document.querySelector('.toast')?.remove(); const e = el('div', 'toast', t); document.body.append(e); setTimeout(() => e.remove(), 2600); }
function show(id) { for (const s of ['start', 'reading', 'result']) $(s).hidden = s !== id; }
const fmt = n => Math.round(n).toLocaleString('en-IN');
const BADGE = { yes: '✓', no: '✗', limit: '100 ml', ask: '?' };
const BIG = { yes: '✓ Yes', no: '✗ No', limit: '≤100 ml', ask: 'Ask' };
// a check-in limit is the item's own (≤5 L of ghee, a laptop switched off), not the cabin's 100 ml
const tag = (r, k, small) => r[k] === 'limit' && k === 'checkin' ? (r.checkinTag || 'Limit') : (small ? BADGE : BIG)[r[k]];
const ICON = {
  cabin: '<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="9" y="11" width="22" height="25" rx="6" fill="#E6EEFF" stroke="#1D4ED8" stroke-width="2.6"/><path d="M15 11V8.5a2.5 2.5 0 0 1 2.5-2.5h5A2.5 2.5 0 0 1 25 8.5V11M14 20h12" stroke="#1D4ED8" stroke-width="2.6" fill="none" stroke-linecap="round"/></svg>',
  checkin: '<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="7" y="10" width="26" height="22" rx="4" fill="#E6EEFF" stroke="#1D4ED8" stroke-width="2.6"/><path d="M15 10V7h10v3M13 10v22M27 10v22M11 32v3M29 32v3" stroke="#1D4ED8" stroke-width="2.6" fill="none" stroke-linecap="round"/></svg>',
};

// ---------------------------------------------------------------- the answer
const DEF = {
  cabin: { yes: 'Allowed in your cabin bag.', no: 'Not in your cabin bag.', limit: 'Only bottles of 100 ml or less, in one clear 1-litre bag.', ask: 'Depends on the airline: ask before you pack it.' },
  checkin: { yes: 'Allowed in your check-in bag.', no: 'Not in your check-in bag.', limit: 'Allowed, within the limit.', ask: 'Depends on the airline: ask before you pack it.' },
};
function tone(r) {
  if (r.cabin === 'no' && r.checkin === 'no') return 'no';
  if (r.cabin === 'ask' || r.checkin === 'ask' || r.cabin === 'limit') return 'amb';
  if (r.cabin === 'yes' && r.checkin === 'yes') return 'yes';
  return 'mix';
}
export function showResult(r, { name = '', text = '', alts = [] } = {}) {
  S.res = r; S.name = name || r.name || byId(r.id)?.name || 'This item'; S.text = text;
  const a = $('ans'); a.textContent = '';
  const top = el('div', 'top ' + tone(r)); top.append(el('small', '', S.name), el('b', '', r.head)); a.append(top);
  for (const k of ['cabin', 'checkin']) {
    const row = el('div', 'bag'); const ic = el('span'); ic.innerHTML = ICON[k];
    const mid = el('div'); mid.append(el('b', '', k === 'cabin' ? 'Cabin bag' : 'Check-in bag'), el('p', '', (k === 'cabin' ? r.cabinNote : r.checkinNote) || DEF[k][r[k]]));
    row.append(ic, mid, el('span', 'v ' + r[k], tag(r, k))); a.append(row);
  }
  if (r.kind === 'battery') {
    const b = r.b;
    if (b) {
      const m = el('div', 'math'), eq = el('div', 'eq');
      if (b.from === 'wh') eq.append('The label says ', el('em', '', `${b.wh} Wh`));
      else eq.append(`${fmt(b.mah)} mAh × ${b.v} V = `, el('em', '', `${b.wh} Wh`));
      m.append(eq);
      if (b.from === 'mah' && b.vGuess) m.append(el('p', 'mnote', 'Using 3.7 V, the usual voltage of the battery inside.'));
      const mt = el('div', 'meter'); for (const [w, l] of [[0, '0'], [100, '100 Wh'], [160, '160 Wh']]) { const s = el('span', 'lbl', l); s.style.left = (w / 160 * 100) + '%'; mt.append(s); }
      const pin = el('span', 'pin'); pin.style.left = Math.min(100, b.wh / 160 * 100) + '%'; pin.append(el('i', '', b.wh > 160 ? `${b.wh} Wh ›` : `${b.wh} Wh`)); mt.append(pin);
      m.append(mt); a.append(m);
    }
    a.append(el('p', 'why', r.why));
    const ul = el('ul', 'rules'); for (const t of BATTERY_RULES) ul.append(el('li', '', t)); a.append(ul);
  } else a.append(el('p', 'why', r.why));
  // a liquid picked from search (no size read): tap its size for a definite answer
  const it = byId(r.id), sz = $('sizes'); sz.textContent = '';
  sz.hidden = !(it && it.kind === 'liquid' && it.cabin === 'limit' && !r.size && !it.cabinNote);
  if (!sz.hidden) {
    sz.append(el('b', '', 'How big is the bottle or jar?'));
    for (const [ml, label] of [[50, '50 ml'], [100, '100 ml'], [150, '150 ml'], [200, '200 ml'], [500, '500 ml'], [1000, '1 L'], [5000, '5 L']]) {
      const b = el('button', '', label); b.type = 'button'; b.onclick = () => showResult(verdict(it, { ml, label }), { name: `${it.name} · ${label}`, text }); sz.append(b);
    }
  }
  $('tip').hidden = !r.tip; $('tip').textContent = r.tip || '';
  $('alts').hidden = !alts.length; $('alts').textContent = '';
  if (alts.length) { $('alts').append('Not this? It might be: '); for (const it of alts) { const b = el('button', '', it.name); b.type = 'button'; b.onclick = () => showResult(verdict(it, r.size), { text }); $('alts').append(b); } }
  $('readWrap').hidden = !text; $('readText').textContent = text;
  $('addBtn').textContent = inBag(r) ? '✓ In my bag' : '+ My bag';
  renderBag();
  show('result'); if (!S.demo) window.scrollTo({ top: 0, behavior: 'smooth' });
  if (!S.demo && history.state?.v !== 'result') history.pushState({ v: 'result' }, '');
}
const keyOf = r => r.id + (r.b ? ':' + r.b.wh : '') + (r.size ? ':' + r.size.ml : '');
const inBag = r => S.bag.some(x => x.key === keyOf(r));

// ---------------------------------------------------------------- my bag
function renderBag() {
  for (const [wrap, box] of [['bagWrap', 'mybag'], ['bagWrap2', 'mybag2']]) {
    $(wrap).hidden = !S.bag.length; const m = $(box); m.textContent = ''; if (!S.bag.length) continue;
    const cnt = { cabin: 0, checkin: 0, home: 0, ask: 0 };
    for (const x of S.bag) { if (x.cabin === 'no' && x.checkin === 'no') cnt.home++; else if (x.cabin === 'ask' || x.checkin === 'ask') cnt.ask++; else if (x.cabin === 'no') cnt.checkin++; else cnt.cabin++; }
    const sum = el('div', 'sum');
    if (cnt.cabin) sum.append(el('span', 'bd yes', `Cabin bag · ${cnt.cabin}`)); if (cnt.checkin) sum.append(el('span', 'bd limit', `Check-in only · ${cnt.checkin}`));
    if (cnt.home) sum.append(el('span', 'bd no', `Leave at home · ${cnt.home}`)); if (cnt.ask) sum.append(el('span', 'bd ask', `Ask airline · ${cnt.ask}`));
    m.append(sum);
    S.bag.forEach((x, i) => {
      const row = el('div', 'row'), t = el('b', '', x.name); t.append(el('small', '', x.head));
      const del = el('button', '', '×'); del.type = 'button'; del.setAttribute('aria-label', 'Remove ' + x.name); del.onclick = () => { S.bag.splice(i, 1); store.set('bag', S.bag); renderBag(); if (S.res) $('addBtn').textContent = inBag(S.res) ? '✓ In my bag' : '+ My bag'; };
      row.append(t, el('span', 'bd ' + x.cabin, '🎒 ' + tag(x, 'cabin', 1)), el('span', 'bd ' + x.checkin, '🧳 ' + tag(x, 'checkin', 1)), del); m.append(row);
    });
    const liquids = S.bag.filter(x => x.liquid && x.cabin !== 'no').length;
    if (liquids >= 2) m.append(el('p', 'lnote', `All ${liquids} liquids in your cabin bag go together in one clear 1-litre bag.`));
    const acts = el('div', 'bagacts'), sh = el('button', '', 'Share my bag ↗'); sh.type = 'button'; sh.onclick = shareBag;
    const c = el('button', 'clear', 'Clear my bag'); c.type = 'button'; c.onclick = () => { S.bag = []; store.set('bag', S.bag); renderBag(); $('addBtn').textContent = '+ My bag'; };
    acts.append(sh, c); m.append(acts);
  }
}
$('addBtn').onclick = () => {
  const r = S.res; if (!r) return; const key = keyOf(r);
  if (inBag(r)) { S.bag = S.bag.filter(x => x.key !== key); $('addBtn').textContent = '+ My bag'; }
  else { S.bag.push({ key, name: S.name, head: r.head, cabin: r.cabin, checkin: r.checkin, checkinTag: r.checkinTag || null, liquid: r.kind === 'liquid' }); $('addBtn').textContent = '✓ In my bag'; toast('Added. Scan the next thing.'); }
  store.set('bag', S.bag); renderBag();
};

// ---------------------------------------------------------------- search, chips, power bank box
function hitButton(it) {
  const r = verdict(it), b = el('button', 'hit'); b.type = 'button';
  const pair = el('span', 'pair'); pair.append(el('span', 'bd ' + r.cabin, '🎒 ' + tag(r, 'cabin', 1)), el('span', 'bd ' + r.checkin, '🧳 ' + tag(r, 'checkin', 1)));
  b.append(el('b', '', it.name), pair); b.onclick = () => openItem(it); return b;
}
function openItem(it) {
  if (it.kind === 'battery') { const r = checkBattery(null); r.why = 'Type its mAh in the Power bank box (it\'s printed on the back) to see if yours is under the limit.'; showResult(r, { name: it.name }); return; }
  showResult(verdict(it), { name: it.name });
}
$('q').addEventListener('input', () => {
  $('unknown').hidden = true; const h = $('hits'); h.textContent = ''; const q = $('q').value;
  const found = search(q, 6); for (const it of found) h.append(hitButton(it));
  if (q.trim().length >= 3 && !found.length) h.append(el('p', 'sub', 'Not in the list yet. If it\'s a liquid, cream or gel: up to 100 ml in the cabin. Sharp, flammable or a battery? Ask your airline.'));
});
for (const [id, label] of POPULAR) { const it = byId(id), b = el('button', '', label); b.type = 'button'; b.onclick = () => openItem(it); $('chips').append(b); }
function checkMah() {
  const raw = String($('mah').value).toLowerCase().replace(/,/g, '').trim(), n = parseFloat(raw);
  if (/wh/.test(raw) && !/mah/.test(raw) && n > 0 && n < 600) { const b = { wh: Math.round(n * 10) / 10, mah: null, v: 3.7, vGuess: false, from: 'wh' }; showResult(checkBattery(b), { name: `Power bank · ${b.wh} Wh` }); return; }
  const mah = Math.round(/\d\s*k\b/.test(raw) ? n * 1000 : n);     // "20k" = 20,000 mAh
  if (!(mah >= 500 && mah <= 200000)) { toast('Type the mAh printed on it, like 10000 or 20000.'); $('mah').focus(); return; }
  const b = { wh: Math.round(mah * 3.7 / 100) / 10, mah, v: 3.7, vGuess: true, from: 'mah' };
  showResult(checkBattery(b), { name: `Power bank · ${fmt(mah)} mAh` });
}
$('mahGo').onclick = checkMah; $('mah').addEventListener('keydown', e => { if (e.key === 'Enter') checkMah(); });
$('srcs').append(...Object.values(SOURCES).flatMap((s, i) => { const a = el('a', '', s.name); a.href = s.url; a.target = '_blank'; a.rel = 'noopener'; return i ? [' · ', a] : [a]; }));

// ---------------------------------------------------------------- reading a label
async function readAndAnswer(blob, progress) {
  let text = await readText(blob, progress), c = classify(text);
  if (c.type === 'unknown' || (c.type === 'battery' && !c.result.b)) {      // white print on a black power bank: read it again, flipped
    const t2 = await readText(blob, (w, p) => progress?.('Reading it again', p), { invert: true }); const c2 = classify(text + '\n' + t2);
    if (c2.type !== 'unknown') { c = c2; text = text + '\n' + t2; }
  }
  return { c, text: text.trim() };
}
function answer({ c, text }) {
  if (c.type === 'battery') { const b = c.result.b; showResult(c.result, { name: b?.mah ? `Power bank · ${fmt(b.mah)} mAh` : b ? `Power bank · ${b.wh} Wh` : 'Power bank', text }); return; }
  if (c.type === 'item') { showResult(c.result, { name: c.item.name + (c.result.size ? ` · ${c.result.size.label}` : ''), text, alts: c.also }); return; }
  showUnknown(text);
}
function showUnknown(text) {
  show('start'); $('q').value = ''; $('hits').textContent = '';
  const u = $('unknown'); u.textContent = ''; u.hidden = false;
  u.append(el('b', '', "Couldn't tell what that is"), el('span', '', 'Try a closer photo of the name or the ml, or search it. '));
  const guesses = findItems(text, 4);
  if (guesses.length) { u.append(el('br'), 'Did you mean: '); for (const it of guesses) { const b = el('button', '', it.name); b.type = 'button'; b.onclick = () => { u.hidden = true; openItem(it); }; u.append(b); } }
  if (text) { const d = el('details'); d.append(el('summary', '', 'What it read'), el('pre', '', text)); u.append(d); }
  window.scrollTo({ top: u.getBoundingClientRect().top + scrollY - 120, behavior: 'smooth' });
}
async function fromPhoto(file) {
  show('reading'); $('photo').src = URL.createObjectURL(file); $('readSay').textContent = 'Getting the reader ready…';
  try { answer(await readAndAnswer(file, (what, p) => { $('readSay').textContent = `${what}… ${Math.round((p || 0) * 100)}%`; })); }
  catch (e) { show('start'); toast(e.message || 'Could not read that photo. Search the item instead.'); }
}

// ---------------------------------------------------------------- share
const LINK = () => location.origin + location.pathname.replace(/index\.html$/, '');
async function shareText(text) {
  if (navigator.share) { try { await navigator.share({ text }); return; } catch (e) { if (e.name === 'AbortError') return; } }
  try { await navigator.clipboard.writeText(text); toast('Copied. Paste it in your chat.'); return; } catch { }
  window.prompt('Copy this and send it:', text);
}
function shareBag() {
  const g = { 'Cabin bag': [], 'Check-in bag': [], 'Leave at home': [], 'Ask the airline': [] };
  for (const x of S.bag) (x.cabin === 'no' && x.checkin === 'no' ? g['Leave at home'] : x.cabin === 'ask' || x.checkin === 'ask' ? g['Ask the airline'] : x.cabin === 'no' ? g['Check-in bag'] : g['Cabin bag']).push(x.name);
  const body = Object.entries(g).filter(([, v]) => v.length).map(([k, v]) => `${k}:\n${v.map(n => '• ' + n).join('\n')}`).join('\n\n');
  shareText(`My bag, checked with Fly Check ✈️\n\n${body}\n\nCheck yours free before you fly: ${LINK()}`);
}
$('shareBtn').onclick = async () => {
  const r = S.res; if (!r) return;
  const word = (v, k) => v === 'limit' && k === 'checkin' ? (r.checkinTag || 'within the limit') : ({ yes: 'yes', no: 'no', limit: 'up to 100 ml', ask: 'ask the airline' })[v];
  shareText(`Fly Check: ${S.name} → ${r.head.toUpperCase()}\nCabin bag: ${word(r.cabin, 'cabin')} · Check-in: ${word(r.checkin, 'checkin')}\n\nCheck your bag free before you fly: ${LINK()}`);
};

// ---------------------------------------------------------------- the in-app camera (from Veg Check): 2x zoom, tap to focus, sharpest frame
let stream = null, track = null, caps = {}, camBusy = false, pausedByHide = false, focusBack = 0, noLive = false;
const IN_APP = /Instagram|FBAN|FBAV|FB_IAB|Snapchat|Line\//i.test(navigator.userAgent);
if (IN_APP) $('inapp').hidden = false;
const HINT = 'Fill the box with the label · tap to focus';
const camStream = id => navigator.mediaDevices.getUserMedia({ audio: false, video: { ...(id ? { deviceId: { exact: id } } : { facingMode: { ideal: 'environment' } }), width: { ideal: 2560 }, height: { ideal: 1440 } } });
const capsOf = t => { try { return t.getCapabilities ? t.getCapabilities() : {}; } catch { return {}; } };
async function startStream() {
  const saved = store.get('camId', null);
  try { stream = await camStream(saved); } catch (err) { if (!saved) throw err; store.set('camId', null); stream = await camStream(null); }
  track = stream.getVideoTracks()[0]; caps = capsOf(track);
  if (caps.focusMode && !caps.focusMode.includes('continuous') && !caps.focusMode.includes('single-shot')) {
    const backs = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'videoinput' && /back|rear|environment/i.test(d.label) && d.deviceId !== track.getSettings().deviceId);
    for (const d of backs.slice(0, 3)) {
      try {
        const s2 = await camStream(d.deviceId), t2 = s2.getVideoTracks()[0], c2 = capsOf(t2);
        if (c2.focusMode?.includes('continuous')) { stream.getTracks().forEach(t => t.stop()); stream = s2; track = t2; caps = c2; store.set('camId', d.deviceId); break; }
        s2.getTracks().forEach(t => t.stop());
      } catch { }
    }
  }
  const v = $('video'); v.srcObject = stream; v.play().catch(() => { });
  const adv = {};
  if (caps.focusMode?.includes('continuous')) adv.focusMode = 'continuous';
  if (caps.exposureMode?.includes('continuous')) adv.exposureMode = 'continuous';
  if (caps.whiteBalanceMode?.includes('continuous')) adv.whiteBalanceMode = 'continuous';
  if (Object.keys(adv).length) track.applyConstraints({ advanced: [adv] }).catch(() => { });
  const z = caps.zoom; $('zoom').hidden = !(z && z.max >= 1.5);
  if (!$('zoom').hidden) setZoom(store.get('zoom2', true));
  $('torch').hidden = !caps.torch; $('torch').classList.remove('on');
  track.addEventListener('ended', () => { if (!pausedByHide && !$('camview').hidden) { closeCamera(); toast('The camera stopped. Tap Scan to start it again.'); } });
}
function stopStream() { stream?.getTracks().forEach(t => t.stop()); stream = track = null; }
async function openCamera() {
  if (!navigator.mediaDevices?.getUserMedia) { $('cam').click(); return; }
  if (camBusy) return; camBusy = true; pausedByHide = false;
  try { await startStream(); }
  catch (e) {
    camBusy = false; stopStream(); noLive = true; $('cam').click();
    toast(e?.name === 'NotAllowedError' ? 'Camera access is off for this page. Tap Scan again to take a photo instead.' : 'No live camera here. Tap Scan again to take a photo instead.');
    return;
  }
  camBusy = false; $('camhint').textContent = HINT;
  $('camview').hidden = false; document.body.style.overflow = 'hidden';
  if (history.state?.v !== 'cam') history.pushState({ v: 'cam' }, '');
}
function closeCamera(fromBack = false) {
  stopStream(); clearTimeout(focusBack);
  $('camview').hidden = true; document.body.style.overflow = ''; $('guide').querySelector('.sweep')?.remove(); $('shutter').disabled = false;
  if (!fromBack && history.state?.v === 'cam') history.back();
}
function setZoom(on) {
  const z = caps.zoom; if (!track || !z) return;
  const val = on ? Math.min(2, z.max) : Math.max(1, z.min); store.set('zoom2', on);
  track.applyConstraints({ advanced: [{ zoom: val }] }).then(() => { $('zoom').textContent = on ? '2×' : '1×'; $('zoom').classList.toggle('on', on); }).catch(() => { $('zoom').hidden = true; });
}
function videoPoint(clientX, clientY) {
  const v = $('video'), vw = v.videoWidth, vh = v.videoHeight; if (!vw) return null;
  const R = v.getBoundingClientRect(), k = Math.max(R.width / vw, R.height / vh), ox = (vw * k - R.width) / 2, oy = (vh * k - R.height) / 2;
  return { x: Math.min(1, Math.max(0, (clientX - R.left + ox) / k / vw)), y: Math.min(1, Math.max(0, (clientY - R.top + oy) / k / vh)) };
}
function tapFocus(e) {
  if (e.target.closest('button') || !track) return;
  const r = $('ring'); r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px'; r.hidden = false; r.classList.remove('go'); void r.offsetWidth; r.classList.add('go');
  const p = videoPoint(e.clientX, e.clientY), sup = navigator.mediaDevices.getSupportedConstraints?.() || {}, adv = {};
  if (p && sup.pointsOfInterest) adv.pointsOfInterest = [p];
  if (caps.focusMode?.includes('single-shot')) adv.focusMode = 'single-shot';
  if (!Object.keys(adv).length) return;
  track.applyConstraints({ advanced: [adv] }).catch(() => { });
  clearTimeout(focusBack); focusBack = setTimeout(() => { if (track && caps.focusMode?.includes('continuous')) track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(() => { }); }, 4000);
}
const nextFrame = v => new Promise(r => v.requestVideoFrameCallback ? v.requestVideoFrameCallback(() => r()) : requestAnimationFrame(() => r()));
function sharpness(c) {
  const w = 320, h = Math.max(8, Math.round(c.height * w / c.width)), s = document.createElement('canvas'); s.width = w; s.height = h;
  const g = s.getContext('2d', { willReadFrequently: true }); g.drawImage(c, 0, 0, w, h); const d = g.getImageData(0, 0, w, h).data, y = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) y[i] = d[i * 4] * .299 + d[i * 4 + 1] * .587 + d[i * 4 + 2] * .114;
  let sum = 0, sq = 0, n = 0;
  for (let r = 1; r < h - 1; r++) for (let q = 1; q < w - 1; q++) { const i = r * w + q, L = 4 * y[i] - y[i - 1] - y[i + 1] - y[i - w] - y[i + w]; sum += L; sq += L * L; n++; }
  return n ? sq / n - (sum / n) ** 2 : 0;
}
async function sharpestBox(ms = 700, most = 12) {
  const v = $('video'), t0 = performance.now(); let best = grabBox(), bestS = best ? sharpness(best) : -1, n = 1;
  while (performance.now() - t0 < ms && n < most) { await nextFrame(v); const c = grabBox(); if (!c) break; const s = sharpness(c); if (s > bestS) { best = c; bestS = s; } n++; }
  return best;
}
function grabBox() {
  const v = $('video'), vw = v.videoWidth, vh = v.videoHeight; if (!vw) return null;
  const R = v.getBoundingClientRect(), G = $('guide').getBoundingClientRect();
  const k = Math.max(R.width / vw, R.height / vh), ox = (vw * k - R.width) / 2, oy = (vh * k - R.height) / 2;
  const sx = Math.max(0, (G.left - R.left + ox) / k), sy = Math.max(0, (G.top - R.top + oy) / k);
  const sw = Math.min(vw - sx, G.width / k), sh = Math.min(vh - sy, G.height / k);
  const c = document.createElement('canvas'); c.width = Math.round(sw); c.height = Math.round(sh);
  c.getContext('2d').drawImage(v, sx, sy, sw, sh, 0, 0, c.width, c.height); return c;
}
async function shoot() {
  if ($('shutter').disabled) return;
  if (!$('video').videoWidth) { toast('The camera is still starting…'); return; }
  $('shutter').disabled = true; $('camhint').textContent = 'Hold still…';
  const c = await sharpestBox(); if (!c) { $('shutter').disabled = false; $('camhint').textContent = HINT; return; }
  $('video').pause();
  const sw = document.createElement('div'); sw.className = 'sweep'; $('guide').append(sw); const t0 = performance.now();
  const anim = () => { if (!sw.isConnected) return; const k = ((performance.now() - t0) / 1200) % 2; sw.style.top = `${(k < 1 ? k : 2 - k) * 100}%`; requestAnimationFrame(anim); }; anim();
  const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.95));
  try {
    const out = await readAndAnswer(blob, (what, p) => { $('camhint').textContent = `${what}… ${Math.round((p || 0) * 100)}%`; });
    closeCamera(true); history.replaceState({ v: 'result' }, ''); answer(out);
  } catch (e) { closeCamera(); toast(e.message || 'Could not read that. Try again, a hand away from the label.'); }
}
$('scanBtn').onclick = () => { if (noLive || !navigator.mediaDevices?.getUserMedia) $('cam').click(); else openCamera(); };
$('scanBtn').addEventListener('pointerdown', () => warmUp());
$('cam').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (f) fromPhoto(f); };
$('pick').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (f) fromPhoto(f); };
$('shutter').onclick = shoot;
$('camClose').onclick = () => closeCamera();
$('zoom').onclick = () => setZoom(!$('zoom').classList.contains('on'));
$('camview').addEventListener('pointerdown', tapFocus);
$('torch').onclick = () => { const on = !$('torch').classList.contains('on'); track?.applyConstraints({ advanced: [{ torch: on }] }).then(() => $('torch').classList.toggle('on', on)).catch(() => { }); };
$('againBtn').onclick = () => $('scanBtn').onclick();
addEventListener('popstate', e => {
  const v = e.state?.v;
  if (v !== 'cam' && !$('camview').hidden) closeCamera(true);
  if (v === 'cam') { history.back(); return; }
  if (!v && !$('result').hidden) show('start');
  if (v === 'result' && S.res) show('result');
});
document.addEventListener('visibilitychange', () => {
  if ($('camview').hidden) return;
  if (document.hidden) { pausedByHide = true; stopStream(); }
  else if (pausedByHide) { pausedByHide = false; startStream().catch(() => { closeCamera(); toast('Could not restart the camera. Tap Scan again.'); }); }
});
renderBag();
window.FC = { S, showResult, verdict, checkBattery, classify, byId, ITEMS, answer, $ };
if (new URLSearchParams(location.search).has('demo')) import('./demo.js').then(m => m.start(window.FC)).catch(e => console.error(e));
