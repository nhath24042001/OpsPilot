import { createHash } from 'node:crypto';
import type { EmbeddingProviderPort } from '../../application/ports/embedding-provider.port.js';

const DIMENSIONS = 8;

const normalize = (values: number[]): readonly number[] => {
  const magnitude = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
  if (magnitude === 0) {
    return values;
  }

  return values.map((value) => Number((value / magnitude).toFixed(6)));
};

export const deterministicEmbeddingProvider: EmbeddingProviderPort = {
  dimensions: DIMENSIONS,

  async embed(text) {
    const words = text.toLowerCase().match(/[a-z0-9_:-]+/g) ?? [];
    const vector = Array.from({ length: DIMENSIONS }, () => 0);

    for (const word of words) {
      const digest = createHash('sha256').update(word).digest();
      const bucket = (digest[0] ?? 0) % DIMENSIONS;
      const sign = (digest[1] ?? 0) % 2 === 0 ? 1 : -1;
      vector[bucket] = (vector[bucket] ?? 0) + sign * Math.max(1, Math.log2(word.length + 1));
    }

    return normalize(vector);
  },
};
