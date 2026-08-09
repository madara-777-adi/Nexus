import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { isAxiosError } from "axios";
import { getLearningExperience, evaluateSubmission } from "../../api/ai.api";
import { ActiveRecallModal } from "./ActiveRecallModal";
import { ConceptStatus } from "../../types/learning.types";
import type { Flashcard, QuizQuestion } from "../../types/ai.types";
import {
  Sparkles,
  RefreshCw,
  X,
  BookOpen,
  Layers,
  HelpCircle,
} from "lucide-react";

interface TeacherStudioProps {
  workspaceId?: string;
  workspaceTitle: string;
  /** Unit that owns this lesson. The evaluator stays Unit-scoped. */
  conceptId: string;
  conceptTitle: string;
  status: ConceptStatus;
  chapterId?: string;
  chapterTitle?: string;
  lessonId: string;
  lessonTitle: string;
  onClose: () => void;
  onProgressUpdated?: () => void;
}

export function TeacherStudio({
  workspaceId,
  workspaceTitle,
  conceptId,
  conceptTitle,
  status,
  chapterId,
  chapterTitle,
  lessonId,
  lessonTitle,
  onClose,
  onProgressUpdated,
}: TeacherStudioProps) {
  const [activeTab, setActiveTab] = useState<"lesson" | "quiz">("lesson");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Tier 3 Payload State
  const [markdownContent, setMarkdownContent] = useState<string>("");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);

  // Active Recall Modal State
  const [isDeckOpen, setIsDeckOpen] = useState<boolean>(false);

  // Quiz Evaluation State
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationScore, setEvaluationScore] = useState<number | null>(null);

  const fetchLessonPayload = async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getLearningExperience({
        conceptId,
        chapterId,
        lessonId,
        workspaceId,
        workspaceTitle: workspaceTitle || "Workspace",
        moduleTitle: conceptTitle || "Module",
        chapterTitle,
        lessonTitle,
        forceRefresh,
      });

      setMarkdownContent(data?.markdownContent || "");
      setFlashcards(data?.flashcards || []);
      setQuizQuestions(data?.quiz || []);
    } catch (err: unknown) {
      console.error("Failed to load Tier 3 lesson:", err);
      if (isAxiosError(err)) {
        setError(
          err.response?.data?.message || "Failed to load learning experience.",
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load learning experience.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!conceptId || !workspaceId || !lessonId) return;
    setUserAnswers({});
    setEvaluationScore(null);
    setActiveTab("lesson");
    fetchLessonPayload(false);
  }, [conceptId, chapterId, lessonId, workspaceId]);

  const handleOptionSelect = (questionIndex: number, optionIndex: number) => {
    setUserAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
  };

  const handleSubmitQuiz = async () => {
    if (quizQuestions.length === 0) return;

    setIsEvaluating(true);
    try {
      const learnerAnswers = quizQuestions.map((q, idx) => ({
        question: q?.question || "Question",
        userAnswer:
          userAnswers[idx] !== undefined && Array.isArray(q?.options)
            ? q.options[userAnswers[idx]]
            : "No answer provided",
      }));

      const result = await evaluateSubmission({
        conceptId,
        conceptTitle,
        questions: quizQuestions,
        learnerAnswers,
      });

      // Prefer the persisted, authoritative masteryScore (backend already
      // reconciles several possible AI field names before writing this) over
      // the raw evaluation payload, whose field name depends entirely on
      // unvalidated AI output.
      const masteryScore =
        (result.progress as { masteryScore?: number } | undefined)
          ?.masteryScore ?? result.evaluation?.mastery ?? 0;
      setEvaluationScore(masteryScore);

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
    <div className="flex h-full w-full flex-col border-l border-gray-800 bg-[#080A0F] text-gray-200">
      {/* Floating Active Recall Deck Overlay */}
      <ActiveRecallModal
        isOpen={isDeckOpen}
        subtopicTitle={lessonTitle}
        cards={flashcards}
        onClose={() => setIsDeckOpen(false)}
      />

      {/* Studio Header */}
      <div className="flex items-center justify-between border-b border-gray-800 bg-[#12141A] p-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              {workspaceTitle || "Workspace"}
            </span>
            <span className="text-gray-600">•</span>
            <span
              className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                status === ConceptStatus.MASTERED
                  ? "bg-[#BCFF3C]/10 text-[#BCFF3C]"
                  : "bg-[#00E5FF]/10 text-[#00E5FF]"
              }`}
            >
              {status}
            </span>
          </div>
          <h2 className="text-base font-medium tracking-tight text-white mt-0.5">
            {lessonTitle}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {flashcards.length > 0 && (
            <button
              onClick={() => setIsDeckOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-[#BCFF3C]/40 bg-[#BCFF3C]/10 px-2.5 py-1.5 text-xs font-semibold text-[#BCFF3C] hover:bg-[#BCFF3C]/20 transition-colors cursor-pointer"
            >
              <Layers className="h-3.5 w-3.5" /> Active Recall (
              {flashcards.length})
            </button>
          )}

          <button
            onClick={() => fetchLessonPayload(true)}
            aria-label="Re-generate lesson content with AI"
            title="Re-generate with AI"
            className="rounded-lg border border-gray-800 bg-[#181B22] p-2 text-gray-400 hover:border-gray-700 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>

          <button
            onClick={onClose}
            aria-label="Close studio panel"
            className="rounded-lg border border-gray-800 bg-[#181B22] p-2 text-gray-400 hover:border-gray-700 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        role="tablist"
        className="flex border-b border-gray-800 bg-[#12141A] px-4"
      >
        <button
          role="tab"
          aria-selected={activeTab === "lesson"}
          onClick={() => setActiveTab("lesson")}
          className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-semibold tracking-wide uppercase transition-colors cursor-pointer ${
            activeTab === "lesson"
              ? "border-[#00E5FF] text-[#00E5FF]"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" /> JIT Notes
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "quiz"}
          onClick={() => setActiveTab("quiz")}
          className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-semibold tracking-wide uppercase transition-colors cursor-pointer ${
            activeTab === "quiz"
              ? "border-[#BCFF3C] text-[#BCFF3C]"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <HelpCircle className="h-3.5 w-3.5" /> Diagnostic Quiz (
          {quizQuestions.length})
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-sm text-red-400"
          >
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500 gap-3">
            <Sparkles className="h-6 w-6 animate-spin text-[#00E5FF]" />
            <span className="text-xs font-mono">
              Synthesizing JIT lesson payload...
            </span>
          </div>
        ) : activeTab === "lesson" ? (
          <div className="space-y-6">
            <article className="rounded-xl border border-gray-800 bg-[#12141A] p-6 text-sm text-gray-300">
              <ReactMarkdown
                components={{
                  h2: ({ ...props }) => (
                    <h2
                      className="text-base font-bold text-white mb-3 mt-4 border-b border-gray-800 pb-1"
                      {...props}
                    />
                  ),
                  h3: ({ ...props }) => (
                    <h3
                      className="text-sm font-semibold text-[#00E5FF] mb-2 mt-3"
                      {...props}
                    />
                  ),
                  p: ({ ...props }) => (
                    <p
                      className="text-xs text-gray-300 leading-relaxed mb-3"
                      {...props}
                    />
                  ),
                  strong: ({ ...props }) => (
                    <strong className="font-semibold text-white" {...props} />
                  ),
                  ul: ({ ...props }) => (
                    <ul
                      className="list-disc list-inside space-y-1 my-2 text-xs text-gray-300"
                      {...props}
                    />
                  ),
                  ol: ({ ...props }) => (
                    <ol
                      className="list-decimal list-inside space-y-1 my-2 text-xs text-gray-300"
                      {...props}
                    />
                  ),
                }}
              >
                {markdownContent}
              </ReactMarkdown>
            </article>
          </div>
        ) : (
          <div className="space-y-6">
            {evaluationScore !== null && (
              <div
                role="status"
                className={`rounded-xl border p-5 ${
                  evaluationScore >= 80
                    ? "border-[#BCFF3C]/50 bg-[#12141A] text-white"
                    : "border-amber-500/50 bg-[#12141A] text-amber-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold uppercase tracking-wider">
                    Evaluation Score
                  </h4>
                  <span className="text-2xl font-mono font-bold">
                    {evaluationScore}%
                  </span>
                </div>
                <p className="text-xs opacity-90">
                  {evaluationScore >= 80
                    ? "Subtopic Mastered! Downstream nodes updated."
                    : "Score below 80%. Review notes and try again."}
                </p>
              </div>
            )}

            {quizQuestions.length > 0 ? (
              <div className="space-y-4">
                {quizQuestions.map((q, qIdx) => {
                  const questionKey = q.question
                    ? `q_${qIdx}_${q.question.substring(0, 15)}`
                    : `question_${qIdx}`;

                  return (
                    <div
                      key={questionKey}
                      className="rounded-xl border border-gray-800 bg-[#12141A] p-5 space-y-3"
                    >
                      <h4 className="text-sm font-medium text-gray-100">
                        {qIdx + 1}. {q.question}
                      </h4>
                      <div className="space-y-2">
                        {q.options.map((option, oIdx) => (
                          <button
                            key={`${questionKey}_opt_${oIdx}`}
                            onClick={() => handleOptionSelect(qIdx, oIdx)}
                            className={`w-full text-left rounded-lg border p-3 text-xs transition-all cursor-pointer ${
                              userAnswers[qIdx] === oIdx
                                ? "border-[#BCFF3C] bg-[#BCFF3C]/10 text-white font-medium"
                                : "border-gray-800/80 bg-[#181B22] text-gray-300 hover:border-gray-700"
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                <button
                  onClick={handleSubmitQuiz}
                  disabled={isEvaluating}
                  className="w-full rounded-xl bg-[#BCFF3C] py-3 text-xs font-semibold uppercase tracking-wider text-black transition-all hover:bg-[#aef525] disabled:opacity-50 cursor-pointer"
                >
                  {isEvaluating
                    ? "Evaluating Submission..."
                    : "Submit Diagnostic Assessment"}
                </button>
              </div>
            ) : (
              <p className="text-center py-12 text-xs text-gray-500">
                No quiz questions generated for this subtopic.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
