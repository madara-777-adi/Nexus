import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { getTier3Lesson, evaluateSubmission } from "../../api/ai.api";
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
  workspaceId: string;
  workspaceTitle: string;
  conceptId: string;
  conceptTitle: string;
  status: ConceptStatus;
  subtopicId?: string;
  subtopicTitle?: string;
  onClose: () => void;
  onProgressUpdated?: () => void;
}

export function TeacherStudio({
  workspaceId,
  workspaceTitle,
  conceptId,
  conceptTitle,
  status,
  subtopicId = "overview",
  subtopicTitle = "Overview & Fundamentals",
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
  const [unlockedNodes, setUnlockedNodes] = useState<string[]>([]);

  const fetchLessonPayload = async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getTier3Lesson({
        conceptId,
        subtopicId,
        workspaceId,
        workspaceTitle: workspaceTitle || "Workspace",
        moduleTitle: conceptTitle || "Module",
        subtopicTitle,
        forceRefresh,
      });

      setMarkdownContent(data.markdownContent || "");
      setFlashcards(data.flashcards || []);
      setQuizQuestions(data.quiz || []);
    } catch (err: any) {
      console.error("Failed to load Tier 3 lesson:", err);
      setError(
        err?.response?.data?.message || "Failed to load deep lesson payload.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!conceptId || !workspaceId) return;
    setUserAnswers({});
    setEvaluationScore(null);
    setUnlockedNodes([]);
    setActiveTab("lesson");
    fetchLessonPayload(false);
  }, [conceptId, subtopicId, workspaceId]);

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
        workspaceId,
        conceptId,
        conceptTitle,
        questions: quizQuestions,
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
    <div className="flex h-full w-full flex-col border-l border-gray-800 bg-[#080A0F] text-gray-200">
      {/* Floating Active Recall Deck Overlay */}
      <ActiveRecallModal
        isOpen={isDeckOpen}
        subtopicTitle={subtopicTitle}
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
            {subtopicTitle}
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
            title="Re-generate with AI"
            className="rounded-lg border border-gray-800 bg-[#181B22] p-2 text-gray-400 hover:border-gray-700 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>

          <button
            onClick={onClose}
            className="rounded-lg border border-gray-800 bg-[#181B22] p-2 text-gray-400 hover:border-gray-700 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 bg-[#12141A] px-4">
        <button
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
          <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-sm text-red-400">
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
                  h2: ({ node, ...props }) => (
                    <h2
                      className="text-base font-bold text-white mb-3 mt-4 border-b border-gray-800 pb-1"
                      {...props}
                    />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3
                      className="text-sm font-semibold text-[#00E5FF] mb-2 mt-3"
                      {...props}
                    />
                  ),
                  p: ({ node, ...props }) => (
                    <p
                      className="text-xs text-gray-300 leading-relaxed mb-3"
                      {...props}
                    />
                  ),
                  strong: ({ node, ...props }) => (
                    <strong className="font-semibold text-white" {...props} />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul
                      className="list-disc list-inside space-y-1 my-2 text-xs text-gray-300"
                      {...props}
                    />
                  ),
                  ol: ({ node, ...props }) => (
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
                {quizQuestions.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    className="rounded-xl border border-gray-800 bg-[#12141A] p-5 space-y-3"
                  >
                    <h4 className="text-sm font-medium text-gray-100">
                      {qIdx + 1}. {q.question}
                    </h4>
                    <div className="space-y-2">
                      {q.options.map((option, oIdx) => (
                        <button
                          key={oIdx}
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
                ))}

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