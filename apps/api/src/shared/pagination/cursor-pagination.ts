import { Buffer } from 'node:buffer';
import { domainError } from '../errors/app-error.js';

export type CursorPageInput = {
  limit?: number;
  cursor?: string;
};

export type CreatedAtCursor = {
  id: string;
  createdAt: Date;
};

export type CursorPage<T> = {
  items: T[];
  pageInfo: {
    limit: number;
    nextCursor: string | null;
  };
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export const normalizeLimit = (limit?: number): number => {
  if (limit === undefined) {
    return DEFAULT_LIMIT;
  }

  return Math.min(Math.max(limit, 1), MAX_LIMIT);
};

export const encodeCreatedAtCursor = (cursor: CreatedAtCursor): string =>
  Buffer.from(JSON.stringify({ id: cursor.id, createdAt: cursor.createdAt.toISOString() })).toString(
    'base64url',
  );

export const decodeCreatedAtCursor = (cursor?: string): CreatedAtCursor | null => {
  if (!cursor) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as {
      id?: unknown;
      createdAt?: unknown;
    };

    if (typeof parsed.id !== 'string' || typeof parsed.createdAt !== 'string') {
      throw new Error('Invalid cursor shape');
    }

    const createdAt = new Date(parsed.createdAt);
    if (Number.isNaN(createdAt.getTime())) {
      throw new Error('Invalid cursor date');
    }

    return { id: parsed.id, createdAt };
  } catch {
    throw domainError('VALIDATION_FAILED', { cursor: ['Invalid cursor'] });
  }
};

export const toCursorPage = <T extends CreatedAtCursor>(
  records: T[],
  limit: number,
): CursorPage<T> => {
  const items = records.slice(0, limit);
  const hasNextPage = records.length > limit;
  const lastItem = items.at(-1);

  return {
    items,
    pageInfo: {
      limit,
      nextCursor: hasNextPage && lastItem ? encodeCreatedAtCursor(lastItem) : null,
    },
  };
};
