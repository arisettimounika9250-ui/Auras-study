# AuraStudy

AuraStudy is a full-stack student study companion: **Vibe · Plan · Focus · Learn · Track**. It includes a React/Vite frontend, Express REST API, MongoDB persistence, JWT authentication, and a provider-based study assistant with Mock AI as the default.

## Requirements

- Node.js 20 or newer
- MongoDB running locally or a MongoDB connection string

## Setup

From the project root:

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

Copy `backend/.env.example` to `backend/.env` and set `MONGODB_URI` and a long random `JWT_SECRET`. The API loads its environment from `backend/.env`. Set `AI_PROVIDER=mock` to use the built-in provider without an API key. The frontend expects the API at `http://localhost:4000/api`; set `VITE_API_URL` at frontend build time to use a different URL.

Start both frontend and backend from the root:

```bash
npm run dev
```

Or run them separately:

```bash
npm run dev --prefix backend
npm run dev --prefix frontend
```

The frontend runs at `http://localhost:5173`; the API runs at `http://localhost:4000` unless `PORT` is set in `backend/.env`. MongoDB must be available before registration and other API requests can succeed.

For MongoDB Atlas, make sure the cluster is running, add your current public IP under **Security → Network Access**, and verify the database user's credentials in `backend/.env`. URL-encode special characters in the username or password used in `MONGODB_URI`. If the API cannot connect, `/api/health` and API requests return HTTP `503` with code `DATABASE_UNAVAILABLE` and troubleshooting guidance.

## Deploy to Vercel

Import the repository into Vercel with the repository root as the project root. The included `vercel.json` builds the frontend into `frontend/dist`, serves it at the site root, and sends `/api/*` requests to the Express function. Configure `MONGODB_URI` and a random `JWT_SECRET` (at least 32 characters) in the Vercel project environment variables for every deployment environment, then redeploy. Ensure your MongoDB deployment accepts connections from the Vercel function.

In the app, open **Subjects** and use **Add topics for all groups** to add general starter subjects and Easy, Medium, and Hard topics for CSE, ECE, EEE, MECH, CIVIL, CSE (AI&DS), and Other. You can add just one selected group instead. Existing matching subjects and topics are reused, and previous starter topics have their difficulty levels updated. On a subject page, choose **Suggest topics with AI** to review AI suggestions before adding them. Starter topics are not an official university syllabus; review them against your course.

## Optional AI providers

Mock AI is deterministic, uses stored study context, and requires no key. Optional providers are selected with `AI_PROVIDER=gemini`, `AI_PROVIDER=openai`, or `AI_PROVIDER=groq`; set `AI_API_KEY` in `backend/.env`. For OpenAI-compatible services, `AI_BASE_URL` and `AI_MODEL` can override defaults. Provider secrets remain on the backend.

## Main API groups

Authentication: `/api/auth`; profile: `/api/users`; subjects and topics: `/api/subjects`, `/api/topics`; tasks: `/api/tasks`; sessions: `/api/study-sessions`; vibes: `/api/vibes`; assistant: `/api/ai`; dashboard and analytics: `/api/analytics`; filtered activity: `/api/history`.
