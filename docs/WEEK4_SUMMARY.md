# Week 4 Summary - Timeline, WebSocket, RabbitMQ, Outbox, Consumer Idempotency

## Senior Refactor Applied

- Incident write paths were refactored so lifecycle mutations now carry `actorMemberId` from tenant context.
- Incident command persistence now writes the incident mutation, timeline event, and outbox event inside one Prisma transaction using serializable isolation.
- Controller responsibilities remain limited to HTTP validation/context mapping. Business rules stay in use cases and domain value objects.
- Infrastructure owns database atomicity, outbox persistence, and RabbitMQ delivery concerns.

## Incident Timeline

- Added `incident_timeline_events` and `incident_comments`.
- Added timeline event types for create, acknowledge, assign, resolve, cancel, and comment.
- Added endpoints:
  - `GET /orgs/:orgId/incidents/:incidentId/timeline`
  - `POST /orgs/:orgId/incidents/:incidentId/comments`
- Timeline list uses the shared cursor pagination contract.
- Comment creation writes the comment, timeline event, and outbox event in the same transaction.

## Transactional Outbox

- Added `outbox_events` with `PENDING`, `PROCESSING`, `PUBLISHED`, and `FAILED` states.
- Incident lifecycle actions create outbox rows instead of publishing to RabbitMQ directly.
- Added outbox publisher service that atomically claims pending rows, publishes to RabbitMQ, marks success, and schedules retry on failure.
- Publish payload includes stable `messageId`, event type, aggregate identity, organization identity, payload, and occurrence time.

## RabbitMQ

- Added topic exchange `opspilot.events`.
- Added queue `q.websocket.broadcast`.
- Incident routing keys use `incident.*` semantics such as `incident.created`, `incident.resolved`, and `incident.comment_added`.
- RabbitMQ publish uses confirm channels and durable messages.

## Consumer Idempotency

- Added `processed_messages` table keyed by `(message_id, consumer_name)`.
- Added reusable idempotent consumer wrapper.
- Duplicate deliveries are acknowledged without re-running the handler.

## WebSocket

- Added `/ws` WebSocket server.
- WebSocket connections authenticate with JWT access token via `?token=...`.
- Clients subscribe with `incident.subscribe`, and subscription checks `incident:read` permission through the existing RBAC service.
- WebSocket broadcast consumer receives RabbitMQ incident events and broadcasts to subscribed incident rooms.

## Tests

- Added unit coverage for incident timeline use cases.
- Added unit coverage for idempotent consumer behavior.
- Added unit coverage for outbox publisher success flow.
- Existing incident tests were updated to include actor member context.
