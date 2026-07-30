import ConceptModel from "../../concept/models/concept.model";
import { groqProvider } from "../providers/groq.provider";
import { TEACHER_SYSTEM_PROMPT, buildTeacherPrompt } from "./teacher.prompt";

export class TeacherService {
  async generateLesson(context: any): Promise<any> {
    const { conceptId } = context;

    // 1. Look up existing concept in MongoDB if conceptId is provided
    if (conceptId) {
      const existingConcept = await ConceptModel.findOne({ conceptId });
      if (existingConcept && existingConcept.lessonPayload) {
        console.log(
          `[TeacherService] Returning cached lesson from DB for: ${conceptId}`,
        );
        return existingConcept.lessonPayload;
      }
    }

    // 2. Generate new lesson payload if missing from cache
    console.log(
      `[TeacherService] Generating fresh AI lesson for: ${context.conceptTitle}`,
    );
    const prompt = buildTeacherPrompt(context);

    const lessonData = await groqProvider.generateJSON(
      prompt,
      TEACHER_SYSTEM_PROMPT,
      "teacher",
      { temperature: 0.3 },
    );

    // 3. Cache generated lesson into MongoDB for future requests
    if (conceptId && lessonData) {
      try {
        await ConceptModel.updateOne(
          { conceptId },
          { $set: { lessonPayload: lessonData } },
        );
        console.log(
          `[TeacherService] Successfully cached lesson in DB for: ${conceptId}`,
        );
      } catch (cacheErr) {
        console.error("Failed to cache lesson payload in MongoDB:", cacheErr);
      }
    }

    return lessonData;
  }
}

export const teacherService = new TeacherService();
