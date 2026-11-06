const STORAGE_KEY = 'hola-vocab-v1';
const PRACTICE_KEY = 'hola-practice-v1';
const starterWords = [
  { id: 'seed-1', es: 'hola', de: 'hallo', example: '¡Hola! ¿Cómo estás?', createdAt: 1, known: 0 },
  { id: 'seed-2', es: 'gracias', de: 'danke', example: 'Muchas gracias por tu ayuda.', createdAt: 2, known: 0 },
  { id: 'seed-3', es: 'la mariposa', de: 'der Schmetterling', example: 'La mariposa es bonita.', createdAt: 3, known: 0 },
  { id: 'seed-4', es: '¿Dónde está…?', de: 'Wo ist…?', example: '¿Dónde está la estación?', createdAt: 4, known: 0 }
];
let words = loadWords();
let practice = { direction: 'es-de', queue: [], index: 0, answered: false };
let toastTimer;

function loadWords() {
  try { const saved = localStorage.getItem(STORAGE_KEY); return saved ? JSON.parse(saved) : [...starterWords]; }
  catch { return [...starterWords]; }
}
function saveWords() { localStorage.setItem(STORAGE_KEY, JSON.stringify(words)); updateStats(); renderWords(); }
function escapeHTML(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function showToast(message) { const el = document.getElementById('toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2600); }
function navigate(view) {
  document.querySelectorAll('.view').forEach(el => el.classList.toggle('active-view', el.id === `view-${view}`));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.view === view));
  if (view === 'practice') startPractice();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function updateStats() {
  document.getElementById('stat-total').textContent = words.length;
  document.getElementById('stat-known').textContent = words.reduce((n, w) => n + (w.known || 0), 0);
  let count = 0;
  try { const data = JSON.parse(localStorage.getItem(PRACTICE_KEY) || '{}'); if (data.day === new Date().toLocaleDateString('sv-SE')) count = data.count || 0; } catch {}
  document.getElementById('stat-practiced').textContent = count;
  document.getElementById('nav-count').textContent = words.length;
}
function rowMarkup(word) {
  const initial = (word.es.trim()[0] || 'ñ').toUpperCase();
  return `<article class="word-row"><div class="word-initial">${escapeHTML(initial)}</div><div class="word-info"><strong>${escapeHTML(word.es)}</strong><p>${escapeHTML(word.de)}</p>${word.example ? `<div class="word-example">${escapeHTML(word.example)}</div>` : ''}</div><div class="row-actions"><button class="icon-button speak-word" data-id="${escapeHTML(word.id)}" aria-label="${escapeHTML(word.es)} anhören" title="Anhören">◖))</button><button class="icon-button delete-word" data-id="${escapeHTML(word.id)}" aria-label="${escapeHTML(word.es)} löschen" title="Löschen">×</button></div></article>`;
}
function bindWordActions(root) {
  root.querySelectorAll('.speak-word').forEach(button => button.addEventListener('click', () => { const word = words.find(w => w.id === button.dataset.id); if (word) speak(word.es); }));
  root.querySelectorAll('.delete-word').forEach(button => button.addEventListener('click', () => { const word = words.find(w => w.id === button.dataset.id); if (!word) return; if (confirm(`„${word.es}“ aus deiner Sammlung löschen?`)) { words = words.filter(w => w.id !== word.id); saveWords(); showToast('Vokabel gelöscht.'); } }));
}
function renderWords() {
  const recent = document.getElementById('recent-list');
  const latest = [...words].sort((a,b) => b.createdAt - a.createdAt).slice(0, 3);
  recent.innerHTML = latest.length ? latest.map(rowMarkup).join('') : '<div class="empty-state"><h2>Deine Sammlung ist noch leer</h2><p>Füge dein erstes spanisches Wort hinzu.</p></div>';
  bindWordActions(recent);
  const query = (document.getElementById('search-input')?.value || '').trim().toLocaleLowerCase();
  const filtered = [...words].sort((a,b) => b.createdAt - a.createdAt).filter(w => `${w.es} ${w.de} ${w.example || ''}`.toLocaleLowerCase().includes(query));
  const list = document.getElementById('vocab-list');
  list.innerHTML = filtered.length ? filtered.map(rowMarkup).join('') : (words.length ? '<div class="empty-state"><h2>Nichts gefunden</h2><p>Versuche einen anderen Suchbegriff.</p></div>' : '<div class="empty-state"><div class="empty-illustration">＋</div><h2>Hier ist noch Platz für neue Wörter</h2><p>Füge Vokabeln hinzu oder scanne eine Liste, um loszulegen.</p><button class="primary-button" data-open-add>＋ Wort hinzufügen</button></div>');
  bindWordActions(list);
  list.querySelector('[data-open-add]')?.addEventListener('click', openAddDialog);
  document.getElementById('word-count-label').textContent = `${filtered.length} ${filtered.length === 1 ? 'Wort' : 'Wörter'}`;
  updateStats();
}
function openAddDialog() { document.getElementById('add-form').reset(); document.getElementById('scan-status').textContent = ''; document.getElementById('add-dialog').showModal(); }
function addWord(es, de, example = '') {
  es = es.trim(); de = de.trim(); if (!es || !de) return false;
  const duplicate = words.find(w => w.es.toLocaleLowerCase() === es.toLocaleLowerCase() && w.de.toLocaleLowerCase() === de.toLocaleLowerCase());
  if (duplicate) return false;
  words.unshift({ id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, es, de, example: example.trim(), createdAt: Date.now(), known: 0 });
  return true;
}
function speak(text) {
  if (!('speechSynthesis' in window)) { showToast('Sprachausgabe wird von diesem Browser nicht unterstützt.'); return; }
  speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'es-ES'; utterance.rate = 0.84;
  const voices = speechSynthesis.getVoices(); const voice = voices.find(v => v.lang.toLowerCase().startsWith('es')); if (voice) utterance.voice = voice; speechSynthesis.speak(utterance);
}
function startPractice() {
  if (!words.length) { document.getElementById('practice-empty').classList.remove('hidden'); document.getElementById('practice-panel').classList.add('hidden'); return; }
  document.getElementById('practice-empty').classList.add('hidden'); document.getElementById('practice-panel').classList.remove('hidden');
  practice.queue = [...words].sort(() => Math.random() - .5); practice.index = 0; practice.answered = false; showPracticeCard();
}
function currentWord() { return practice.queue[practice.index % practice.queue.length]; }
function showPracticeCard() {
  const word = currentWord(); if (!word) return;
  const fromGerman = practice.direction === 'de-es'; const spelling = practice.direction === 'spelling';
  const prompt = spelling ? word.de : (fromGerman ? word.de : word.es);
  document.getElementById('card-direction').textContent = spelling ? 'SCHREIBE DAS SPANISCHE WORT' : (fromGerman ? 'ÜBERSETZE INS SPANISCHE' : 'ÜBERSETZE INS DEUTSCHE');
  document.getElementById('prompt-word').textContent = prompt;
  document.getElementById('speak-prompt').classList.toggle('hidden', fromGerman);
  document.getElementById('answer-label').textContent = spelling ? 'Spanische Schreibweise' : (fromGerman ? 'Deine spanische Übersetzung' : 'Deine Übersetzung');
  document.getElementById('answer-input').value = ''; document.getElementById('answer-input').disabled = false;
  document.getElementById('answer-input').placeholder = spelling ? 'Spanisches Wort mit Akzenten…' : 'Antwort eingeben…';
  document.getElementById('answer-feedback').textContent = ''; document.getElementById('answer-feedback').className = 'answer-feedback';
  document.getElementById('practice-progress').textContent = `KARTE ${practice.index + 1} VON ${practice.queue.length}`;
  document.getElementById('show-answer').textContent = 'Antwort zeigen'; practice.answered = false;
}
function correctAnswer(word) { return practice.direction === 'de-es' || practice.direction === 'spelling' ? word.es : word.de; }
function checkAnswer(event) {
  event.preventDefault(); if (practice.answered) { practice.index = (practice.index + 1) % practice.queue.length; showPracticeCard(); return; }
  const word = currentWord(); const input = document.getElementById('answer-input').value.trim(); const expected = correctAnswer(word);
  const isCorrect = input.toLocaleLowerCase() === expected.toLocaleLowerCase(); const feedback = document.getElementById('answer-feedback');
  feedback.className = `answer-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
  feedback.textContent = isCorrect ? '¡Muy bien! Genau richtig. ✓' : `Noch nicht ganz. Richtig ist: ${expected}`;
  practice.answered = true; document.getElementById('answer-input').disabled = true;
  if (isCorrect) { word.known = (word.known || 0) + 1; localStorage.setItem(STORAGE_KEY, JSON.stringify(words)); }
  try { const today = new Date().toLocaleDateString('sv-SE'); const data = JSON.parse(localStorage.getItem(PRACTICE_KEY) || '{}'); localStorage.setItem(PRACTICE_KEY, JSON.stringify({ day: today, count: (data.day === today ? data.count : 0) + 1 })); } catch {}
  updateStats(); document.getElementById('answer-form').querySelector('button').innerHTML = 'Weiter <span>→</span>';
}
function parseLines(text) {
  const entries = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim().replace(/^[-•*\d.)\s]+/, ''); if (!line) continue;
    const parts = line.split(/\s*(?:\t|\s[-–—]\s|\s*,\s*|\s*:\s*)\s*/);
    if (parts.length >= 2 && parts[0].trim() && parts.slice(1).join(' ').trim()) entries.push({ es: parts[0].trim(), de: parts.slice(1).join(' ').trim() });
  }
  return entries;
}

// Navigation and common actions
document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.view)));
document.getElementById('home-add').addEventListener('click', openAddDialog);
document.getElementById('open-add').addEventListener('click', openAddDialog);
document.getElementById('home-practice').addEventListener('click', () => navigate('practice'));
document.getElementById('practice-add').addEventListener('click', openAddDialog);
document.getElementById('search-input').addEventListener('input', renderWords);
document.getElementById('close-dialog').addEventListener('click', () => document.getElementById('add-dialog').close());
document.getElementById('cancel-dialog').addEventListener('click', () => document.getElementById('add-dialog').close());
document.getElementById('add-form').addEventListener('submit', event => {
  event.preventDefault(); const es = document.getElementById('spanish-input').value; const de = document.getElementById('german-input').value; const example = document.getElementById('example-input').value;
  if (!addWord(es, de, example)) { showToast('Dieses Wortpaar gibt es schon oder ein Feld ist leer.'); return; }
  saveWords(); document.getElementById('add-dialog').close(); showToast('¡Perfecto! Vokabel gespeichert.');
});
document.getElementById('speak-prompt').addEventListener('click', () => speak(currentWord()?.es || ''));
document.getElementById('answer-form').addEventListener('submit', checkAnswer);
document.getElementById('show-answer').addEventListener('click', () => { const feedback = document.getElementById('answer-feedback'); feedback.className = 'answer-feedback'; feedback.textContent = `Antwort: ${correctAnswer(currentWord())}`; practice.answered = true; document.getElementById('answer-input').disabled = true; document.getElementById('answer-form').querySelector('button').innerHTML = 'Weiter <span>→</span>'; });
document.getElementById('restart-practice').addEventListener('click', startPractice);
document.querySelectorAll('.direction-button').forEach(button => button.addEventListener('click', () => { practice.direction = button.dataset.direction; document.querySelectorAll('.direction-button').forEach(b => b.classList.toggle('selected', b === button)); startPractice(); }));
document.getElementById('close-import').addEventListener('click', () => document.getElementById('import-dialog').close());
document.getElementById('cancel-import').addEventListener('click', () => document.getElementById('import-dialog').close());
document.getElementById('import-form').addEventListener('submit', event => {
  event.preventDefault(); const entries = parseLines(document.getElementById('import-text').value); let added = 0;
  entries.forEach(entry => { if (addWord(entry.es, entry.de)) added++; });
  if (!added) { showToast('Keine neuen Wortpaare erkannt. Bitte Spanisch und Deutsch mit Bindestrich trennen.'); return; }
  saveWords(); document.getElementById('import-dialog').close(); showToast(`${added} ${added === 1 ? 'Vokabel' : 'Vokabeln'} hinzugefügt.`);
});
document.getElementById('scan-file').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file) return;
  const status = document.getElementById('scan-status'); status.textContent = 'Bild wird gelesen – beim ersten Mal kann es kurz dauern…';
  try {
    if (!window.Tesseract) { const script = document.createElement('script'); script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'; document.head.appendChild(script); await new Promise((resolve, reject) => { script.onload = resolve; script.onerror = reject; }); }
    const result = await window.Tesseract.recognize(file, 'spa+deu', { logger: info => { if (info.status === 'recognizing text') status.textContent = `Text wird erkannt… ${Math.round((info.progress || 0) * 100)}%`; } });
    document.getElementById('import-text').value = result.data.text.trim(); document.getElementById('add-dialog').close(); document.getElementById('import-dialog').showModal();
  } catch (error) { console.error(error); status.textContent = 'Das Foto konnte nicht gelesen werden. Bitte prüfe die Internetverbindung oder tippe die Wörter ein.'; }
  event.target.value = '';
});

renderWords();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
