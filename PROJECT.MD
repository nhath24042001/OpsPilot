# OpsPilot — AI-powered Incident & Knowledge Management Platform

## 1. Project Goal

Build a production-style backend project that demonstrates middle-level backend engineering skills with Node.js, TypeScript, Clean Architecture, CQRS-style application use cases, multi-tenant access control, RBAC, event-driven processing, Redis, RabbitMQ, PostgreSQL, Prisma, MinIO, WebSocket, and AI/RAG.

The system is an internal engineering platform for managing production incidents, service ownership, runbooks, postmortems, and AI-assisted troubleshooting.

The project should feel like a real internal platform used by engineering, SRE, DevOps, and support teams.

---

## 2. Product Context

OpsPilot helps engineering teams:

- Manage production incidents.
- Track incident lifecycle and timeline.
- Collaborate in realtime incident rooms.
- Manage service catalog and service ownership.
- Upload runbooks, logs, postmortems, and technical documents.
- Index internal documents into a knowledge base.
- Use a RAG-based AI assistant to answer questions from internal knowledge.
- Recommend related runbooks for incidents.
- Generate postmortem drafts from incident timeline.
- Send realtime notifications.
- Maintain audit logs for sensitive actions.

---

## 3. Main Tech Stack

### Runtime & Language

- Node.js
- TypeScript
- Express.js

### Database & ORM

- PostgreSQL
- Prisma ORM
- pgvector for vector search

### Cache / Distributed System

- Redis
  - Permission cache
  - Rate limiter
  - Distributed lock
  - WebSocket presence
  - Optional RAG response cache

### Message Broker

- RabbitMQ
  - Background jobs
  - Event-driven workflow
  - Retry
  - Dead-letter queue
  - Idempotent consumers

### Object Storage

- MinIO
  - Runbook uploads
  - Log file uploads
  - Incident screenshots
  - Generated postmortem reports

### Realtime

- WebSocket
  - Incident room updates
  - Notifications
  - Presence tracking

### AI / RAG

- LLM provider abstraction
- Embedding provider abstraction
- PostgreSQL pgvector semantic search
- Document chunking
- Source-grounded answers

### Testing

- Vitest
- Supertest
- Testcontainers
  - PostgreSQL
  - Redis
  - RabbitMQ
  - MinIO

### DevOps / Tooling

- Docker Compose
- ESLint
- Prettier
- GitHub Actions
- Pino logger
- Zod validation

---

## 4. Architecture Style

Use a modular monolith architecture.

Do not split into microservices. Instead, split the runtime into multiple processes:

```txt
api process       -> HTTP API + WebSocket
worker process    -> RabbitMQ consumers
scheduler process -> outbox publisher / scheduled jobs
```

Use Clean Architecture inside each module:

```txt
modules/<module-name>/
  domain/
    entities/
    value-objects/
    events/
    repositories/

  application/
    commands/
    queries/
    services/

  infrastructure/
    prisma/
    redis/
    rabbitmq/
    minio/
    llm/

  presentation/
    routes.ts
    controller.ts
    validator.ts
```

Rules:

- Domain must not depend on Express, Prisma, Redis, RabbitMQ, or MinIO.
- Application layer contains use cases.
- Infrastructure implements interfaces.
- Presentation handles HTTP/WebSocket input and validation.
- Keep CQRS lightweight: command handlers for writes, query handlers for reads.
- Do not implement full event sourcing.

---

## 5. Core Modules

```txt
identity
organizations
rbac
service-catalog
incidents
incident-timeline
collaboration
notifications
files
knowledge-base
ai-assistant
audit-logs
background-jobs
integrations
```

### Module Responsibilities

#### identity

- Register
- Login
- OAuth2 login/link account (basic provider integration)
- Refresh token
- Logout
- Current user

#### organizations

- Create organization/workspace
- List user's organizations
- Resolve organization context
- Manage organization membership

#### rbac

