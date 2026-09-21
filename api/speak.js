// Vercel serverless function: /api/speak
// Converts a bot answer into spoken audio in the farmer's language using
// Sarvam AI's text-to-speech (Bulbul) API, so a farmer who can't read well
// can still get the advisory by ear. Returns base64 WAV audio the browser
// plays directly — nothing is written to disk.

const SPEAKER_BY_LANG = {
  'en-IN': 'neha',
  'hi-IN': 'neha',
  'mr-IN': 'neha'
  // Bulbul's default voice "neha" works across all supported Indian
  // languages; swap per-language if you prefer a different voice/gender.
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST' });
    return;
  }

  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'SARVAM_API_KEY is not set on the server' });
    return;
  }

  try {
    const { text, lang } = req.body || {};
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Missing "text" string in request body' });
      return;
    }

    // Bulbul's REST endpoint caps input length; trim politely rather than error.
    const clipped = text.length > 1500 ? `${text.slice(0, 1490)}…` : text;
    const targetLang = lang && lang !== 'unknown' ? lang : 'en-IN';

    const resp = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'api-subscription-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: clipped,
        model: 'bulbul:v3',
        target_language_code: targetLang,
        speaker: SPEAKER_BY_LANG[targetLang] || 'neha'
      })
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Sarvam TTS error ${resp.status}: ${errText}`);
    }

    const data = await resp.json();
    const audioBase64 = (data.audios || []).join('');
    res.status(200).json({ audio: audioBase64, format: 'wav' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
