import Groq from "groq-sdk";
import { IAIProvider, AIRequestOptions } from "./provider.interface";
import env from "../../../config/env";

/**
 * GroqProvider — implements IAIProvider for the Groq inference backend.
 *
 * Key rotation is encapsulated here via static tier factory methods.
 * Callers never reference organizer/teacher terminology — they request a tier.
 *
 *   Tier 1 → planning, blueprints, resource discovery  (AI_TIER1_API_KEY)
 *   Tier 2 → lessons, topics, quizzes, evaluations     (AI_TIER2_API_KEY)
 *   Tier 3 → deep lesson generation (heavy loads)      (falls back to AI_TIER2_API_KEY)
 *
 * Instances are constructed once by ProviderFactory at application startup
 * and reused for the lifetime of the process.
 */
export class GroqProvider implements IAIProvider {
  private readonly client: Groq;
  private readonly tierLabel: string;

  private constructor(apiKey: string, tierLabel: string) {
    this.client = new Groq({ apiKey, timeout: 30000 });
    this.tierLabel = tierLabel;
  }

  static forTier1(): GroqProvider {
    return new GroqProvider(env.AI_TIER1_API_KEY, "Tier1");
  }

  static forTier2(): GroqProvider {
    return new GroqProvider(env.AI_TIER2_API_KEY, "Tier2");
  }

  static forTier3(): GroqProvider {
    return new GroqProvider(env.AI_TIER3_API_KEY, "Tier3");
  }

  async generate<T>(
    prompt: string,
    systemInstruction?: string,
    options?: AIRequestOptions,
  ): Promise<T> {
    try {
      const response = await this.client.chat.completions.create({
        model: env.GROQ_MODEL,
        messages: [
          ...(systemInstruction
            ? [{ role: "system" as const, content: systemInstruction }]
            : []),
          { role: "user" as const, content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: options?.temperature ?? 0.2,
        ...(options?.maxTokens ? { max_tokens: options.maxTokens } : {}),
      });

      const content = response.choices[0]?.message?.content;
      if (!content)
        throw new Error(
          `Empty response received from Groq (${this.tierLabel}).`,
        );

      return JSON.parse(content) as T;
    } catch (error) {
      console.error(`[GroqProvider ${this.tierLabel} Error]:`, error);
      throw error;
    }
  }
}
