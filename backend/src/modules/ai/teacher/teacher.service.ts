import ConceptModel from "../../concept/models/concept.model";
import { groqProvider } from "../providers/groq.provider";
import { TEACHER_SYSTEM_PROMPT, buildTeacherPrompt } from "./teacher.prompt";

export class TeacherService {
  async generateLesson(context: any): Promise<any> {
    const { conceptId, forceRefresh } = context;

    // 1. Check DB Cache First (Unless forceRefresh is requested)
    if (conceptId && !forceRefresh) {
      const existingConcept = await ConceptModel.findOne({ conceptId });
      if (existingConcept && existingConcept.lessonPayload) {
        console.log(
          `[TeacherService] Returning cached Layer 3 lesson from DB for: ${conceptId}`,
        );
        return existingConcept.lessonPayload;
      }
    }

    // 2. Just-In-Time Generation via Groq
    console.log(
      `[TeacherService] Generating fresh AI lesson for: ${context.conceptTitle}`,
    );
    const prompt = buildTeacherPrompt(context);

    const rawLessonData = await groqProvider.generateJSON(
      prompt,
      TEACHER_SYSTEM_PROMPT,
      "teacher",
      { temperature: 0.3 },
    );

    // 3. Normalize & Sanitize JSON Payload
    const normalizedPayload = this.normalizeLessonPayload(rawLessonData);

    // 4. Update Database (Cache Layer 2 subtopics & Layer 3 full lesson)
    if (conceptId && normalizedPayload) {
      try {
        const updateData: Record<string, any> = {
          lessonPayload: normalizedPayload,
        };

        // If topics exist in generated data, sync them to Layer 2 concept record
        if (
          Array.isArray(normalizedPayload.topics) &&
          normalizedPayload.topics.length > 0
        ) {
          updateData.topics = normalizedPayload.topics;
        }

        await ConceptModel.updateOne({ conceptId }, { $set: updateData });

        console.log(
          `[TeacherService] Successfully cached lesson & topics in DB for: ${conceptId}`,
        );
      } catch (cacheErr) {
        console.error("Failed to cache lesson payload in MongoDB:", cacheErr);
      }
    }

    return normalizedPayload;
  }

  /**
   * Helper to ensure generated AI JSON strictly satisfies frontend requirements
   */
  private normalizeLessonPayload(rawData: any): any {
    if (!rawData) return {};

    let data = rawData?.data ? rawData.data : rawData;

    // Extract diagnostic quiz across all possible LLM output variations
    let quizList: any[] = [];

    if (Array.isArray(data?.quiz) && data.quiz.length > 0) {
      quizList = data.quiz;
    } else if (Array.isArray(data?.questions) && data.questions.length > 0) {
      quizList = data.questions;
    } else if (
      Array.isArray(data?.assessment) &&
      Array.isArray(data.assessment[0]?.questions)
    ) {
      // Handles assessment as an array: assessment: [{ questions: [...] }]
      quizList = data.assessment[0].questions;
    } else if (Array.isArray(data?.assessment?.questions)) {
      // Handles assessment as an object: assessment: { questions: [...] }
      quizList = data.assessment.questions;
    } else if (Array.isArray(data?.activities)) {
      for (const act of data.activities) {
        if (Array.isArray(act?.questions) && act.questions.length > 0) {
          quizList = act.questions;
          break;
        }
      }
    }

    // Normalize quiz items so every question has an options array and valid answer index
    const normalizedQuiz = quizList.map((q: any) => ({
      question: q?.question || "Question",
      options: Array.isArray(q?.options) ? q.options : [],
      answerIndex: typeof q?.answerIndex === "number" ? q.answerIndex : 0,
    }));

    return {
      ...data,
      quiz: normalizedQuiz,
    };
  }
}

export const teacherService = new TeacherService();
