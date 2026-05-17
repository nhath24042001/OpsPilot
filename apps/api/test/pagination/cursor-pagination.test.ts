import { describe, expect, it } from 'vitest';
import {
  decodeCreatedAtCursor,
  encodeCreatedAtCursor,
  normalizeLimit,
  toCursorPage,
} from '../../src/shared/pagination/cursor-pagination.js';

describe('cursor pagination', () => {
  it('normalizes page size within supported bounds', () => {
    expect(normalizeLimit()).toBe(20);
    expect(normalizeLimit(0)).toBe(1);
    expect(normalizeLimit(500)).toBe(100);
  });

  it('round trips createdAt cursor payload', () => {
    const cursor = {
      id: '11111111-1111-1111-1111-111111111111',
      createdAt: new Date('2026-05-17T00:00:00.000Z'),
    };

    expect(decodeCreatedAtCursor(encodeCreatedAtCursor(cursor))).toEqual(cursor);
  });

  it('returns next cursor from the last visible record', () => {
    const records = [
      { id: '1', createdAt: new Date('2026-05-17T00:02:00.000Z') },
      { id: '2', createdAt: new Date('2026-05-17T00:01:00.000Z') },
      { id: '3', createdAt: new Date('2026-05-17T00:00:00.000Z') },
    ];

    const page = toCursorPage(records, 2);

    expect(page.items).toHaveLength(2);
    expect(decodeCreatedAtCursor(page.pageInfo.nextCursor ?? undefined)).toEqual(records[1]);
  });
});
