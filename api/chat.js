// Vercel serverless function: /api/chat
// Does keyword retrieval over knowledge_base.json, then asks Gemini to answer
// grounded ONLY in the retrieved records. The Gemini API key never reaches the browser.
//
// Multi-language support: the frontend sends a BCP-47 `lang` code (e.g. "hi-IN",
// "mr-IN", "en-IN", or whatever Sarvam's speech-to-text auto-detected). Retrieval
// still runs on English keywords/crop names, so we match against a small
// Hindi/Marathi keyword+crop alias table before scoring. The final answer is
// generated in the farmer's language by instructing Gemini directly.

const fs = require('fs');
const path = require('path');

const KB = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'knowledge_base.json'), 'utf-8')
);

// ---------------------------------------------------------------------------
// Language metadata. Keyed by BCP-47 code (matches Sarvam STT's language_code
// output and the `lang` the frontend sends). Add more rows here any time you
// want another toggle language or better auto-detect coverage.
// ---------------------------------------------------------------------------
const LANGUAGES = {
  'en-IN': { name: 'English' },
  'hi-IN': { name: 'Hindi' },
  'mr-IN': { name: 'Marathi' },
  'gu-IN': { name: 'Gujarati' },
  'ta-IN': { name: 'Tamil' },
  'te-IN': { name: 'Telugu' },
  'kn-IN': { name: 'Kannada' },
  'ml-IN': { name: 'Malayalam' },
  'bn-IN': { name: 'Bengali' },
  'pa-IN': { name: 'Punjabi' },
  'or-IN': { name: 'Odia' },
  'unknown': { name: 'English' }
};

function resolveLanguage(lang) {
  return LANGUAGES[lang] ? lang : 'en-IN';
}

// ---------------------------------------------------------------------------
// Retrieval — keyword scoring, now multilingual for Hindi + Marathi so a
// farmer typing or speaking in their own language still hits the right
// knowledge-base records (retrieval always operates on the underlying
// English records; only the *matching* is multilingual).
// ---------------------------------------------------------------------------
const TOPIC_KEYWORDS = {
  pest: {
    en: ['pest', 'insect', 'bug', 'disease', 'borer', 'fungus', 'infestation', 'control', 'spray', 'attack', 'worm', 'blight', 'mildew', 'rot'],
    hi: ['कीट', 'कीड़े', 'रोग', 'बीमारी', 'फफूंद', 'इल्ली', 'सुंडी', 'छिड़काव', 'दवा', 'नियंत्रण', 'प्रकोप'],
    mr: ['किड', 'किडी', 'रोग', 'आजार', 'बुरशी', 'अळी', 'फवारणी', 'औषध', 'नियंत्रण', 'प्रादुर्भाव']
  },
  irrigation: {
    en: ['water', 'irrigat', 'drip', 'rain', 'dry', 'drought', 'moisture', 'flood'],
    hi: ['पानी', 'सिंचाई', 'बारिश', 'सूखा', 'नमी', 'बूंद', 'बाढ़'],
    mr: ['पाणी', 'सिंचन', 'पाऊस', 'दुष्काळ', 'ओलावा', 'ठिबक', 'पूर']
  },
  fertilizer: {
    en: ['fertiliz', 'fertilis', 'nutrient', 'npk', 'manure', 'nitrogen', 'potash', 'phosphorus', 'urea'],
    hi: ['खाद', 'उर्वरक', 'पोषक', 'यूरिया', 'नाइट्रोजन', 'खाद्य'],
    mr: ['खत', 'खते', 'पोषक', 'युरिया', 'नत्र']
  },
  season: {
    en: ['sow', 'season', 'when', 'plant', 'kharif', 'rabi', 'harvest', 'month'],
    hi: ['बुवाई', 'मौसम', 'कब', 'रोपाई', 'खरीफ', 'रबी', 'कटाई', 'महीना'],
    mr: ['पेरणी', 'हंगाम', 'कधी', 'लागवड', 'खरीप', 'रब्बी', 'काढणी', 'महिना']
  },
  soil: {
    en: ['soil', 'ph', 'land'],
    hi: ['मिट्टी', 'जमीन', 'भूमि'],
    mr: ['माती', 'जमीन', 'भूमी']
  },
  sustain: {
    en: ['sustain', 'climate', 'organic', 'water-saving', 'emission', 'eco'],
    hi: ['जैविक', 'जलवायु', 'टिकाऊ', 'पर्यावरण'],
    mr: ['सेंद्रिय', 'हवामान', 'शाश्वत', 'पर्यावरण']
  }
};