- Roles
- Permissions
- Role permissions
- Member roles
- Permission cache
- Authorization middleware

#### service-catalog

- Manage services such as auth-service, payment-service, notification-service.
- Assign service ownership.

#### incidents

- Create incident
- List incidents
- Assign incident
- Acknowledge incident
- Resolve incident
- Cancel incident

#### incident-timeline

- Timeline events
- Incident comments
- Action history

#### collaboration

- WebSocket incident room
- Realtime broadcast
- Presence tracking

#### notifications

- In-app notifications
- WebSocket notifications
- Optional email notification later

#### files

- Presigned upload URL
- Confirm upload
- Download URL
- File metadata
- MinIO integration

#### knowledge-base

- Knowledge documents
- Document status
- Text extraction
- Chunking
- Embedding
- Vector storage
- Semantic search

#### ai-assistant

- Ask knowledge base
- Recommend runbooks
- Generate postmortem draft
- Save conversations

#### audit-logs

- Track important actions
- Store actor, action, resource, metadata, IP, user agent

#### background-jobs

- RabbitMQ consumers
- Outbox publisher
- Retry and DLQ handling

---

## 6. Multi-tenant Model

`organization` is the tenant boundary.

Examples:

```txt
Organization: Acme Corp
Teams: Backend Team, DevOps Team, Support Team
Services: auth-service, payment-service, notification-service
Incidents: belong to one organization
Knowledge documents: belong to one organization
AI conversations: belong to one organization
```

Every tenant-owned table must contain:

```txt
organization_id
```

Important rule:

Never query tenant-owned resources by ID only.

Wrong:

```ts
where: { id: incidentId }
```

Correct:

```ts
where: {
  id: incidentId,
  organizationId: orgId,
}
```

For cross-tenant access attempts, prefer returning `404 Not Found` instead of `403 Forbidden` when the resource exists in another organization. This avoids leaking resource existence.

---

## 7. Organization Access Flow

### Register

```txt
POST /auth/register
```

Creates a user.

### Create organization

```txt
POST /organizations
```

Creates:

```txt
organizations
organization_members
roles
permissions
member_roles
```

The creator becomes `Owner`.

### List organizations

```txt
GET /organizations
```

Returns organizations where the user is a member.

### Access organization-scoped endpoint

Example:

```txt
GET /orgs/:orgId/incidents/:incidentId
```

Middleware pipeline:

```txt
authenticate
resolveOrganization
loadPermissions
authorize(permission)
controller
```

Details:

1. Verify JWT.
2. Extract user ID.
3. Extract orgId from params.
4. Check user is an active member of the organization.
5. Load permissions from Redis or DB.
6. Check required permission.
7. Query resource with organization filter.

---

## 8. RBAC Model

Default roles:

```txt
Owner
Admin
Incident Commander
Engineer
Viewer
```

Permissions:

```txt
organization:read
member:invite
role:manage

service:create
service:read
service:update
service:delete

incident:create
incident:read
incident:update
incident:assign
incident:resolve

knowledge:create
knowledge:read
knowledge:index
knowledge:delete

ai:ask
ai:summarize

audit:read
```

Redis permission cache key:

```txt
org:{orgId}:user:{userId}:permissions
```

Invalidate permission cache when:

- Role is updated.
- Permission is updated.
- Member role is changed.
- Member is removed from organization.

---

## 9. Incident Domain

### Incident Status

```txt
OPEN
ACKNOWLEDGED
RESOLVED
CANCELED
```

Allowed transitions:

```txt
OPEN -> ACKNOWLEDGED
OPEN -> RESOLVED
OPEN -> CANCELED
ACKNOWLEDGED -> RESOLVED
ACKNOWLEDGED -> CANCELED
```

### Severity

```txt
SEV1
SEV2
SEV3
SEV4
```

### Business Rules

- Resolved incident cannot be acknowledged again.
- Resolved incident cannot be assigned again.
- Resolving an incident requires root cause and resolution.
- SEV1 incident should have assigned user or assigned team.
- Only users with `incident:resolve` can resolve incidents.
- All incident changes should create timeline events.

