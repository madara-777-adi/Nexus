export interface AIRequestOptions {
  temperature?: number;
  maxTokens?: number;
  responseSchema?: Record<string, any>;
}

export interface IAIProvider {
  generate<T>(
    prompt: string,
    systemInstruction?: string,
    options?: AIRequestOptions
  ): Promise<T>;

  generateStream(
    prompt: string,
    systemInstruction?: string,
    onChunk?: (chunk: string) => void,
    options?: AIRequestOptions
  ): Promise<string>;
}