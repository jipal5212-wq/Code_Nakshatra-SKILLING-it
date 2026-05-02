# S-KILLING it — Daily Execution Platform

> Not a course. Not a tutorial. A 24-hour execution loop that forces you to learn, build, and submit — every single day.

## Quick Start

```bash
cd SKILLING-IT
npm install
npm start
```

Open `http://localhost:3000`

## Structure

```
SKILLING-IT/
├── server.js          # Express backend (auth, tasks, submissions, AI, YouTube)
├── public/
│   ├── index.html     # Landing page
│   ├── login.html     # Auth page
│   ├── dashboard.html # User dashboard
│   └── admin.html     # Admin panel
├── database.json      # Persistent file-based DB
├── uploads/           # User submission files
├── .env               # API keys (Gemini, YouTube)
└── vercel.json        # Vercel deployment config
```

## Features

- **Daily Task Loop** — Pick from curated tasks, execute, submit proof
- **Streak System** — Track daily consistency
- **Admin Panel** — Review submissions, assign tasks, manage content
- **AI Mentor** — Gemini-powered task generation & evaluation
- **YouTube Integration** — Auto-curated learning videos
- **File & GitHub Submissions** — Multiple proof-of-work formats

## Deploy to Vercel

```bash
cd SKILLING-IT
npx vercel --prod
```

## Admin Login

- **Email:** ashish21@gmail.com
- **Password:** killingit