### Important Endpoints

```txt
POST /orgs/:orgId/incidents
GET /orgs/:orgId/incidents
GET /orgs/:orgId/incidents/:incidentId
PATCH /orgs/:orgId/incidents/:incidentId/acknowledge
PATCH /orgs/:orgId/incidents/:incidentId/assign
PATCH /orgs/:orgId/incidents/:incidentId/resolve
PATCH /orgs/:orgId/incidents/:incidentId/cancel
GET /orgs/:orgId/incidents/:incidentId/timeline
POST /orgs/:orgId/incidents/:incidentId/comments
```

---

## 10. Event-driven Architecture

Use Transactional Outbox.

Do not publish RabbitMQ messages directly inside the request transaction.

Correct flow:

```txt
Begin DB transaction
Create/update business record
Create timeline event if needed
Create outbox event
Commit transaction
Outbox publisher publishes to RabbitMQ
Consumer handles async job
```

### Events

```txt
incident.created
incident.acknowledged
incident.assigned
incident.resolved
incident.comment_added

document.uploaded
document.indexed
document.index_failed

assistant.question_asked
postmortem.generated

notification.created
audit.created
```

### Queues

```txt
q.notification.send
q.websocket.broadcast
q.audit.write
q.document.extract
q.document.embed
q.incident.summarize
q.postmortem.generate
q.dead-letter
```

### Required Patterns

- Transactional outbox
- Idempotent consumer
- Retry mechanism
- Dead-letter queue
- Message correlation ID
- Consumer logging

### Tables

```txt
outbox_events
processed_messages
```

---

## 11. Redis Usage

Redis must be used for real production-like concerns.

### Permission Cache

```txt
org:{orgId}:user:{userId}:permissions
```

### Rate Limiter

```txt
rate:auth:login:{ip}
rate:incident:create:{orgId}:{userId}
rate:ai:{orgId}:{userId}
rate:upload:{orgId}:{userId}
```

### Distributed Lock

```txt
lock:document:index:{documentId}
lock:outbox:publisher
```

### WebSocket Presence

```txt
presence:org:{orgId}:incident:{incidentId}
```

### RAG Cache Optional

```txt
rag:{orgId}:question:{questionHash}
```

TTL should be short, around 5-15 minutes.

---

## 12. File Storage with MinIO

Use MinIO as S3-compatible object storage.

Supported files in MVP:

```txt
.md
.txt
.log
.json
```

PDF can be added later.

### Upload Flow

```txt
1. User requests presigned upload URL.
2. Backend checks permission.
3. Backend creates file record with PENDING_UPLOAD.
4. Backend returns presigned URL.
5. Client uploads directly to MinIO.
6. Client confirms upload.
7. Backend marks file as UPLOADED.
8. Backend creates knowledge document with PENDING_INDEX.
9. Backend creates outbox event document.uploaded.
```

### Endpoints

```txt
POST /orgs/:orgId/files/upload-url
POST /orgs/:orgId/files/confirm-upload
GET /orgs/:orgId/files/:fileId/download-url

POST /orgs/:orgId/knowledge-documents/upload-url
POST /orgs/:orgId/knowledge-documents/confirm-upload
GET /orgs/:orgId/knowledge-documents
GET /orgs/:orgId/knowledge-documents/:documentId
POST /orgs/:orgId/knowledge-documents/:documentId/reindex
```

---

## 13. Knowledge Base and RAG

### Document Status

```txt
PENDING_UPLOAD
PENDING_INDEX
INDEXING
INDEXED
INDEX_FAILED
```

### Indexing Flow

```txt
Consume document.uploaded
Check idempotency
Acquire Redis lock lock:document:index:{documentId}
Update document status to INDEXING
Download file from MinIO
Extract text
Split text into chunks
Generate embeddings
Save chunks with vectors to PostgreSQL
Update document status to INDEXED
Publish document.indexed
Release lock
```

