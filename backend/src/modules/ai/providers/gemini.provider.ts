import { GoogleGenerativeAI } from "@google/generative-ai";
import { IAIProvider, AIRequestOptions } from "./provider.interface";
import env from "../../../config/env";

export class GeminiProvider implements IAIProvider {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }

  private cleanJsonString(rawText: string): string {
    // Strip triple backticks and markdown formatting if present
    return rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
  }

  async generate<T>(
    prompt: string,
    systemInstruction?: string,
    options?: AIRequestOptions
  ): Promise<T> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction,
        generationConfig: {
          temperature: options?.temperature ?? 0.2,
          responseMimeType: options?.responseSchema ? "application/json" : "text/plain",
          responseSchema: options?.responseSchema as any,
        },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      if (options?.responseSchema) {
        const cleaned = this.cleanJsonString(text);
        return JSON.parse(cleaned) as T;
      }

      return text as unknown as T;
    } catch (error) {
      throw new Error(`Gemini Provider Error: ${(error as Error).message}`);
    }
  }

  async generateStream(
    prompt: string,
    systemInstruction?: string,
    onChunk?: (chunk: string) => void,
    options?: AIRequestOptions
  ): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction,
        generationConfig: {
          temperature: options?.temperature ?? 0.3,
          responseMimeType: options?.responseSchema ? "application/json" : "text/plain",
          responseSchema: options?.responseSchema as any,
        },
      });

      const result = await model.generateContentStream(prompt);
      let fullText = "";

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        if (onChunk) {
          onChunk(chunkText);
        }
      }

      return fullText;
    } catch (error) {
      throw new Error(`Gemini Stream Error: ${(error as Error).message}`);
    }
  }
}