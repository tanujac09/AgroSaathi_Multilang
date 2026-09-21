// ---------------------------------------------------------------------------
// i18n — UI strings for the three toggle languages. Any language Sarvam's
// speech-to-text auto-detects but that isn't one of these three (e.g. Tamil,
// Gujarati) simply falls back to the English UI copy below; the *answer*
// from Gemini still comes back in whatever language was actually detected,
// because that's decided server-side in api/chat.js, not by this table.
// ---------------------------------------------------------------------------
const I18N = {
  'en-IN': {
    label: 'English',
    heroTitle: 'Ask your field <em>a question.</em>',
    heroLede: "A retrieval-augmented crop advisory assistant. Your question is matched against a curated agronomy knowledge base, then answered by Gemini — grounded strictly in the retrieved records, with sources shown for every reply.",
    chatHead: 'AgroSaathi Advisory',
    placeholder: 'e.g. How do I control pests on cotton?',
    send: 'Ask',
    greeting: "<p>Namaste! I'm AgroSaathi. Ask me about sowing season, irrigation, pest control, or fertilizer for any of 16 crops — by typing or by tapping the mic.</p>",
    chips: ['Pest control for cotton', 'Irrigation schedule for onion', 'When to sow soybean', 'Fertilizer plan for sugarcane'],
    listening: 'Listening… tap the mic again to stop.',
    transcribing: 'Understanding what you said…',
    micError: "Couldn't access the microphone. Check your browser's mic permission.",
    sttError: "Couldn't understand the recording. Please try again or type your question.",
    sourcesLabel: n => `View ${n} retrieved source${n > 1 ? 's' : ''}`,
    listen: 'Listen',
    connError: msg => `<p>Sorry — I couldn't reach the advisory service. (${msg}) Check that <code>GEMINI_API_KEY</code> is set on your deployment.</p>`
  },
  'hi-IN': {
    label: 'हिंदी',
    heroTitle: 'अपने खेत से <em>एक सवाल पूछें।</em>',
    heroLede: 'एक रिट्रीवल-आधारित कृषि सलाह सहायक। आपके सवाल को कृषि ज्ञान आधार से मिलाया जाता है, फिर Gemini द्वारा उसी जानकारी के आधार पर उत्तर दिया जाता है, हर जवाब के स्रोत के साथ।',
    chatHead: 'AgroSaathi सलाह',
    placeholder: 'जैसे — कपास में कीट नियंत्रण कैसे करें?',
    send: 'पूछें',
    greeting: '<p>नमस्ते! मैं AgroSaathi हूं। मुझसे बुवाई का मौसम, सिंचाई, कीट नियंत्रण या 16 फसलों के लिए खाद के बारे में पूछें — टाइप करके या माइक दबाकर।</p>',
    chips: ['कपास में कीट नियंत्रण', 'प्याज की सिंचाई कब करें', 'सोयाबीन की बुवाई कब करें', 'गन्ने के लिए खाद योजना'],
    listening: 'सुन रहा हूं… रोकने के लिए माइक फिर दबाएं।',
    transcribing: 'आपकी बात समझी जा रही है…',
    micError: 'माइक्रोफ़ोन तक पहुंच नहीं मिली। कृपया ब्राउज़र की अनुमति जांचें।',
    sttError: 'रिकॉर्डिंग समझ नहीं आई। कृपया फिर कोशिश करें या टाइप करें।',
    sourcesLabel: n => `${n} स्रोत देखें`,
    listen: 'सुनें',
    connError: msg => `<p>क्षमा करें — सेवा से संपर्क नहीं हो सका। (${msg}) जांचें कि <code>GEMINI_API_KEY</code> सेट है।</p>`
  },
  'mr-IN': {
    label: 'मराठी',
    heroTitle: 'तुमच्या शेताला <em>प्रश्न विचारा.</em>',
    heroLede: 'एक रिट्रीव्हल-आधारित पीक सल्ला सहाय्यक. तुमचा प्रश्न कृषी ज्ञानकोशाशी जुळवला जातो, आणि नंतर Gemini त्याच माहितीच्या आधारे उत्तर देतो, प्रत्येक उत्तरासोबत स्रोत दाखवले जातात.',
    chatHead: 'AgroSaathi सल्ला',
    placeholder: 'उदा. — कापसातील किडी कशा नियंत्रित कराव्यात?',
    send: 'विचारा',
    greeting: '<p>नमस्कार! मी AgroSaathi आहे. मला पेरणीचा हंगाम, सिंचन, किड नियंत्रण किंवा 16 पिकांसाठी खताबद्दल विचारा — टाइप करून किंवा माइक दाबून.</p>',
    chips: ['कापसातील किड नियंत्रण', 'कांद्याचे सिंचन वेळापत्रक', 'सोयाबीन पेरणी कधी करावी', 'उसासाठी खत योजना'],
    listening: 'ऐकत आहे… थांबवण्यासाठी माइक पुन्हा दाबा.',
    transcribing: 'तुम्ही काय बोललात ते समजून घेत आहे…',
    micError: 'मायक्रोफोन उपलब्ध नाही. ब्राउझरची परवानगी तपासा.',
    sttError: 'रेकॉर्डिंग समजले नाही. कृपया पुन्हा प्रयत्न करा किंवा टाइप करा.',
    sourcesLabel: n => `${n} स्रोत पहा`,
    listen: 'ऐका',
    connError: msg => `<p>माफ करा — सेवेशी संपर्क होऊ शकला नाही. (${msg}) <code>GEMINI_API_KEY</code> सेट आहे का ते तपासा.</p>`
  }
};

