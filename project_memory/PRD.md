# Product Requirements Document (PRD)
# PreLeave — Smart Trip Departure Planner

**Version**: 1.0  
**Date**: 2026-02-25  
**Status**: Draft — Approved Decisions Incorporated

---

## 1. Executive Summary

**PreLeave** is a full-stack web application that removes the guesswork from trip planning. It monitors real-time traffic conditions before a user's required arrival time, then recommends the most reliable transit option (**bus** or **Uber**) and notifies users in-browser when it's time to leave. Users can save trip histories, manage multi-trip schedules, and receive proactive departure reminders.

---

## 2. Problem Statement

People miss appointments because they check traffic too late or forget to plan departure time entirely. Existing navigation apps require users to actively open and check — there is no proactive alerting or integrated decision-making tied to a personal schedule.

**PreLeave** solves this by acting as an autonomous departure advisor: given a destination and required arrival time, it checks traffic at the right moment and tells users exactly when to leave and how to get there.

---

## 3. Goals & Success Metrics

| Goal | Metric |
|---|---|
| Reduce user lateness | ≥80% of users report arriving on time after using suggestions |
| Drive daily engagement | ≥3 trips planned per active user per week |
| User retention | ≥60% 30-day retention |
| Accurate transit estimates | ETA error within ±5 min for 90% of trips |
| Fast time-to-plan | User can create a trip in ≤60 seconds |

---

## 4. User Personas

### Persona 1 — The Chronic Late-Comer
- Frequently forgets to check traffic in advance
- Needs proactive in-browser reminders when it's time to leave
- Wants zero configuration: set it and forget it

### Persona 2 — The Carless Commuter (Graduate Student)
- Relies exclusively on public transit and rideshare
- Needs a quick, decisive answer: **bus or Uber?**

### Persona 3 — The Busy Professional
- Has multiple appointments per day
- Wants a dashboard to manage all trips in one place
- Values trip history for recurring routes

### Persona 4 — The Privacy-Conscious User
- Wants a password-protected personal account
- Does not want trip data shared publicly

---

## 5. User Stories & Acceptance Criteria

### Epic 1 — Trip Planning

| ID | User Story | Acceptance Criteria |
|---|---|---|
| US-01 | As a traveler, I want to enter start location, destination, and arrival time so the app can suggest transportation. | Given valid inputs, app returns bus ETA and Uber ETA within 5 seconds. |
| US-02 | As a carless commuter, I want to quickly see whether bus or Uber is better for my trip. | App shows a clear recommendation card (Bus / Uber) with estimated travel time for each option. |
| US-03 | As a busy person, I want to schedule trips in advance so the app can remind me when to leave. | App sends an in-browser push notification at the calculated departure time. |

### Epic 2 — Account & History

| ID | User Story | Acceptance Criteria |
|---|---|---|
| US-04 | As a daily commuter, I want trip history saved so I can reuse past routes. | Past trips are listed in "My Trips"; user can tap to re-create a trip from history. |
| US-05 | As a privacy-conscious user, I want a password-protected account. | Registration requires email + password; passwords are hashed; JWT-based session auth. |
| US-06 | As a multi-appointment user, I want to manage several trips in one dashboard. | Dashboard lists all upcoming trips with departure times and transit recommendations. |

---

## 6. Functional Requirements

### 6.1 Authentication & Authorization
- **FR-01**: User registration with email and password (bcrypt hashing)
- **FR-02**: Login / logout with JWT (access token + refresh token)
- **FR-03**: Protected routes — unauthenticated users cannot save trips or view history

### 6.2 Trip Creation & Routing
- **FR-04**: Input form: start address, destination address, required arrival date + time
- **FR-05**: Geocoding of text addresses to coordinates via **HERE Geocoding API** (free tier)
- **FR-06**: Routing via **HERE Routing API** (free tier) to fetch:
  - Real-time transit (bus) ETA
  - Real-time driving time → used as **Uber ETA proxy**
- **FR-07**: Departure time = `required_arrival_time − max(bus_ETA, driving_ETA, selected_option_ETA) − buffer`
- **FR-08**: Display side-by-side comparison card: Bus ETA vs. Uber ETA with a clear recommendation

### 6.3 Scheduled Monitoring & Reminders
- **FR-09**: User can schedule a trip for a future date/time
- **FR-10**: Background job checks traffic at a **fixed lead time before the required arrival time** (e.g., 60 min before), re-evaluates ETAs, and recalculates departure time
- **FR-11**: Send an **in-browser Web Push notification** at the calculated departure time containing route summary, recommended transit, and time to leave
- **FR-12**: Reminder gracefully degrades to on-screen alert if push permission is denied

### 6.4 Trip Management
- **FR-13**: "My Trips" dashboard: paginated list of upcoming and past trips
- **FR-14**: Ability to delete or duplicate a trip
- **FR-15**: "Use Again" button pre-fills the trip form from a past trip

