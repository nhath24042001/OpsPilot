# Week 6 Summary - RAG Assistant, Runbook Recommendations, Postmortem Drafts

## What Was Added

Week 6 implements Milestone 8:

- RAG assistant endpoint for asking questions from indexed knowledge chunks.
- Tenant-scoped pgvector search.
- Redis AI rate limiter.
- Assistant conversation and message storage.
- Runbook recommendation endpoint for incidents.
- Postmortem draft generation for resolved incidents.
- LLM provider abstraction with a mock provider for MVP and tests.

## Main RAG Flow

```txt
Client
  -> POST /orgs/:orgId/assistant/ask
  -> Auth + tenant resolution + ai:ask permission
  -> Redis rate limit rate:ai:{orgId}:{userId}
  -> Embed question
  -> Search knowledge_chunks with organization_id filter
  -> Build prompt with top K chunks
  -> Call LLM provider
  -> Save assistant_conversations and assistant_messages
  -> Return answer + sources
```

The important security rule is enforced in the RAG repository:

```txt
knowledge_chunks.organization_id = current organization
knowledge_documents.organization_id = current organization
knowledge_documents.status = INDEXED
```

This prevents cross-tenant knowledge leakage.

## Endpoints

```txt
POST /orgs/:orgId/assistant/ask
POST /orgs/:orgId/incidents/:incidentId/assistant/recommend-runbooks
POST /orgs/:orgId/incidents/:incidentId/postmortem/generate
```

Permissions:

- `ai:ask` for ask and recommend runbooks.
- `ai:summarize` for postmortem generation.

## Database Tables

`assistant_conversations`

- Stores one saved assistant answer.
- Includes `organization_id`, `user_id`, `question`, `answer`, and JSON `sources`.

`assistant_messages`

- Stores normalized chat-style messages for each conversation.
- Current MVP saves one `USER` message and one `ASSISTANT` message.

`postmortems`

- Stores generated postmortem drafts.
- One postmortem per incident through unique `incident_id`.
- Regenerating a postmortem updates the existing draft.

## pgvector Search

Search uses the existing Week 5 `knowledge_chunks.embedding vector(8)` column.

The repository computes similarity with pgvector cosine distance:

```txt
score = 1 - (chunk.embedding <=> query.embedding)
```

Results are ordered by nearest vector distance and returned as sources:

```json
{
  "documentId": "doc_1",
  "title": "RabbitMQ Consumer Lag Runbook",
  "chunkId": "chunk_1",
  "score": 0.89
}
```

## Runbook Recommendation Flow

```txt
Client
  -> POST /orgs/:orgId/incidents/:incidentId/assistant/recommend-runbooks
  -> Load incident within organization
  -> Build query from title, description, service name, severity
  -> Embed query
  -> Search tenant-scoped chunks
  -> Return source list as recommendations
```

This endpoint does not call the LLM. It is a retrieval feature.

## Postmortem Generation Flow

```txt
Client
  -> POST /orgs/:orgId/incidents/:incidentId/postmortem/generate
  -> Load incident with service, timeline, comments
  -> Require status RESOLVED
  -> Build postmortem prompt
  -> Call LLM provider
  -> Upsert postmortem draft
  -> Create postmortem.generated outbox event
```

The resolved-status check prevents drafting postmortems from incomplete incidents.

## Important Code Paths

- Routes: `apps/api/src/modules/ai-assistant/presentation/ai-assistant.routes.ts`
- Controller: `apps/api/src/modules/ai-assistant/presentation/ai-assistant.controller.ts`
- Ask use case: `apps/api/src/modules/ai-assistant/application/use-cases/ask-knowledge-base.use-case.ts`
- Recommend use case: `apps/api/src/modules/ai-assistant/application/use-cases/recommend-runbooks.use-case.ts`
- Postmortem use case: `apps/api/src/modules/ai-assistant/application/use-cases/generate-postmortem.use-case.ts`
- RAG repository: `apps/api/src/modules/ai-assistant/infrastructure/prisma/prisma-rag.repository.ts`
- Conversation repository: `apps/api/src/modules/ai-assistant/infrastructure/prisma/prisma-assistant-conversation.repository.ts`
- Postmortem repository: `apps/api/src/modules/ai-assistant/infrastructure/prisma/prisma-postmortem.repository.ts`
- Redis rate limiter: `apps/api/src/modules/ai-assistant/infrastructure/redis/redis-rate-limiter.ts`
- Mock LLM provider: `apps/api/src/modules/ai-assistant/infrastructure/llm/mock-llm-provider.ts`

## MVP Limitations

- The LLM provider is mocked and deterministic.
- The embedding provider is the same deterministic MVP provider from Week 5.
- RAG response caching is not implemented yet.
- Postmortem export to MinIO is optional in the spec and not included in this milestone.
- OpenAPI docs have not been expanded for these endpoints yet.