let currentLang = localStorage.getItem('agrosaathi_lang') || 'en-IN';
if (!I18N[currentLang]) currentLang = 'en-IN';

const chatBody = document.getElementById('chatBody');
const input = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const chipsEl = document.getElementById('chips');
const micBtn = document.getElementById('micBtn');
const micStatus = document.getElementById('micStatus');
const langToggle = document.getElementById('langToggle');
const langPill = document.getElementById('langPill');

function t() { return I18N[currentLang] || I18N['en-IN']; }

// ---------------------------------------------------------------------------
// UI language switching
// ---------------------------------------------------------------------------
function applyLanguage() {
  const strings = t();
  document.getElementById('heroTitle').innerHTML = strings.heroTitle;
  document.getElementById('heroLede').textContent = strings.heroLede;
  document.getElementById('chatHeadLabel').textContent = strings.chatHead;
  document.getElementById('langPill').textContent = strings.label;
  input.placeholder = strings.placeholder;
  sendBtn.textContent = strings.send;
  document.documentElement.lang = currentLang.split('-')[0];

  langToggle.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
  });

  chipsEl.innerHTML = '';
  strings.chips.forEach(c => {
    const b = document.createElement('button');
    b.className = 'chip';
    b.textContent = c;
    b.addEventListener('click', () => handleSend(c));
    chipsEl.appendChild(b);
  });
}

function setLanguage(lang, { greet = false } = {}) {
  if (!I18N[lang]) lang = 'en-IN'; // UI copy falls back to English for languages we haven't localized yet
  currentLang = lang;
  localStorage.setItem('agrosaathi_lang', currentLang);
  applyLanguage();
  if (greet) {
    chatBody.innerHTML = '';
    addMessage('bot', t().greeting);
  }
}

langToggle.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => setLanguage(btn.dataset.lang, { greet: true }));
});

