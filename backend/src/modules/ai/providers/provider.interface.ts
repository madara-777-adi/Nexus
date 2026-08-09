export interface AIRequestOptions {
  temperature?: number;
  maxTokens?: number;
  responseSchema?: Record<string, any>;
}

/**
 * IAIProvider — V1 contract.
 * Only includes methods actively used in V1.
 * Streaming is deferred to a future ECR.
 */
export interface IAIProvider {
  generate<T>(
    prompt: string,
    systemInstruction?: string,
    options?: AIRequestOptions,
  ): Promise<T>;
}