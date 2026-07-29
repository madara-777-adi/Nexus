import { groqProvider } from "../providers/groq.provider";
import { TEACHER_SYSTEM_PROMPT, buildTeacherPrompt } from "./teacher.prompt";

export class TeacherService {
  async generateLesson(context: any): Promise<string> {
    const prompt = buildTeacherPrompt(context);
    return groqProvider.generateText(
      prompt,
      TEACHER_SYSTEM_PROMPT,
      "teacher",
      { temperature: 0.3 }
    );
  }
}

export const teacherService = new TeacherService();