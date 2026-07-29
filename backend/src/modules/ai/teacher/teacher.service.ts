import { groqProvider } from "../providers/groq.provider";
import { TEACHER_SYSTEM_PROMPT, buildTeacherPrompt } from "./teacher.prompt";

export class TeacherService {
  async generateLesson(context: any): Promise<any> {
    const prompt = buildTeacherPrompt(context);
    
    // Use generateJSON to enforce structured payload matching ParsedLesson
    return groqProvider.generateJSON(
      prompt,
      TEACHER_SYSTEM_PROMPT,
      "teacher",
      { temperature: 0.3 }
    );
  }
}

export const teacherService = new TeacherService();