### Chunking Strategy

MVP:

```txt
Chunk size: 2000-3000 characters
Overlap: 300-500 characters
```

Later improvement:

```txt
Token-based chunking
Markdown-aware chunking
Section-title metadata
```

### Embedding Provider

Use an interface:

```ts
interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
}
```

Implementations:

```txt
MockEmbeddingProvider
OpenAIEmbeddingProvider
```

Tests should use mock provider.

### LLM Provider

Use an interface:

```ts
interface LLMProvider {
  generate(input: GenerateInput): Promise<GenerateOutput>;
}
```

Implementations:

```txt
MockLLMProvider
OpenAILLMProvider
```

Tests should use mock provider.

---

## 14. AI Features

AI must be implemented as RAG, not a simple chatbot.

### Feature 1: Ask Knowledge Base

Endpoint:

```txt
POST /orgs/:orgId/assistant/ask
```

Flow:

```txt
Authenticate
Resolve organization
Check ai:ask permission
Apply Redis rate limit
Embed question
Search pgvector top K chunks with organization filter
Build prompt with context
Call LLM
Save conversation
Return answer with sources
```

Response must include sources:

```json
{
  "answer": "...",
  "sources": [
    {
      "documentId": "doc_1",
      "title": "RabbitMQ Consumer Lag Runbook",
      "chunkId": "chunk_1",
      "score": 0.89
    }
  ]
}
```

Important rule:

Vector search must always filter by `organization_id` to prevent AI data leaks across tenants.

### Feature 2: Recommend Runbooks for Incident

Endpoint:

```txt
POST /orgs/:orgId/incidents/:incidentId/assistant/recommend-runbooks
```

Flow:

```txt
Load incident
Use incident title + description + service name as query
Semantic search knowledge chunks
Return related runbooks/documents
```

### Feature 3: Generate Postmortem Draft

Endpoint:

```txt
POST /orgs/:orgId/incidents/:incidentId/postmortem/generate
```

Flow:

```txt
Check incident is RESOLVED
Load incident details
Load timeline events
Load comments
Build prompt
Call LLM
Save postmortem draft
Optionally export markdown to MinIO
Publish postmortem.generated
```

---

## 15. WebSocket

WebSocket is used for realtime incident collaboration.

### Auth

- Authenticate WebSocket connection with JWT.
- Resolve organization membership before joining organization/incident rooms.

### Rooms

```txt
org:{orgId}
incident:{incidentId}
user:{userId}
```

### Events

```txt
incident.created
incident.updated
incident.assigned
incident.resolved
incident.timeline_added
comment.added
notification.created
document.indexed
assistant.answer_generated
postmortem.generated
```

### Redis Presence

```txt
presence:org:{orgId}:incident:{incidentId}
```

If running multiple API instances, use Redis Pub/Sub or equivalent adapter for cross-instance broadcasting.

---

## 16. Node.js-specific Requirements

The project should clearly demonstrate Node.js backend knowledge.

### Cluster

Use cluster mode or PM2 cluster mode for API/WebSocket process.

Purpose:

- Use multiple CPU cores.
- Scale HTTP/WebSocket workload.

### Worker Threads

Use worker threads only for CPU-bound tasks.

Good use cases:

```txt
Large document parsing
Large log chunking
Postmortem PDF/Markdown generation
CSV export
```

Do not use worker threads for normal DB/Redis/RabbitMQ I/O.

### Streams

Use streams for:

```txt
Reading large files from MinIO
Parsing log files line by line
Generating large exports
Downloading files
```

### Graceful Shutdown

API shutdown:

```txt
Stop accepting requests
Close WebSocket server
Close Prisma
Close Redis
Close RabbitMQ
```

Worker shutdown:

```txt
Stop consuming new messages
Finish current message if possible
Ack/nack correctly
Close connections
```

---

