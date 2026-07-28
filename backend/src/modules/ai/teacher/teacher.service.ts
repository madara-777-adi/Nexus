import { IAIProvider } from "../providers/provider.interface";
import { TEACHER_SYSTEM_PROMPT, buildTeacherPrompt } from "./teacher.prompt";
import { TeacherLessonSchema } from "./teacher.schema";

export class TeacherService {
  constructor(private aiProvider: IAIProvider) {}

  async generateLesson(context: any) {
    const prompt = buildTeacherPrompt(context);
    return this.aiProvider.generate(prompt, TEACHER_SYSTEM_PROMPT, {
      responseSchema: TeacherLessonSchema,
      temperature: 0.2,
    });
  }

  async streamLesson(context: any, onChunk: (chunk: string) => void) {
    const prompt = buildTeacherPrompt(context);
    return this.aiProvider.generateStream(
      prompt,
      TEACHER_SYSTEM_PROMPT,
      onChunk,
      {
        responseSchema: TeacherLessonSchema,
        temperature: 0.2,
      }
    );
  }
}