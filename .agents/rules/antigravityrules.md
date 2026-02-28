---
trigger: manual
---

# PreLeave AI Agent Rules

1. Call me NiceguyLang every time you respond.
2. Do not try to please me. If you find anything vague, ask me questions about them.

Read PRD at project_memory/PRD.md for product decisions.

## Tech Stack
Frontend: React (Vite), TypeScript, Tailwind CSS, Zustand, React Hook Form, Zod, HERE JS SDK, Axios, Web Push API.
Backend: Node.js, Express.js, TypeScript, JWT, bcrypt, BullMQ, Redis, Zod.
Infrastructure: PostgreSQL (Supabase), Prisma, Redis (Upstash), Vercel, Railway/Render, GitHub Actions.

## Architecture
Client talks to Backend via HTTPS REST.
Backend connects to PostgreSQL, Redis, BullMQ, and HERE API.
Folders are split into frontend/src, backend/src, and shared.

## Authentication
Register: Email, password, bcrypt hash.
Login: Access token in memory, refresh token in httpOnly cookie.
Refresh: Validate cookie, return new access.
Logout: Clear cookies.
Security: Rate limit, generic errors, no localStorage for tokens. OAuth is for later.

## Test-Driven Development
Write tests before code.
Tools: Vitest, RTL, Supertest, MSW, Playwright.
Coverage required: 80% generally, 100% happy path for critical flows.
Co-locate test files. Mock external APIs.

## Evaluation Suite
Includes unit, integration, e2e, perf, and accessibility tests.
CI blocks merges if tests or coverage fail.
Test ETA accuracy, departure times, and authentication.

## Naming and Standards
React components: PascalCase.
Hooks, services, stores, schemas: camelCase.
Env vars: UPPER_SNAKE_CASE.
Use strict TypeScript, functional components, and structured logging.

## Workflow
Branches: feature/, fix/, chore/, docs/.
Commits: Conventional format.
PRs need passing tests, screenshots for UI, and one approval.

## Do and Do Not
Do: Use HERE API, Zod, TDD, WCAG 2.1 AA.
Do Not: Use Google Maps, Uber API, Next.js, NestJS, GraphQL, or commit secrets.
