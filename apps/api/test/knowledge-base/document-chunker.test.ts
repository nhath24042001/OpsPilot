import { describe, expect, it } from 'vitest';
import { chunkDocumentText } from '../../src/modules/knowledge-base/application/services/document-chunker.js';

describe('document chunker', () => {
  it('splits text into stable overlapping chunks', () => {
    const text = ['alpha beta gamma delta.', 'epsilon zeta eta theta.', 'iota kappa lambda mu.'].join(
      '\n\n',
    );

    const chunks = chunkDocumentText(text, { maxChars: 35, overlapChars: 8 });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]).toEqual(
      expect.objectContaining({
        chunkIndex: 0,
        tokenCount: expect.any(Number),
      }),
    );
    expect(chunks.map((chunk) => chunk.chunkIndex)).toEqual(chunks.map((_, index) => index));
    expect(chunks.every((chunk) => chunk.content.length <= 35)).toBe(true);
  });

  it('returns no chunks for blank documents', () => {
    expect(chunkDocumentText(' \n\n\t ')).toEqual([]);
  });
});
