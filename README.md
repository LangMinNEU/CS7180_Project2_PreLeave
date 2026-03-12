# PreLeave — Smart Trip Departure Planner

> A full-stack web app that tells you exactly when to leave and how to get there, before you're already late.

**Live Demo**
- 🌐 Frontend: [https://cs-7180-project2-preleave.vercel.app](https://cs-7180-project2-preleave.vercel.app)
- 🚀 Backend API: [https://cs7180project2preleave-production.up.railway.app](https://cs7180project2preleave-production.up.railway.app)

---

## Overview

PreLeave removes the guesswork from trip planning. Given a destination and required arrival time, it monitors real-time traffic via the **HERE Routing API**, recommends the best transit option (bus or Uber), calculates exactly when you need to leave, and sends you an **in-browser push notification** when it's time to go.

Users can save trip histories, manage multi-trip schedules, and receive proactive 30-minute and 5-minute departure reminders.

---

## Features

- 🔐 **Authentication** — Register / login with email + password (JWT + bcrypt)
- 🗺️ **Address Autocomplete** — HERE JS SDK autocomplete for fast address entry
- 🚌 **ETA Comparison** — Side-by-side Bus vs. Car/Uber ETA with a clear recommendation
- ⏰ **Departure Calculator** — Computes exactly when to leave based on real-time traffic
- 🔔 **Push Notifications** — In-browser Web Push alerts at 30 min and 5 min before departure
- 📋 **Trip Dashboard** — View, reuse, and delete your trip history
- 🔄 **Background ETA Refresh** — Server automatically refreshes ETAs every 10 minutes for upcoming trips
- 📱 **Mobile-First UI** — Responsive design for phone, tablet, and desktop

---

## Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | React (Vite) + TypeScript |
| Styling | Tailwind CSS |
| State Management | Zustand |
| Forms & Validation | React Hook Form + Zod |
| HTTP Client | Axios |
| Maps / Autocomplete | HERE JS SDK |
| Push Notifications | Web Push API (service worker) |
| Testing | Vitest + React Testing Library |

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express.js |
| Authentication | JWT (jsonwebtoken) + bcrypt |
| Validation | Zod |
| Scheduling | `setInterval`-based background schedulers |
| Push | web-push (VAPID) |
| Testing | Vitest + Supertest |

### Data & Infrastructure
| Layer | Technology |
|---|---|
| Database | PostgreSQL via [Supabase](https://supabase.com) |
| ORM | Prisma |
| Routing API | HERE Routing + Geocoding API |
| Frontend Hosting | [Vercel](https://vercel.com) |
| Backend Hosting | [Railway](https://railway.app) |
| CI/CD | GitHub Actions |

---

## Project Structure

```
CS7180_Project2_PreLeave/
├── frontend/                  # React (Vite) app
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Route-level pages
│   │   │   ├── AuthPage.tsx       # Login / Register
│   │   │   ├── HomePage.tsx       # Trip dashboard
│   │   │   ├── PlanPage.tsx       # New trip form
│   │   │   ├── TripResultPage.tsx # ETA results + save
│   │   │   └── ProfilePage.tsx    # History + logout
│   │   ├── stores/            # Zustand state stores
│   │   ├── services/          # Axios API service layer
│   │   ├── schemas/           # Zod validation schemas
│   │   └── main.tsx
│   ├── vercel.json            # SPA rewrite rules
│   └── vite.config.ts
│
├── backend/                   # Express.js API
│   ├── src/
│   │   ├── controllers/       # Route handlers
│   │   │   ├── authController.ts
│   │   │   ├── tripController.ts
│   │   │   ├── userController.ts
│   │   │   └── autocompleteController.ts
│   │   ├── middleware/        # Auth middleware (JWT)
│   │   ├── routes/            # Express routers
│   │   ├── services/
│   │   │   ├── hereApiService.ts          # HERE API client
│   │   │   ├── pushService.ts             # Web Push VAPID
│   │   │   ├── notificationScheduler.ts   # 30min/5min reminders
│   │   │   └── etaRefreshScheduler.ts     # Background ETA refresh
│   │   └── index.ts           # App entry point
│   ├── prisma/
│   │   └── schema.prisma      # DB schema
│   └── tests/
│
├── project_memory/
│   ├── PRD.md                 # Product Requirements Document
│   └── mockup/                # UI mockups
└── shared/                    # Shared types (if any)
```

---

## Setup Instructions

### Prerequisites
- Node.js ≥ 18
- A [Supabase](https://supabase.com) project (PostgreSQL)
- A [HERE Developer](https://developer.here.com) account (free tier)
- VAPID keys (generate with `npx web-push generate-vapid-keys`)

### 1. Clone the repo

```bash
git clone https://github.com/LangMinNEU/CS7180_Project2_PreLeave.git
cd CS7180_Project2_PreLeave
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env   # fill in your values (see below)
npm install
npx prisma migrate deploy
npm run dev
```

**Required env vars (`backend/.env`):**
```env
DATABASE_URL=postgresql://...         # Supabase connection string
JWT_SECRET=<random 64-byte hex>
HERE_API_KEY=<your HERE API key>
VAPID_PUBLIC_KEY=<generated>
VAPID_PRIVATE_KEY=<generated>
VAPID_SUBJECT=mailto:you@example.com
FRONTEND_URL=http://localhost:5173    # Update for production
NODE_ENV=development
```

### 3. Frontend setup

```bash
cd frontend
cp .env.example .env   # or create manually
npm install
npm run dev
```

**Required env vars (`frontend/.env`):**
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### 4. Run tests

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

---

## API Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ | Register new user |
| `POST` | `/api/auth/login` | ❌ | Login, returns access token |
| `POST` | `/api/auth/logout` | ❌ | Clear refresh cookie |
| `GET` | `/api/auth/refresh` | Cookie | Get new access token |
| `GET` | `/api/trips` | ✅ | Get all trips for user |
| `POST` | `/api/trips` | ✅ | Create new trip |
| `PUT` | `/api/trips/:id` | ✅ | Update trip (transit selection) |
| `DELETE` | `/api/trips/:id` | ✅ | Delete trip |
| `POST` | `/api/trips/:id/refresh-eta` | ✅ | Manually refresh ETA |
| `GET` | `/api/autocomplete` | ✅ | HERE address autocomplete |
| `POST` | `/api/push/subscribe` | ✅ | Register push subscription |
| `GET` | `/health` | ❌ | Health check |

---

## Team Members

| Name | Role |
|---|---|
| Shuhan Dong | Full-stack Developer |
| Min Lang | Full-stack Developer |

*CS7180 — Northeastern University, Spring 2026*

---

## Architecture

```
┌──────────────────────────────────────────────┐
│           Client (Browser / PWA)             │
│    React + TypeScript + Tailwind + SW        │
│          Web Push (service worker)           │
└──────────────────┬───────────────────────────┘
                   │ HTTPS / REST
┌──────────────────▼───────────────────────────┐
│         Backend API (Node / Express)         │
│  Auth │ Trip CRUD │ Routing Proxy │ Scheduler│
└────┬─────────────────┬──────────────┬────────┘
     │                 │              │
┌────▼────┐   ┌────────▼──────┐  ┌───▼──────────────┐
│PostgreSQL│   │  Schedulers   │  │ HERE Routing API │
│(Supabase)│   │ (setInterval) │  │ (Geocode + ETA)  │
└──────────┘   └────────┬──────┘  └──────────────────┘
                         │
               ┌─────────▼──────────┐
               │  Web Push VAPID    │
               │  (via backend)     │
               └────────────────────┘
```

---

## License

MIT
