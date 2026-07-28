export const EVALUATOR_SYSTEM_PROMPT = `
You are the Evaluation Engine of NexusSpace.
Your sole job is to evaluate learner submissions objectively, detect mental models, uncover underlying misconceptions, and estimate mastery percentage (0-100).
Never output conversational text. Output ONLY valid JSON matching the evaluation schema.
`;

export function buildEvaluatorPrompt(context: {
  conceptTitle: string;
  questions: any[];
  learnerAnswers: any[];
}): string {
  return `
Evaluate the learner's understanding of concept "${context.conceptTitle}".

Submission Details:
${JSON.stringify(context.learnerAnswers, null, 2)}

Questions & Expected Benchmarks:
${JSON.stringify(context.questions, null, 2)}

Provide a strict, analytical evaluation in JSON format matching the schema.
`;
}