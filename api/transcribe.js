// Vercel serverless function: /api/transcribe
// Accepts a base64-encoded audio recording from the browser (JSON body, not
// multipart — that avoids needing a raw-body parser in the serverless
// function) and sends it to Sarvam AI's speech-to-text API with automatic
// language detection. Returns the transcript plus the BCP-47 language code
// Sarvam detected, so the frontend can flip the UI language and the chat
// call can answer back in the same language.
//
// Get a free Sarvam API key at https://dashboard.sarvam.ai (Sign up ->
// API Keys) and set it as SARVAM_API_KEY in your Vercel project's
// Environment Variables (and in .env.local for `vercel dev`).

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
    const { audio, mimeType } = req.body || {};
    if (!audio || typeof audio !== 'string') {
      res.status(400).json({ error: 'Missing "audio" (base64 string) in request body' });
      return;
    }

    const audioBuffer = Buffer.from(audio, 'base64');
    const ext = (mimeType && mimeType.includes('wav')) ? 'wav' : 'webm';

    // Build a multipart/form-data request for Sarvam using the platform's
    // native FormData/Blob (available in Node 18+ on Vercel) — fetch sets
    // the correct boundary header automatically.
    const form = new FormData();
    form.append('file', new Blob([audioBuffer], { type: mimeType || 'audio/webm' }), `recording.${ext}`);
    form.append('model', 'saarika:v2.5');
    form.append('language_code', 'unknown'); // auto-detect the farmer's spoken language

    const resp = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: { 'api-subscription-key': apiKey },
      body: form
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Sarvam STT error ${resp.status}: ${errText}`);
    }

    const data = await resp.json();
    res.status(200).json({
      transcript: data.transcript || '',
      lang: data.language_code || 'unknown'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
