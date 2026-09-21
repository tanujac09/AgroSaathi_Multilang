# AgroSaathi — AI Crop Advisory Chatbot

A RAG (Retrieval-Augmented Generation) crop-advisory chatbot built for the **1M1B × IBM SkillsBuild
AI for Sustainability Virtual Internship (July–Sep 2026)**.

- **Student:** Tanuja Chavan
- **College:** MKSSS's Cummins College of Engineering for Women (CCEW), Pune
- **SDG alignment:** SDG 2 (Zero Hunger) — secondary SDG 15 (Life on Land), SDG 13 (Climate Action)

It answers farmer questions about sowing season, irrigation, pest/disease control, and fertilizer
for 16 crops grown across Maharashtra, using a small curated knowledge base plus the Gemini API for
grounded natural-language generation.

---

## How it works (architecture)

```
Farmer's question
      │
      ▼
[1] Frontend (index.html + script.js) — sends the raw question to /api/chat
      │
      ▼
[2] Serverless function (api/chat.js) — retrieves the 1–3 most relevant
      records from knowledge_base.json using keyword scoring
      │
      ▼
[3] Gemini API — generates a farmer-friendly answer, instructed to use
      ONLY the retrieved records (grounded generation, not open-ended)
      │
      ▼
[4] Response returned to the browser with the answer + which sources were used
```

The Gemini API key lives only on the server (Vercel environment variable) — it is never sent to
the browser, which is why the chat call goes through `/api/chat` instead of calling Gemini directly
from `script.js`.

---

## What you need before you start

| Item | Where to get it | Cost |
|---|---|---|
| A **Google AI Studio API key** for Gemini | https://aistudio.google.com/apikey — sign in with any Google account, click "Create API key" | Free tier (rate-limited, no card needed) |
| A **Sarvam AI API key** (powers the mic button + "Listen" button) | https://dashboard.sarvam.ai — sign up, then API Keys | Free tier available |
| A **GitHub account** | https://github.com | Free |
| A **Vercel account** | https://vercel.com — sign up with your GitHub account | Free (Hobby plan) |
| Node.js installed locally (only if you want to test before deploying) | https://nodejs.org (LTS version) | Free |

You do **not** need IBM watsonx/Granite access, a paid Gemini plan, a domain name, or a database —
everything here runs on free tiers.

**One thing to note about the Gemini free tier:** Google's free tier terms state that prompts/outputs
on the free tier can be used to improve their models. That's fine for a student project with no
personal data, but don't put real farmers' personal information through it.

---

## Step-by-step: build and deploy

### 1. Get your Gemini API key
1. Go to https://aistudio.google.com/apikey
2. Sign in, click **Create API key**, choose "Create in new project" if asked.
3. Copy the key somewhere safe — you'll paste it into Vercel in step 5, not into any file you commit.
4. Open https://ai.google.dev/gemini-api/docs/models and note the current **free-tier Flash model
   name** (it changes over time — as of writing, `gemini-2.5-flash` is a safe default already set in
   this repo). Update `GEMINI_MODEL` later if it's changed.

