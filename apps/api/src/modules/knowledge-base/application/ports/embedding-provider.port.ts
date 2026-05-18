export interface EmbeddingProviderPort {
  dimensions: number;
  embed(text: string): Promise<readonly number[]>;
}
