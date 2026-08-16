import env from "../../../config/env";
import { IAIProvider, AIRequestOptions } from "./provider.interface";

const CEREBRAS_API_URL = "https://api.cerebras.ai/v1/chat/completions";

function extractJsonFromMarkdown(content: string): string {
  const trimmed = content.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

/**
 * CerebrasProvider — implements IAIProvider for the Cerebras inference backend.
 *
 * Cerebras is not yet deployed with per-tier keys, so a single shared
 * CEREBRAS_API_KEY is used regardless of which tier selects this provider.
 *
 * No official Cerebras SDK is present in package.json; Cerebras exposes an
 * OpenAI-compatible REST endpoint, so this uses the native fetch API rather
 * than introducing a new dependency.
 */
export class CerebrasProvider implements IAIProvider {
  private readonly apiKey: string;
  private readonly tierLabel: string;

  private constructor(apiKey: string, tierLabel: string) {
    this.apiKey = apiKey;
    this.tierLabel = tierLabel;
  }

  static forTier1(): CerebrasProvider {
    return CerebrasProvider.buildForTier("Tier1");
  }

  static forTier2(): CerebrasProvider {
    return CerebrasProvider.buildForTier("Tier2");
  }

  static forTier3(): CerebrasProvider {
    return CerebrasProvider.buildForTier("Tier3");
  }

  private static buildForTier(tierLabel: string): CerebrasProvider {
    const apiKey =
      tierLabel === "Tier1"
        ? process.env.AI_TIER1_API_KEY
        : tierLabel === "Tier2"
          ? process.env.AI_TIER2_API_KEY
          : process.env.AI_TIER3_API_KEY;
    if (!apiKey)
      throw new Error(
        `Missing AI_TIER${tierLabel.slice(-1)}_API_KEY in environment.`,
      );
    return new CerebrasProvider(apiKey, tierLabel);
  }

  async generate<T>(
    prompt: string,
    systemInstruction?: string,
    options?: AIRequestOptions,
  ): Promise<T> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      let response: Response;
      try {
        response = await fetch(CEREBRAS_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: env.CEREBRAS_MODEL,
            messages: [
              ...(systemInstruction
                ? [{ role: "system" as const, content: systemInstruction }]
                : []),
              { role: "user" as const, content: prompt },
            ],
            response_format: { type: "json_object" },
            temperature: options?.temperature ?? 0.2,
            ...(options?.maxTokens ? { max_tokens: options.maxTokens } : {}),
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      if (!response.ok) {
        const errBody = await response.text().catch(() => "");
        throw new Error(
          `Cerebras request failed (${response.status}): ${errBody}`,
        );
      }

      const data: any = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content)
        throw new Error(
          `Empty response received from Cerebras (${this.tierLabel}).`,
        );

      try {
        return JSON.parse(extractJsonFromMarkdown(content)) as T;
      } catch (parseError) {
        throw new Error(
          `Failed to parse AI provider response as JSON from Cerebras (${this.tierLabel}): ${parseError instanceof Error ? parseError.message : String(parseError)}`,
        );
      }
    } catch (error) {
      console.error(`[CerebrasProvider ${this.tierLabel} Error]:`, error);
      throw error;
    }
  }
}
