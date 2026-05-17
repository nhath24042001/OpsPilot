import type { OutboxEventStatus, Prisma } from '@prisma/client';

export type OutboxEventEntity = {
  id: string;
  organizationId: string | null;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  routingKey: string;
  payload: Prisma.JsonValue;
  status: OutboxEventStatus;
  attempts: number;
  availableAt: Date;
  publishedAt: Date | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type OutboxPublishMessage = {
  messageId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  organizationId: string | null;
  payload: Prisma.JsonValue;
  occurredAt: string;
};