### 2. Create the GitHub repository
1. Create a new empty repository on GitHub (e.g. `agrosaathi`).
2. On your computer, unzip the project files you downloaded from this conversation into a folder.
3. In that folder, run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit — AgroSaathi RAG chatbot"
   git branch -M main
   git remote add origin https://github.com/<your-username>/agrosaathi.git
   git push -u origin main
   ```

### 3. Test locally (optional but recommended)
```bash
npm install -g vercel
cp .env.example .env.local
# edit .env.local and paste your real keys after GEMINI_API_KEY= and SARVAM_API_KEY=
vercel dev
```
Open the local URL it prints and try the chat. If it works locally, deployment will too.

### 4. Deploy to Vercel
1. Go to https://vercel.com/new
2. Import the `agrosaathi` GitHub repo you just pushed.
3. Leave all build settings as default (Vercel auto-detects the `/api` folder as serverless functions
   and serves `index.html` as a static file — no build command needed).
4. **Before clicking Deploy**, add these Environment Variables:
   - Name: `GEMINI_API_KEY` — Value: *(paste your real Gemini key)*
   - Name: `SARVAM_API_KEY` — Value: *(paste your real Sarvam key — needed for the mic button and "Listen" button; the app still works for typed questions without it)*
   - (Optional) add `GEMINI_MODEL` too if you want to override the default.
5. Click **Deploy**. Vercel gives you a live URL like `agrosaathi.vercel.app` within ~1 minute.

### 5. Verify it's live
Open the Vercel URL, ask a question like "pest control for cotton", and confirm you get a grounded
answer with a "sources" panel. Try the EN / हिं / मर toggle in the header, and tap the mic button
to ask a question by voice — the app detects the language you spoke and replies in the same language.

### 6. Every future change
Just `git push` to `main` — Vercel automatically redeploys on every push, no manual step needed.

---

## Project structure

```
agrosaathi/
├── index.html            → chat UI (language toggle + mic button)
├── style.css              → all styling
├── script.js               → frontend logic: i18n, voice recording, talks to /api/*
├── knowledge_base.json      → 16 crop advisory records (the "retrieval" data)
├── api/
│   ├── chat.js               → serverless function: retrieval + Gemini call (answers in the farmer's language)
│   ├── transcribe.js          → serverless function: Sarvam speech-to-text with language auto-detect
│   └── speak.js                → serverless function: Sarvam text-to-speech ("Listen" button)
├── package.json
├── .env.example
└── README.md               → this file
```

## Extending the knowledge base
To add a crop, add an object to `knowledge_base.json` with the same fields
(`crop`, `season`, `soil`, `irrigation`, `pest`, `fertilizer`, `sustain`). No code changes needed —
the retrieval logic in `api/chat.js` automatically picks up new entries. If you'd like Hindi/Marathi
voice queries to match the new crop too, add its aliases to `CROP_ALIASES` in `api/chat.js`.

## Multi-language & voice (how it works)
```
Farmer taps mic → browser records audio (MediaRecorder)
      │
      ▼
[1] /api/transcribe — sends audio to Sarvam AI speech-to-text with
      language_code="unknown", which auto-detects the spoken language
      and returns transcript + detected BCP-47 language code
      │
      ▼
[2] Frontend switches the UI to the detected language and sends the
      transcript to /api/chat along with that language code
      │
      ▼
[3] /api/chat retrieves matching knowledge-base records (matching works
      across English/Hindi/Marathi keywords + crop names) and instructs
      Gemini to write its entire answer in the farmer's language
      │
      ▼
[4] Farmer can also tap "Listen" on any reply → /api/speak sends the
      answer text to Sarvam text-to-speech and plays the audio back
```
- The **EN / हिं / मर** toggle in the header lets a farmer set the language manually (for typed
  questions) instead of using voice; it's remembered in the browser via `localStorage`.
- Voice auto-detection isn't limited to those three — Sarvam recognizes several Indian languages
  (Gujarati, Tamil, Telugu, etc.); `api/chat.js`'s `LANGUAGES` map already covers the major ones, so
  the *reply* still comes back correctly even for a language that isn't a toggle button yet. Add a
  translation block to `I18N` in `script.js` to give that language full UI copy too.
- Both voice features degrade gracefully: if `SARVAM_API_KEY` isn't set, typing still works exactly
  as before — only the mic and "Listen" buttons need that key.

## Responsible AI notes (see submission PDF for full section)
- The assistant is instructed to answer **only** from the retrieved knowledge-base records — it does
  not free-generate agronomy advice, which limits hallucination.
- It never states exact pesticide/fertilizer dosages; it always points to the local KVK for that.
- No personal or location data is collected, stored, or logged by this app.
- Every reply's retrieved sources are shown to the user, so the reasoning is inspectable.
