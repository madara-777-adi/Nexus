import logger from "../../../shared/logger/logger";
import env from "../../../config/env";
import { IAIProvider, AIRequestOptions } from "./provider.interface";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

function extractJsonFromMarkdown(content: string): string {
  const trimmed = content.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

export class GeminiProvider implements IAIProvider {
  private readonly apiKey: string;
  private readonly tierLabel: string;

  private constructor(apiKey: string, tierLabel: string) {
    this.apiKey = apiKey;
    this.tierLabel = tierLabel;
  }

  static forTier1(): GeminiProvider {
    return GeminiProvider.buildForTier(env.AI_TIER1_API_KEY, "Tier1");
  }

  static forTier2(): GeminiProvider {
    return GeminiProvider.buildForTier(env.AI_TIER2_API_KEY, "Tier2");
  }

  static forTier3(): GeminiProvider {
    return GeminiProvider.buildForTier(env.AI_TIER3_API_KEY, "Tier3");
  }

  private static buildForTier(
    apiKey: string,
    tierLabel: string,
  ): GeminiProvider {
    if (!apiKey) {
      throw new Error(`Missing API key in environment for ${tierLabel}.`);
    }
    return new GeminiProvider(apiKey, tierLabel);
  }

  async generate<T>(
    prompt: string,
    systemInstruction?: string,
    options?: AIRequestOptions,
  ): Promise<T> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const url = `${GEMINI_API_URL}/${env.GEMINI_MODEL}:generateContent?key=${this.apiKey}`;
      
      const payload: any = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: options?.temperature ?? 0.2,
        }
      };
      
      if (systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: systemInstruction }]
        };
      }
      
      if (options?.maxTokens) {
        payload.generationConfig.maxOutputTokens = options.maxTokens;
      }
      
      let response: Response;
      try {
        response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      if (!response.ok) {
        const errBody = await response.text().catch(() => "");
        throw new Error(
          `Gemini request failed (${response.status}): ${errBody}`,
        );
      }

      const data: any = await response.json();
      const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content)
        throw new Error(
          `Empty response received from Gemini (${this.tierLabel}).`,
        );

      try {
        return JSON.parse(extractJsonFromMarkdown(content)) as T;
      } catch (parseError) {
        throw new Error(
          `Failed to parse AI provider response as JSON from Gemini (${this.tierLabel}): ${parseError instanceof Error ? parseError.message : String(parseError)}`,
        );
      }
    } catch (error) {
      logger.error(
        { service: "GeminiProvider", tier: this.tierLabel, err: error },
        "Gemini provider request failed",
      );
      throw error;
    }
  }
}