## 17. Database Tables

MVP tables:

```txt
users
refresh_tokens

organizations
organization_members
organization_invitations

roles
permissions
role_permissions
member_roles

services

incidents
incident_assignments
incident_timeline_events
incident_comments

files
knowledge_documents
knowledge_chunks

assistant_conversations
assistant_messages
postmortems

notifications

audit_logs

outbox_events
processed_messages
idempotency_keys
```

Important indexes:

```txt
organization_members(organization_id, user_id)
services(organization_id, name)
incidents(organization_id, status, created_at)
incidents(organization_id, severity, created_at)
incidents(organization_id, service_id, created_at)
knowledge_documents(organization_id, status, created_at)
knowledge_chunks(organization_id, document_id)
outbox_events(status, available_at)
processed_messages(message_id, consumer_name)
audit_logs(organization_id, created_at)
```

For pgvector, add a vector index later when the MVP search works.

---

## 18. Milestones

## Milestone 0 — Project Foundation

### Goal

Set up the base backend project and infrastructure.

### Scope

- TypeScript
- Express
- Prisma
- PostgreSQL
- Redis
- RabbitMQ
- MinIO
- Docker Compose
- Vitest
- Supertest
- Zod
- Pino logger
- Global error handler
- Health/readiness endpoints

### Output

- `GET /health`
- `GET /ready`
- Docker Compose can start all services.
- Prisma migration works.
- Basic test passes.

### Tests

- Health endpoint returns 200.
- Readiness endpoint checks dependencies.

---

## Milestone 1 — Auth + Organization

### Goal

Allow users to register, login, and create organizations.

### Scope

- Register
- Login
- Refresh token
- Logout
- Current user
- Create organization
- List organizations
- Get organization detail

### Endpoints

```txt
POST /auth/register
POST /auth/login
GET /auth/oauth/:provider
GET /auth/oauth/:provider/callback
POST /auth/refresh
POST /auth/logout
GET /auth/me

POST /organizations
GET /organizations
GET /orgs/:orgId
```

### Output

A user can create and access their own organization.

### Tests

- User can register.
- User can login.
- User can create organization.
- User can list own organizations.
- User cannot access organization they do not belong to.

---

## Milestone 2 — RBAC + Tenant Access Control

### Goal

Implement permission-based authorization.

### Scope

- Roles
- Permissions
- Role permissions
- Member roles
- Permission middleware
- Redis permission cache

### Output

All organization-scoped routes are protected by membership and permission checks.

### Tests

- Owner can perform protected actions.
- Viewer cannot perform restricted actions.
- User from org A cannot access org B.
- Permission cache works.
- Permission cache invalidates after role update.

---

## Milestone 3 — Service Catalog + Incident Core

### Goal

Build the main business domain.

### Scope

- Service CRUD
- Incident CRUD
- Incident lifecycle
- Assignment
- Acknowledge
- Resolve
- Cancel
- Cursor pagination

### Output

Users can manage services and incidents with proper RBAC.

### Tests

- Create service.
- Create incident.
- Assign incident.
- Acknowledge incident.
- Resolve incident.
- Invalid state transition is rejected.
- Cross-tenant incident access is blocked.

---

## Milestone 4 — Incident Timeline + WebSocket

### Goal

Add realtime collaboration.

### Scope

- Timeline events
- Comments
- WebSocket auth
- Incident room
- Realtime broadcast
- Presence tracking with Redis

### Output

Incident updates and comments are broadcast to connected clients.

### Tests

- Creating incident creates timeline event.
- Resolving incident creates timeline event.
- Comment creates timeline event.
- WebSocket event can be verified manually or via integration test.

---

## Milestone 5 — RabbitMQ + Transactional Outbox

### Goal

Add reliable event-driven processing.

### Scope

- RabbitMQ client
- Outbox table
- Outbox publisher
- Base consumer
- Retry
- DLQ
- Idempotent consumer

### Output

Business actions create outbox events that are later published to RabbitMQ.