### 6.5 Error Handling
- **FR-16**: If HERE API is unavailable, display the last cached estimate with a warning banner
- **FR-17**: If push notification permission is denied, fall back to an on-screen in-app alert

---

## 7. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | Trip ETA response ≤ 3 seconds (P95) |
| **Reliability** | 99.5% uptime for backend service |
| **Security** | HTTPS everywhere; bcrypt cost ≥ 12; access token expiry ≤ 15 minutes |
| **Scalability** | Backend handles 500 concurrent users without degradation |
| **Accessibility** | WCAG 2.1 AA compliant frontend |
| **Mobile-First** | Responsive UI for phones (primary), tablets, and desktops |
| **Data Privacy** | No trip data shared with third parties; GDPR-ready delete endpoint |

---

## 8. Out of Scope (v1.0)

- In-app Uber/Lyft booking or deep linking into rideshare apps
- Native mobile app (iOS/Android) — web app only
- Real-time live bus tracking (ETA estimates only)
- Carpooling, multi-stop routing
- Payment integration
- User-configurable reminder lead time (fixed at system default for v1)
- Social or sharing features

---

## 9. Tech Stack

### Resolved Decisions
| Decision | Choice | Rationale |
|---|---|---|
| Traffic & Routing API | **HERE Routing + Geocoding API** | Most generous free tier (250K transactions/month free) |
| Uber ETA | **Driving time from HERE API** (proxy) | No Uber API integration needed; driving time is a reliable proxy |
| Reminder delivery | **In-browser Web Push** (service worker) | Native browser feature; no third-party service cost |
| Reminder lead time | **Fixed system default** (e.g., 60 min before arrival) | User-configurable lead time deferred to v2 |

### Frontend
| Layer | Choice |
|---|---|
| Framework | React (Vite) + TypeScript |
| Styling | Tailwind CSS |
| State | Zustand |
| Forms & Validation | React Hook Form + Zod |
| Maps Autocomplete | HERE JS SDK (Autocomplete widget) |
| HTTP Client | Axios |
| Push Notifications | Web Push API via service worker |

### Backend
| Layer | Choice |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express.js |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Job Queue | BullMQ + Redis |
| Validation | Zod |

### Data
| Layer | Choice |
|---|---|
| Primary DB | PostgreSQL (hosted on **Supabase** — free tier) |
| ORM | Prisma |
| Cache / Queue | Redis (hosted on **Upstash** — free tier) |

### Infrastructure
| Layer | Choice |
|---|---|
| Frontend Hosting | Vercel (free tier) |
| Backend Hosting | Railway (free trial) or Render (free tier) |
| CI/CD | GitHub Actions |

---

## 10. System Architecture Overview

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
│PostgreSQL│   │ Redis + BullMQ│  │ HERE Routing API │
│(Supabase)│   │  (Upstash)    │  │ (Geocode + ETA)  │
└──────────┘   └────────┬──────┘  └──────────────────┘
                         │ (background worker)
               ┌─────────▼──────────┐
               │  Web Push VAPID    │
               │  (via backend)     │
               └────────────────────┘
```

---

## 11. Database Schema (Conceptual)

```
User
├── id (UUID)
├── email (unique)
├── password_hash
├── push_subscription (JSON)
└── created_at

Trip
├── id (UUID)
├── user_id → User
├── start_address
├── start_lat, start_lng
├── dest_address
├── dest_lat, dest_lng
├── required_arrival_time (datetime)
├── reminder_lead_minutes (default: 60)
├── status (pending | reminded | completed | cancelled)
├── recommended_transit (bus | uber)
├── bus_eta_minutes
├── uber_eta_minutes
├── departure_time (computed)
└── created_at
```

---

## 12. Phased Delivery Roadmap

| Phase | Scope | Target |
|---|---|---|
| **Phase 1 — MVP** | Auth, trip creation form, real-time ETA comparison (bus vs. Uber proxy) | Week 1–2 |
| **Phase 2 — Scheduling & Push** | Save future trips, BullMQ job, Web Push reminder at departure time | Week 3–4 |
| **Phase 3 — Dashboard & History** | My Trips, trip history, "Use Again" feature | Week 5 |
| **Phase 4 — Polish** | Responsiveness, error states, accessibility, service worker offline support | Week 6 |

---

## 13. Open Questions (Resolved)

| # | Question | Decision |
|---|---|---|
| 1 | Which traffic API? | **HERE** (free tier) |
| 2 | How to estimate Uber ETA? | **Driving time from HERE** (proxy) |
| 3 | Notification delivery? | **In-browser Web Push** |
| 4 | Fixed or configurable reminder lead time? | **Fixed default** for v1 (e.g., 60 min before arrival) |
