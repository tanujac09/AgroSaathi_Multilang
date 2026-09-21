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
    // MediaRecorder gives a mimeType like "audio/webm;codecs=opus" — strip the
    // codec parameter for the multipart part; Sarvam auto-detects the codec
    // from the file itself and a stray ";codecs=..." on the Content-Type of
    // the form part has caused rejections for some browsers/recorders.
    const baseMime = (mimeType || 'audio/webm').split(';')[0].trim();
    const ext = baseMime.includes('wav') ? 'wav' : (baseMime.includes('ogg') ? 'ogg' : 'webm');

    // Build a multipart/form-data request for Sarvam using the platform's
    // native FormData/Blob (available in Node 18+ on Vercel) — fetch sets
    // the correct boundary header automatically.
    const form = new FormData();
    form.append('file', new Blob([audioBuffer], { type: baseMime }), `recording.${ext}`);
    form.append('model', 'saarika:v2.5');
    form.append('language_code', 'unknown'); // auto-detect the farmer's spoken language

    const resp = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: { 'api-subscription-key': apiKey },
      body: form
    });

    if (!resp.ok) {
      const errText = await resp.text();
      // Log full detail server-side (visible in Vercel's Function Logs) and
      // also return a trimmed version to the client so the browser console
      // shows the real cause instead of a bare 500.
      console.error(`Sarvam STT error ${resp.status}:`, errText);
      res.status(502).json({
        error: `Sarvam STT error ${resp.status}`,
        detail: errText.slice(0, 500)
      });
      return;
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
