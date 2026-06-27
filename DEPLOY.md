# Deploying Vitality Prep to Vercel + Firebase

This is a Progressive Web App (PWA) backed by Firebase Firestore with
WebAuthn (Face ID / Touch ID) login. Hosted on Vercel's free tier.

## One-time setup

### 1. Firebase

Project: `vitalityprep-33106` (already created).

Enable in Firebase Console:

- **Authentication**: visit the Authentication tab once to initialize
  the service. No specific sign-in provider needs to be enabled —
  this app uses Custom Tokens minted by the Admin SDK.
- **Authentication → Settings → Authorized domains**: add your Vercel
  domain (e.g. `vitality-prep.vercel.app`) once you know it.
- **Firestore Database**: create in production mode, region
  `europe-west3` (or any region — pick once).
- **Firestore → Rules**: paste contents of `firestore.rules` and publish.

Generate an admin service account:

1. Firebase Console → ⚙️ Project Settings → Service accounts
2. Click **Generate new private key** → save the JSON.
3. You'll paste this into Vercel as the `FIREBASE_ADMIN_KEY` env var.

### 2. Vercel

```powershell
git init
git add .
git commit -m "Initial PWA migration"
git remote add origin https://github.com/ferzool/VitalityPrep.git
git push -u origin main
```

Then on vercel.com:

1. **New Project** → Import Git Repository → pick `VitalityPrep`.
2. **Framework Preset**: leave as `Other` (vercel.json overrides build).
3. **Build Command**: leave (uses `vercel.json` → `npx expo export --platform web`).
4. **Output Directory**: leave (`dist`).
5. **Environment Variables** (Production + Preview):
   - `FIREBASE_ADMIN_KEY` = entire contents of the service account JSON
     (paste the whole JSON object as the value)
   - `WEBAUTHN_RP_ID` = `vitality-prep.vercel.app`
     (your actual production domain, no protocol, no port)
   - `WEBAUTHN_ORIGIN` = `https://vitality-prep.vercel.app`
6. **Deploy**.

### 3. Enroll the first user

After the first deploy succeeds:

1. On the iPhone, open Safari and visit `https://your-domain.vercel.app/admin/enroll`.
2. Enter your display name (e.g. `Iman`) and tap **Passkey einrichten**.
3. Safari will prompt for Face ID — confirm.
4. The app will sign you in and redirect to the recipe list.

### 4. Enroll the second user

On the second iPhone, same flow:

1. Visit `/admin/enroll`.
2. Enter `Niloo`.
3. Confirm Face ID.

After two users are enrolled, the `/admin/enroll` endpoint will reject
further registrations (hardcoded `MAX_CREDENTIALS = 2`).

### 5. Daily use

1. Open `https://your-domain.vercel.app/` on either iPhone.
2. Tap **Mit Face ID anmelden**.
3. Confirm Face ID. You're in.

### 6. Add to Home Screen

In Safari: tap the share icon → **Add to Home Screen** → done. The app
icon will appear on the home screen and launch in standalone mode
(no browser chrome).

## Architecture

- **Frontend**: Expo Router static export to `dist/`, served by Vercel CDN.
- **Auth**: WebAuthn (passkey / Face ID) at `/api/webauthn/*` Vercel
  serverless functions. Mints a Firebase Custom Token on success;
  the client calls `signInWithCustomToken()` to obtain a Firebase user.
- **Data**: Firestore. All reads/writes restricted to authenticated
  users (rules in `firestore.rules`). Real-time sync via `onSnapshot`
  in `src/lib/firestoreSync.ts`.
- **Storage**: `_webauthn_credentials` (passkeys) and `_webauthn_challenges`
  (ephemeral, 5-min TTL) collections are admin-only — rules deny all
  client access.

## Cost

Vercel Hobby tier: 100 GB bandwidth/month. Free.
Firebase Spark tier: 1 GB storage, 50K reads, 20K writes, 20K deletes
per day. Free. For 2 users with ~1000 docs, well below limits.

## Local dev

```powershell
npm run web          # Expo dev server with web target
npm run build:web    # Build static export to dist/
```

API routes only run on Vercel. To test the auth flow locally you'll need
`vercel dev`:

```powershell
npm i -g vercel
vercel link
vercel dev
```
