# Health Valut 🏥

A digital health locker, patient–doctor platform, health management system, and AI health assistant — built as a full-stack web app.

- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** JWT + bcrypt
- **AI:** Anthropic API (Claude), with automatic demo-mode fallback if no key is set

```
health-valut/
├── backend/     Express API, Prisma schema, seed script
└── frontend/    React app (Vite)
```

---

## 1. Quick start (local development)

### Prerequisites
- Node.js 18+
- A PostgreSQL database — the easiest free options are [Neon](https://neon.tech), [Supabase](https://supabase.com), or a local Postgres install. Render also offers a free managed Postgres instance.

### Backend

```bash
cd backend
cp .env.example .env
# edit .env: set DATABASE_URL to your Postgres connection string,
# and set JWT_SECRET to any long random string

npm install                    # also runs `prisma generate`
npx prisma migrate dev --name init   # creates tables
npm run seed                   # optional: adds demo patient + doctor accounts
npm run dev                    # starts the API on http://localhost:5000
```

Demo logins created by the seed script:
- **Patient** — `patient@demo.com` / `patient123`
- **Doctor** — `doctor@demo.com` / `doctor123`

### Frontend

In a second terminal:

```bash
cd frontend
cp .env.example .env
# VITE_API_URL defaults to http://localhost:5000/api, which matches the backend above

npm install
npm run dev                    # starts the app on http://localhost:5173
```

Open http://localhost:5173 and sign in with a demo account, or register a new patient/doctor.

### Optional: enable real AI responses

By default, the AI Assistant, Report Explainer, Prescription Analyzer, and Health Summary features run in **demo mode** — they work out of the box and clearly label their responses as demo output. To get real AI responses, set `ANTHROPIC_API_KEY` in `backend/.env` to a valid Anthropic API key, then restart the backend.

---

## 2. Importing into an IDE

This folder is a standard two-package Node.js project — it opens directly in VS Code, Antigravity, or any IDE with no special setup. Open the `health-valut` folder as your workspace root; the `backend` and `frontend` folders are independent npm projects (separate `package.json`, `node_modules`, and `.env` files).

---

## 3. Deploying

### Backend → Render

1. Push this project to a GitHub repository.
2. In Render, create a **New Web Service**, connect your GitHub repo, and set the root directory to `backend`. (A `render.yaml` is included — Render can also pick this up automatically via "New Blueprint Instance".)
3. Create a Render **PostgreSQL** database (or use Neon/Supabase) and copy its connection string.
4. Set these environment variables on the Render service:
   - `DATABASE_URL` — your Postgres connection string
   - `JWT_SECRET` — a long random string (Render can auto-generate this)
   - `JWT_EXPIRES_IN` — `7d`
   - `CORS_ORIGIN` — your deployed Vercel URL (e.g. `https://health-valut.vercel.app`) — comma-separate multiple origins if needed
   - `ANTHROPIC_API_KEY` — optional, for live AI features
5. Build command: `npm install && npm run build && npx prisma migrate deploy`
   Start command: `npm start`
6. Once deployed, note your backend URL (e.g. `https://health-valut-backend.onrender.com`) — you'll need `https://<that-url>/api` for the frontend.

### Frontend → Vercel

1. In Vercel, **Import Project** from the same GitHub repo, and set the root directory to `frontend`.
2. Vercel auto-detects Vite (`npm run build`, output directory `dist`). A `vercel.json` is included for SPA routing.
3. Set the environment variable:
   - `VITE_API_URL` = `https://<your-render-backend-url>/api`
4. Deploy. Once live, copy your Vercel URL back into the backend's `CORS_ORIGIN` env var on Render and redeploy the backend so it accepts requests from your frontend.

### Order of operations
Deploy the backend first (Render) → copy its URL into the frontend's `VITE_API_URL` → deploy the frontend (Vercel) → copy the frontend's URL into the backend's `CORS_ORIGIN` → redeploy the backend once more.

---

## 4. What's implemented (Core MVP)

- Patient & doctor authentication and profiles
- **My Health Vault** — digital medical locker with upload, search, filter, and delete
- **Health Timeline** — chronological medical history, separate from raw documents
- **Doctor Discovery** — search by name, specialization, location
- **Appointment Booking** — slots → request → doctor approval/rejection → confirmed/cancelled/completed/no-show
- **Patient-Controlled Authorization** — granular per-doctor access (all records, or specific categories: history, lab reports, prescriptions, scans, hospital records), revocable at any time
- **Doctor Patient Overview** — consolidated authorized view of a patient's profile, history, records, and prescriptions
- **Doctor Record Contribution** — doctors can add records for authorized patients, with traceability
- **Digital Prescriptions** — structured medicines with dosage/frequency/duration/instructions
- **Reminders** — medicine, appointment, lab, hospital, and follow-up reminders
- **Notifications** — appointment requests/approvals, new prescriptions, access changes
- **Audit Logging** — key actions recorded for traceability
- **AI features** (demo-mode by default, live with an API key):
  - Conversational Health Assistant (general info + first-aid guidance, not a diagnosis)
  - AI Prescription Analyzer
  - AI Medical Report Explainer
  - AI Patient Health Summary

### Not yet built (documented as Advanced/Future scope in the original spec)
Emergency Quick View has a basic API endpoint (`GET /api/patients/me/emergency-overview`) but no dedicated UI screen yet. OCR/document extraction, mobile apps, video consultations, payments, and pharmacy/lab/hospital/wearable integrations are out of scope for this web MVP, as outlined in the original project description.

---

## 5. Tech notes

- File uploads (lab reports, scans, prescriptions) are stored on local disk under `backend/uploads` and served at `/uploads/<filename>`. This works for a hackathon/demo deployment; for production-grade persistence on Render (which has an ephemeral filesystem on the free tier), consider swapping in an object storage provider (e.g. Supabase Storage or Cloudflare R2) — the upload middleware in `backend/src/middleware/upload.ts` is the only place that would need to change.
- The database schema lives in `backend/prisma/schema.prisma`. Run `npx prisma studio` from the `backend` folder for a visual database browser during development.
