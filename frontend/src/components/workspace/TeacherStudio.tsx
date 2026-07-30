import { useState, useEffect } from "react";
import { useTeacherStream } from "../../hooks/useTeacherStream";
import { evaluateSubmission } from "../../api/ai.api";
import { ConceptStatus } from "../../types/learning.types";
import type { QuizQuestion } from "../../types/ai.types";

interface TeacherStudioProps {
  workspaceId: string;
  workspaceTitle: string;
  conceptId: string;
  conceptTitle: string;
  status: ConceptStatus;
  onClose: () => void;
  onProgressUpdated?: () => void;
}

export function TeacherStudio({
  workspaceId,
  workspaceTitle,
  conceptId,
  conceptTitle,
  status,
  onClose,
  onProgressUpdated,
}: TeacherStudioProps) {
  const { streamLesson, stopStream, parsedLesson, isLoading, error } =
    useTeacherStream();
  const [activeTab, setActiveTab] = useState<"lesson" | "quiz">("lesson");

  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationScore, setEvaluationScore] = useState<number | null>(null);
  const [unlockedNodes, setUnlockedNodes] = useState<string[]>([]);

  useEffect(() => {
    if (!workspaceId || !conceptId) return;

    // Reset state when selecting a new concept
    setUserAnswers({});
    setEvaluationScore(null);
    setUnlockedNodes([]);
    setActiveTab("lesson");

    // Fire lesson stream request to AI Teacher endpoint
    streamLesson({
      workspaceId,
      workspaceTitle: workspaceTitle || "Workspace",
      conceptId,
      conceptTitle: conceptTitle || "Concept",
      difficulty: "Intermediate",
      preferredDepth: "Balanced",
    });

    return () => {
      if (stopStream) {
        stopStream();
      }
    };
    // Exclude streamLesson/stopStream from deps to avoid re-triggering loops if they aren't memoized
    // eslint-disable-next-deps
  }, [workspaceId, workspaceTitle, conceptId, conceptTitle]);

  const handleOptionSelect = (questionIndex: number, optionIndex: number) => {
    setUserAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
  };

  const handleSubmitQuiz = async () => {
    const quizList: QuizQuestion[] = parsedLesson?.quiz || [];
    if (quizList.length === 0) return;

    setIsEvaluating(true);
    try {
      const learnerAnswers = quizList.map((q, idx) => ({
        question: q.question,
        userAnswer:
          userAnswers[idx] !== undefined
            ? q.options[userAnswers[idx]]
            : "No answer provided",
      }));

      // Single unified call for grading and DB update
      const result = await evaluateSubmission({
        workspaceId,
        conceptId,
        conceptTitle,
        questions: quizList,
        learnerAnswers,
      });

      const masteryScore = result.evaluation?.mastery ?? 0;
      setEvaluationScore(masteryScore);

      setUnlockedNodes(result.unlockedDownstreamIds || []);

      if (onProgressUpdated) {
        onProgressUpdated();
      }
    } catch (err: unknown) {
      console.error("Evaluation failed:", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col border-l border-slate-800 bg-[#080A0F] text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-[#080A0F] p-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500">
              {workspaceTitle || "Workspace"}
            </span>
            <span className="text-slate-700">•</span>
            <span className="rounded border border-slate-800 bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-[#BCFF3C]">
              {status}
            </span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-white">
            {conceptTitle}
          </h2>
        </div>

        <button
          onClick={() => {
            if (stopStream) stopStream();
            onClose();
          }}
          className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 transition-colors hover:border-slate-700 hover:text-white cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-[#080A0F] px-4">
        <button
          onClick={() => setActiveTab("lesson")}
          className={`border-b-2 py-3 px-4 text-sm font-medium transition-colors cursor-pointer ${
            activeTab === "lesson"
              ? "border-[#BCFF3C] text-[#BCFF3C]"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          AI Pedagogy Stream
        </button>
        <button
          onClick={() => setActiveTab("quiz")}
          className={`border-b-2 py-3 px-4 text-sm font-medium transition-colors cursor-pointer ${
            activeTab === "quiz"
              ? "border-[#BCFF3C] text-[#BCFF3C]"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Diagnostic Quiz{" "}
          {parsedLesson?.quiz?.length ? `(${parsedLesson.quiz.length})` : ""}
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {activeTab === "lesson" && (
          <div className="space-y-6">
            {isLoading && !parsedLesson && (
              <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-[#0F131C] p-4 text-sm text-slate-400">
                <span className="h-2 w-2 animate-ping rounded-full bg-[#BCFF3C]" />
                Streaming lesson payload from Teacher Engine...
              </div>
            )}

            {parsedLesson?.overview && (
              <section className="rounded-xl border border-slate-800 bg-[#0F131C] p-5">
                <h3 className="mb-2 text-xs font-mono font-semibold text-[#BCFF3C] uppercase tracking-wider">
                  Overview
                </h3>
                <p className="text-sm leading-relaxed text-slate-300">
                  {parsedLesson.overview}
                </p>
              </section>
            )}

            {parsedLesson?.definition && (
              <section className="rounded-xl border border-slate-800 bg-[#0F131C] p-5">
                <h3 className="mb-2 text-xs font-mono font-semibold text-sky-400 uppercase tracking-wider">
                  Core Definition
                </h3>
                <p className="text-sm leading-relaxed text-slate-300">
                  {parsedLesson.definition}
                </p>
              </section>
            )}

            {parsedLesson?.intuition && (
              <section className="rounded-xl border border-amber-500/20 bg-[#14120B] p-5">
                <h3 className="mb-2 text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider">
                  Intuition & Mental Model
                </h3>
                <p className="text-sm leading-relaxed text-amber-100/90">
                  {parsedLesson.intuition}
                </p>
              </section>
            )}

            {parsedLesson?.analogy && (
              <section className="rounded-xl border border-slate-800 bg-[#0F131C] p-5">
                <h3 className="mb-2 text-xs font-mono font-semibold text-purple-400 uppercase tracking-wider">
                  Real-World Analogy
                </h3>
                <p className="text-sm leading-relaxed text-slate-300">
                  {parsedLesson.analogy}
                </p>
              </section>
            )}

            {parsedLesson?.explanation && (
              <section className="rounded-xl border border-slate-800 bg-[#0F131C] p-5">
                <h3 className="mb-2 text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
                  Detailed Explanation
                </h3>
                <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-line">
                  {parsedLesson.explanation}
                </p>
              </section>
            )}

            {parsedLesson?.keyPoints && parsedLesson.keyPoints.length > 0 && (
              <section className="rounded-xl border border-slate-800 bg-[#0F131C] p-5">
                <h3 className="mb-3 text-xs font-mono font-semibold text-[#BCFF3C] uppercase tracking-wider">
                  Key Takeaways
                </h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  {parsedLesson.keyPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#BCFF3C]">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        {activeTab === "quiz" && (
          <div className="space-y-6">
            {evaluationScore !== null && (
              <div
                className={`rounded-xl border p-5 ${
                  evaluationScore >= 80
                    ? "border-[#BCFF3C]/50 bg-[#0D150A] text-white"
                    : "border-amber-500/50 bg-[#14120B] text-amber-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-base font-bold">Evaluation Score</h4>
                  <span className="text-2xl font-mono font-bold">
                    {evaluationScore}%
                  </span>
                </div>
                <p className="text-sm opacity-90">
                  {evaluationScore >= 80
                    ? "Concept Mastered! Downstream graph edges evaluated."
                    : "Below 80% threshold. Practice recommended before unlocking next node."}
                </p>
                {unlockedNodes.length > 0 && (
                  <div className="mt-3 border-t border-[#BCFF3C]/30 pt-3">
                    <span className="text-xs font-semibold text-[#BCFF3C] uppercase tracking-wider">
                      Newly Unlocked Nodes:
                    </span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {unlockedNodes.map((id) => (
                        <span
                          key={id}
                          className="rounded-md border border-[#BCFF3C]/40 bg-[#BCFF3C]/10 px-2 py-1 font-mono text-xs text-[#BCFF3C]"
                        >
                          {id}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {parsedLesson?.quiz && parsedLesson.quiz.length > 0 ? (
              <div className="space-y-6">
                {parsedLesson.quiz.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    className="rounded-xl border border-slate-800 bg-[#0F131C] p-5"
                  >
                    <h4 className="mb-4 text-sm font-semibold text-slate-100">
                      {qIdx + 1}. {q.question}
                    </h4>
                    <div className="space-y-2">
                      {q.options.map((option, oIdx) => (
                        <button
                          key={oIdx}
                          onClick={() => handleOptionSelect(qIdx, oIdx)}
                          className={`w-full text-left rounded-lg border p-3 text-sm transition-all cursor-pointer ${
                            userAnswers[qIdx] === oIdx
                              ? "border-[#BCFF3C] bg-[#BCFF3C]/10 text-white font-medium"
                              : "border-slate-800 bg-[#080A0F] text-slate-300 hover:border-slate-700"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <button
                  onClick={handleSubmitQuiz}
                  disabled={isEvaluating}
                  className="w-full rounded-xl bg-[#BCFF3C] py-3.5 text-sm font-bold text-black transition-all hover:bg-[#aef525] disabled:opacity-50 cursor-pointer"
                >
                  {isEvaluating
                    ? "Evaluating Submission..."
                    : "Submit Diagnostic Assessment"}
                </button>
              </div>
            ) : (
              <div className="text-center py-12 text-sm text-slate-500">
                No diagnostic questions available yet for this concept.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