// English crop name -> Hindi / Marathi aliases, so "कापूस" or "कापूस मध्ये"
// still matches the "Cotton" record even though the KB itself is English-only.
const CROP_ALIASES = {
  'Rice (Paddy)': { hi: ['चावल', 'धान'], mr: ['भात', 'तांदूळ'] },
  'Wheat': { hi: ['गेहूं', 'गेहू'], mr: ['गहू'] },
  'Cotton': { hi: ['कपास'], mr: ['कापूस'] },
  'Sugarcane': { hi: ['गन्ना'], mr: ['ऊस'] },
  'Soybean': { hi: ['सोयाबीन'], mr: ['सोयाबीन'] },
  'Tur (Pigeon Pea)': { hi: ['तूर', 'अरहर'], mr: ['तूर'] },
  'Onion': { hi: ['प्याज'], mr: ['कांदा'] },
  'Tomato': { hi: ['टमाटर'], mr: ['टोमॅटो'] },
  'Chilli': { hi: ['मिर्च'], mr: ['मिरची'] },
  'Groundnut': { hi: ['मूंगफली'], mr: ['भुईमूग'] },
  'Maize': { hi: ['मक्का'], mr: ['मका'] },
  'Bajra (Pearl Millet)': { hi: ['बाजरा'], mr: ['बाजरी'] },
  'Jowar (Sorghum)': { hi: ['ज्वार'], mr: ['ज्वारी'] },
  'Gram (Chana)': { hi: ['चना'], mr: ['हरभरा'] },
  'Grapes': { hi: ['अंगूर'], mr: ['द्राक्ष'] },
  'Pomegranate': { hi: ['अनार'], mr: ['डाळिंब'] }
};

// Tokenize on Unicode word characters so Devanagari (Hindi/Marathi) text is
// preserved instead of being stripped by an ASCII-only regex.
function tokenize(s) {
  return (s || '').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

function scoreEntry(entry, toks) {
  let score = 0;

  const cropToks = tokenize(entry.crop);
  const aliasToks = CROP_ALIASES[entry.crop]
    ? tokenize([...CROP_ALIASES[entry.crop].hi, ...CROP_ALIASES[entry.crop].mr].join(' '))
    : [];
  toks.forEach(t => {
    if (cropToks.some(c => c.includes(t) || t.includes(c))) score += 3;
    if (aliasToks.some(c => c.includes(t) || t.includes(c))) score += 3;
  });

  Object.entries(TOPIC_KEYWORDS).forEach(([topic, byLang]) => {
    const allKws = [...byLang.en, ...byLang.hi, ...byLang.mr];
    if (allKws.some(kw => toks.some(t => t.includes(kw))) && entry[topic]) score += 1;
  });

  return score;
}

function retrieve(query, k = 3) {
  const toks = tokenize(query);
  const scored = KB.map(e => ({ entry: e, score: scoreEntry(e, toks) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.filter(s => s.score > 0).slice(0, k).map(s => s.entry);
}

// ---------------------------------------------------------------------------
// Gemini call — grounded generation, answered in the farmer's language.
// ---------------------------------------------------------------------------
async function callGemini(query, contextEntries, langCode) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set on the server');

  const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'; // check ai.google.dev for the current free-tier model name
  const langName = LANGUAGES[resolveLanguage(langCode)].name;

  const contextText = contextEntries.map(e => (
    `Crop: ${e.crop}\nSeason: ${e.season}\nSoil: ${e.soil}\nIrrigation: ${e.irrigation}\nPest & disease: ${e.pest}\nFertilizer: ${e.fertilizer}\nSustainability: ${e.sustain}`
  )).join('\n\n---\n\n');

  const prompt = `You are AgroSaathi, an AI crop-advisory assistant for smallholder farmers in Maharashtra, India.
Answer the farmer's question using ONLY the knowledge-base records below. Do not invent facts that
aren't in the records. Never state an exact pesticide or fertilizer dosage — instead tell the farmer
to confirm the exact dose with their local Krishi Vigyan Kendra (KVK). Keep the answer short, practical,
and in plain language. If the records don't cover the question, say so honestly.

IMPORTANT — LANGUAGE: The farmer asked their question in ${langName}. Write your ENTIRE reply in
${langName}, in its native script (do not transliterate into Latin letters, and do not answer in
English unless the target language is English). Keep vocabulary simple, as if speaking to a farmer
directly in their own village.

KNOWLEDGE BASE RECORDS:
${contextText || '(no matching records found)'}

FARMER'S QUESTION: ${query}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    })
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Gemini API error ${resp.status}: ${errText}`);
  }
  const data = await resp.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate an answer.";
  return text;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST' });
    return;
  }
  try {
    const { message, lang } = req.body || {};
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Missing "message" string in request body' });
      return;
    }
    const langCode = resolveLanguage(lang);
    const matches = retrieve(message);
    const answerText = await callGemini(message, matches, langCode);
    const sources = matches.map(e => ({ crop: e.crop, snippet: e.season }));
    res.status(200).json({
      answer: `<p>${answerText.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`,
      sources,
      lang: langCode
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
