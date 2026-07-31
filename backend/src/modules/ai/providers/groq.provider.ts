import Groq from "groq-sdk";

export interface AIRequestOptions {
  temperature?: number;
}

export class GroqProvider {
  private groqOrganizer: Groq | null = null;
  private groqTeacher: Groq | null = null;

  // Lazy getter ensures clients instantiate after .env is fully loaded by the server
  private getClient(role: "organizer" | "teacher"): Groq {
    if (role === "organizer") {
      if (!this.groqOrganizer) {
        const apiKey =
          process.env.GROQ_API_KEY_ORGANIZER || process.env.GROQ_API_KEY;
        if (!apiKey)
          throw new Error("Missing GROQ_API_KEY_ORGANIZER in .env file");

        // 30-second timeout prevents slow/hanging Groq requests from blocking server connections
        this.groqOrganizer = new Groq({ apiKey, timeout: 30000 });
      }
      return this.groqOrganizer;
    } else {
      if (!this.groqTeacher) {
        const apiKey =
          process.env.GROQ_API_KEY_TEACHER || process.env.GROQ_API_KEY;
        if (!apiKey)
          throw new Error("Missing GROQ_API_KEY_TEACHER in .env file");

        this.groqTeacher = new Groq({ apiKey, timeout: 30000 });
      }
      return this.groqTeacher;
    }
  }

  async generateJSON(
    prompt: string,
    systemInstruction?: string,
    role: "organizer" | "teacher" = "teacher",
    options?: AIRequestOptions,
  ): Promise<any> {
    try {
      const client = this.getClient(role);
      const response = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          ...(systemInstruction
            ? [{ role: "system" as const, content: systemInstruction }]
            : []),
          { role: "user" as const, content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: options?.temperature ?? 0.2,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error("Empty response received from Groq.");

      return JSON.parse(content);
    } catch (error) {
      console.error(`[GroqProvider JSON Error (${role})]:`, error);
      throw error;
    }
  }

  async generateText(
    prompt: string,
    systemInstruction?: string,
    role: "organizer" | "teacher" = "teacher",
    options?: AIRequestOptions,
  ): Promise<string> {
    try {
      const client = this.getClient(role);
      const response = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          ...(systemInstruction
            ? [{ role: "system" as const, content: systemInstruction }]
            : []),
          { role: "user" as const, content: prompt },
        ],
        temperature: options?.temperature ?? 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error("Empty response received from Groq.");

      return content;
    } catch (error) {
      console.error(`[GroqProvider Text Error (${role})]:`, error);
      throw error;
    }
  }
}

export const groqProvider = new GroqProvider();