### Tests

- Create incident creates outbox event.
- Outbox publisher marks event as published.
- Consumer stores processed message.
- Duplicate message is ignored.
- Failed message retries.

---

## Milestone 6 — MinIO File Storage + Knowledge Documents

### Goal

Allow users to upload documents for the knowledge base.

### Scope

- Presigned upload URL
- Confirm upload
- File metadata
- Knowledge document record
- Document status
- `document.uploaded` outbox event

### Output

User can upload a document and create a `PENDING_INDEX` knowledge document.

### Tests

- User with permission can request upload URL.
- Viewer cannot upload.
- Confirm upload creates knowledge document.
- Document belongs to correct organization.
- `document.uploaded` outbox event is created.

---

## Milestone 7 — Document Indexing Pipeline

### Goal

Index uploaded documents into vector-searchable chunks.

### Scope

- Document worker
- Redis distributed lock
- Text extractor
- Chunker
- Embedding provider abstraction
- PostgreSQL pgvector
- Knowledge chunks
- Document indexing status

### Output

Uploaded document becomes `INDEXED` and has searchable chunks.

### Tests

- Chunker works.
- Document indexing updates status.
- Duplicate message does not duplicate chunks.
- Failed indexing sets `INDEX_FAILED`.
- Redis lock prevents concurrent indexing.
- Chunks are scoped by organization.

---

## Milestone 8 — RAG Assistant

### Goal

Implement AI features using RAG.

### Scope

- Ask knowledge base
- Recommend runbooks for incident
- Generate postmortem draft
- AI rate limiter
- Conversation storage
- Source-grounded answers

### Endpoints

```txt
POST /orgs/:orgId/assistant/ask
POST /orgs/:orgId/incidents/:incidentId/assistant/recommend-runbooks
POST /orgs/:orgId/incidents/:incidentId/postmortem/generate
```

### Output

AI can answer questions from organization documents and return sources.

### Tests

- AI ask requires permission.
- AI ask is rate limited.
- RAG searches only current organization chunks.
- Sources are returned.
- Postmortem requires resolved incident.
- Conversation is saved.

---

## Milestone 9 — Production Hardening

### Goal

Add production-grade reliability, security, and observability.

### Scope

- Audit log
- Idempotency key
- Request correlation ID
- Rate limiter for important endpoints
- Graceful shutdown
- Cursor pagination polish
- Error code standardization
- Structured logging

### Output

The backend has production-style behavior and better debuggability.

### Tests

- Audit log is created for important actions.
- Idempotency key prevents duplicate incident creation.
- Rate limiter blocks excessive requests.
- Cursor pagination is stable.

---

## Milestone 10 — Testing, CI, README, CV Polish

### Goal

Make the project ready for portfolio/CV/interview.

### Scope

- Unit tests
- Integration tests
- E2E scenario
- GitHub Actions
- Docker build
- README
- Architecture diagrams
- API examples
- CV bullets

### Required README Sections

```txt
Project overview
Problem statement
Architecture diagram
Tech stack
Main features
Data model summary
Event-driven flow
RAG pipeline
Security model
Testing strategy
How to run locally
API examples
Trade-offs
Future improvements
```

### E2E Demo Flow

```txt
Register user
Create organization
Create service
Upload runbook
Index document
Create incident
Ask assistant
Recommend runbook
Add comment
Resolve incident
Generate postmortem
Check notification
Check audit log
```

---

## 19. Recommended 8-week Plan

### Week 1

```txt
Milestone 0
Milestone 1
```

Output:

```txt
Project setup
Auth
OAuth2 basic
Organization
Docker Compose
Prisma
Basic tests
```

### Week 2

```txt
Milestone 2
```

Output:

```txt
RBAC
Permission cache
Tenant access control
```

### Week 3

```txt
Milestone 3
```

Output:

```txt
Service catalog
Incident lifecycle
Cursor pagination
Business rules
```

