export interface LlmProviderPort {
  complete(input: {
    system: string;
    prompt: string;
  }): Promise<string>;
}