// ---------------------------------------------------------------------------
// Chat rendering
// ---------------------------------------------------------------------------
function stripHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function addSpeakButton(bubble, rawHtml) {
  const btn = document.createElement('button');
  btn.className = 'speak-btn';
  btn.type = 'button';
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg><span>${t().listen}</span>`;

  let audioEl = null;
  btn.addEventListener('click', async () => {
    if (audioEl) { audioEl.paused ? audioEl.play() : audioEl.pause(); return; }
    btn.disabled = true;
    try {
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: stripHtml(rawHtml), lang: currentLang })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'TTS failed');
      audioEl = new Audio(`data:audio/${data.format || 'wav'};base64,${data.audio}`);
      audioEl.addEventListener('play', () => btn.classList.add('playing'));
      audioEl.addEventListener('pause', () => btn.classList.remove('playing'));
      audioEl.play();
    } catch (err) {
      micStatus.textContent = err.message;
      micStatus.classList.add('error');
    } finally {
      btn.disabled = false;
    }
  });

  bubble.appendChild(btn);
}

function addMessage(role, html, sources) {
  const wrap = document.createElement('div');
  wrap.className = `msg ${role}`;
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = html;
  wrap.appendChild(bubble);
  if (sources && sources.length) {
    const det = document.createElement('details');
    det.className = 'sources';
    const sum = document.createElement('summary');
    sum.textContent = t().sourcesLabel(sources.length);
    det.appendChild(sum);
    sources.forEach(s => {
      const card = document.createElement('div');
      card.className = 'source-card';
      card.innerHTML = `<b>${s.crop}</b> — ${s.snippet || ''}`;
      det.appendChild(card);
    });
    bubble.appendChild(det);
  }
  if (role === 'bot' && html) addSpeakButton(bubble, html);
  chatBody.appendChild(wrap);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function showTyping() {
  const wrap = document.createElement('div');
  wrap.className = 'msg bot';
  wrap.id = 'typingIndicator';
  wrap.innerHTML = `<div class="bubble"><div class="typing"><span></span><span></span><span></span></div></div>`;
  chatBody.appendChild(wrap);
  chatBody.scrollTop = chatBody.scrollHeight;
}
function hideTyping() {
  const t = document.getElementById('typingIndicator');
  if (t) t.remove();
}

// ---------------------------------------------------------------------------
// Sending a question (typed or transcribed) — always carries currentLang so
// the server answers back in the right language.
// ---------------------------------------------------------------------------
async function handleSend(text) {
  const q = (text ?? input.value).trim();
  if (!q) return;
  addMessage('user', q);
  input.value = '';
  micStatus.textContent = '';
  micStatus.classList.remove('error');
  showTyping();
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: q, lang: currentLang })
    });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const data = await res.json();
    hideTyping();
    addMessage('bot', data.answer, data.sources);
  } catch (err) {
    hideTyping();
    addMessage('bot', t().connError(err.message));
  }
}

sendBtn.addEventListener('click', () => handleSend());
input.addEventListener('keydown', e => { if (e.key === 'Enter') handleSend(); });

// ---------------------------------------------------------------------------
// Voice input — records with MediaRecorder, sends the audio to
// /api/transcribe (Sarvam AI, auto language detection), fills the input
// with the transcript, switches the UI to the detected language, and sends.
// ---------------------------------------------------------------------------
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
    mediaRecorder.onstop = () => {
      stream.getTracks().forEach(track => track.stop());
      handleRecordedAudio(new Blob(audioChunks, { type: mediaRecorder.mimeType || 'audio/webm' }));
    };
    mediaRecorder.start();
    isRecording = true;
    micBtn.classList.add('recording');
    micStatus.classList.remove('error');
    micStatus.textContent = t().listening;
  } catch (err) {
    micStatus.classList.add('error');
    micStatus.textContent = t().micError;
  }
}

function stopRecording() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    isRecording = false;
    micBtn.classList.remove('recording');
  }
}

async function handleRecordedAudio(blob) {
  micStatus.classList.remove('error');
  micStatus.textContent = t().transcribing;
  try {
    const base64 = await blobToBase64(blob);
    const res = await fetch('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio: base64, mimeType: blob.type })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || data.error || 'Transcription failed');
    if (!data.transcript || !data.transcript.trim()) throw new Error('empty transcript');

    // Auto-detected language becomes the active language for the UI + reply.
    if (data.lang && data.lang !== 'unknown') setLanguage(data.lang);

    micStatus.textContent = '';
    handleSend(data.transcript.trim());
  } catch (err) {
    console.error('Transcription error:', err.message); // check the browser console for the real cause
    micStatus.classList.add('error');
    micStatus.textContent = t().sttError;
  }
}

micBtn.addEventListener('click', () => {
  if (isRecording) stopRecording();
  else startRecording();
});

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
applyLanguage();
addMessage('bot', t().greeting);