### Week 4

```txt
Milestone 4
Milestone 5
```

Output:

```txt
Timeline
WebSocket
RabbitMQ
Outbox
Consumer idempotency
```

### Week 5

```txt
Milestone 6
Milestone 7
```

Output:

```txt
MinIO upload
Knowledge documents
Document indexing
pgvector chunks
```

### Week 6

```txt
Milestone 8
```

Output:

```txt
RAG assistant
Recommend runbooks
Generate postmortem
AI rate limiter
```

### Week 7

```txt
Milestone 9
```

Output:

```txt
Audit log
Idempotency
Graceful shutdown
Observability
Hardening
```

### Week 8

```txt
Milestone 10
```

Output:

```txt
Integration tests
E2E test
CI
README
Diagrams
CV bullets
```

---

## 20. MVP Scope

The MVP should include:

```txt
Auth
Organization
RBAC
Service catalog
Incident lifecycle
Incident timeline
WebSocket notification
RabbitMQ outbox
MinIO document upload
Document indexing
RAG ask endpoint
Audit log
Unit tests
Integration tests
Docker Compose
README
```

Do not include in MVP:

```txt
Complex frontend
PDF extraction
Slack integration
Prometheus/Grafana
Advanced analytics
Billing
Microservices
Advanced team-level permissions
```

---

## 21. Implementation Rules for the Agent

1. Build milestones in order.
2. Do not implement AI before organization, RBAC, files, and document indexing are ready.
3. Keep the architecture as modular monolith.
4. Use Clean Architecture boundaries.
5. Do not let domain depend on infrastructure.
6. Use Prisma repositories in infrastructure.
7. Use Redis only for cache, lock, rate limit, and presence.
8. Use RabbitMQ only for async/background workflows.
9. Use outbox pattern before publishing RabbitMQ events.
10. All organization-scoped resources must be filtered by `organization_id`.
11. RAG search must always filter by `organization_id`.
12. Use mock LLM and mock embedding provider for tests.
13. Avoid overengineering CQRS.
14. Avoid microservices.
15. Add tests per milestone.
16. Keep README updated as features are completed.

---

## 22. CV Bullets After Completion

```txt
Built an AI-powered incident management platform using Node.js, TypeScript, Express, PostgreSQL, Prisma, Redis, RabbitMQ, MinIO, and WebSocket, supporting multi-tenant organizations, RBAC, service catalog, incident lifecycle, realtime collaboration, and audit logging.
```

```txt
Implemented a RAG-based knowledge assistant with document ingestion, chunking, embedding generation, PostgreSQL pgvector semantic search, and source-grounded answers from internal runbooks and postmortems.
```

```txt
Designed an event-driven architecture using transactional outbox, RabbitMQ workers, retry mechanism, dead-letter queues, and idempotent consumers for document indexing, notifications, and postmortem generation.
```

```txt
Applied Redis for permission caching, AI request rate limiting, distributed locks for document indexing, WebSocket presence tracking, and cross-instance realtime broadcasting.
```

```txt
Improved Node.js scalability by separating API, worker, and scheduler processes, using cluster mode for HTTP/WebSocket traffic, worker threads for CPU-bound document processing, and streams for large file ingestion from MinIO.
```

```txt
Added production-grade tests with Vitest, Supertest, and Testcontainers, covering tenant isolation, RBAC, incident state transitions, RabbitMQ consumers, Redis rate limiting, and RAG retrieval logic.
```

---

## 23. First 10 Tasks

Start with these tasks:

```txt
1. Create repository.
2. Set up TypeScript + Express.
3. Set up Docker Compose: PostgreSQL, Redis, RabbitMQ, MinIO.
4. Set up Prisma.
5. Add health and readiness endpoints.
6. Add global error handler.
7. Add Pino logger.
8. Add Vitest + Supertest.
9. Implement auth register/login.
10. Implement create/list organization.
```

After these 10 tasks, continue with RBAC and organization access control.
