# OpsPilot

OpsPilot is a production-style modular monolith backend for incident and knowledge management.

## Tech Stack

- Node.js, TypeScript, Express
- Prisma, PostgreSQL
- Redis, RabbitMQ, MinIO
- Zod, Pino
- Vitest, Supertest
- Docker Compose

## Current Scope

Week 1 focuses on Milestone 0 and Milestone 1:

- Backend project foundation
- Docker Compose infrastructure
- Health and readiness endpoints
- Auth foundation: register, login, refresh, logout, current user
- OAuth2-ready identity model
- Organizations: create, list, detail

## Local Setup

```bash
npm install
npm run docker:up
cp apps/api/.env.example apps/api/.env
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

API defaults to `http://localhost:3000`.

API docs:

- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/openapi.json`
