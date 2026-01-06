# CivicLink Backend (NestJS + Prisma 7 + PostgreSQL)

This repository contains the **backend REST API** that powers the CivicLink **web frontend** and also supports a **future mobile app** via a clean JSON-based API.

## Description
CivicLink is a real-world civic issue reporting and management platform where:
- **CITIZEN** users report civic issues (potholes, broken streetlights, noise, etc.)
- **DISPATCHER** users triage issues, update status, and coordinate resolution
- **ADMIN** users manage users, roles, and system-level configuration

---

## Tech Stack
- **Runtime:** Node.js
- **Framework:** NestJS
- **ORM:** Prisma **7**
- **Database:** PostgreSQL
- **Auth:** JWT (Bearer tokens) + Role-Based Access Control (RBAC)
- **Validation:** class-validator, class-transformer
- **API Docs:** OpenAPI / Swagger UI

---

## Project Architecture (Feature-Based NestJS)
The backend follows a **feature-based module architecture**: each product capability is implemented as a feature module, while infrastructure and shared utilities are separated for maintainability and scalability.

```text
src/
  core/                # infrastructure (e.g., Prisma)
    prisma/
  common/              # shared helpers (decorators, guards, utilities)
  features/            # business capabilities
    auth/              # register/login, JWT strategy, guards
    users/             # user management + profile APIs
    issues/            # issue CRUD, pagination, status/history workflows
    health/            # system endpoints (/, /health)
  app.module.ts        # composition root (wires feature modules)
  main.ts              # bootstrap (pipes, CORS, Swagger)
```

### Key principles
- `AppModule` is composition-only (imports feature modules).
- Infrastructure (Prisma) lives in `src/core`.
- Reusable guards/decorators/utilities live in `src/common`.

---

## API Documentation (Swagger / OpenAPI)
Swagger UI is available (typically in non-production environments) at:

- `GET /docs`

Swagger supports **JWT Bearer authentication**. After login, copy the token and click **Authorize** in Swagger UI.

---

## Getting Started

### Prerequisites
- Node.js (LTS recommended)
- PostgreSQL running locally or via Docker
- Git

### Install dependencies
```bash
npm install
```

### Database Setup (Prisma 7)
Generate Prisma client:
```bash
npx prisma generate
```

Apply migrations:
```bash
npx prisma migrate dev
```

(Optional) Open Prisma Studio:
```bash
npx prisma studio
```

### Environment Variables
Create a `.env` file in the repository root (do not commit it):

```env
# Database
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/civiclink?schema=public"

# JWT
JWT_SECRET="change-me"
JWT_EXPIRES_IN="1d"

# App
NODE_ENV="development"
```

Notes:
- If your DB password contains special characters (`@`, `:`, `#`, `/`), URL-encode them in `DATABASE_URL`.

### Run the app (development)
```bash
npm run start:dev
```

---

## Development Notes
- Keep changes feature-scoped and incremental (small commits/PRs).
- Use DTO validation consistently (`class-validator` + `class-transformer`).
- Prefer controller-level authorization using:
  - `JwtAuthGuard` for authentication
  - `RolesGuard` + `@Roles(...)` for RBAC enforcement
- Avoid logging secrets (never log full `process.env`).
- Maintain consistent pagination conventions (`page`, `pageSize`) and return metadata (`total`, `totalPages`).
