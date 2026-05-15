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
cp apps/api/.env.example apps/api/.env
npm run docker:up
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Root `.env` is optional for local Docker because `docker-compose.yml` has development defaults. Copy `.env.example` to `.env` only when you want to override ports, images, container names, or credentials.

API defaults to `http://localhost:3000`.

API docs:

- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/openapi.json`

Auth email delivery uses SMTP. For Mailtrap, set these values in `apps/api/.env`:

```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=<mailtrap-user>
SMTP_PASS=<mailtrap-password>
MAIL_FROM=no-reply@your-verified-domain.com
MAIL_FROM_NAME=OpsPilot
```

## Local Infrastructure UI

RabbitMQ Management:

- URL: `http://localhost:15672`
- Username/password: `RABBITMQ_DEFAULT_USER` / `RABBITMQ_DEFAULT_PASS` from root `.env`

RedisInsight:

- URL: `http://localhost:5540`
- Add Redis database manually:
  - Host: `redis`
  - Port: `6379`
  - Password: `REDIS_PASSWORD` from root `.env`

MinIO Console:

- URL: `http://localhost:9001`
- Username/password: `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` from root `.env`
