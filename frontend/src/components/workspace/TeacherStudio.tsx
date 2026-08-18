import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
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
  FileText,
} from "lucide-react";

interface TeacherStudioProps {
  workspaceId?: string;
  workspaceTitle: string;
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

  // Content state
  const [markdownContent, setMarkdownContent] = useState<string>("");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);

  // Flashcard Modal State
  const [isDeckOpen, setIsDeckOpen] = useState<boolean>(false);

  // Quiz Evaluation State
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationScore, setEvaluationScore] = useState<number | null>(null);

  // Scroll Container Ref to reset scroll position on tab switch / lesson change
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Reset scroll to top whenever tab or lesson changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeTab, lessonId]);

  const handleTabChange = (tab: "lesson" | "quiz") => {
    setActiveTab(tab);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  };

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
      console.error("Failed to load Tier 4 lesson studio:", err);
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
        workspaceId,
        conceptId,
        chapterId: chapterId!,
        lessonId,
        conceptTitle,
        questions: quizQuestions,
        learnerAnswers,
      });

      const masteryScore =
        (result.progress as { masteryScore?: number } | undefined)
          ?.masteryScore ??
        result.evaluation?.mastery ??
        0;

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
    <>
      {/* Active Recall Modal Sub-overlay */}
      <ActiveRecallModal
        isOpen={isDeckOpen}
        subtopicTitle={lessonTitle}
        cards={flashcards}
        onClose={() => setIsDeckOpen(false)}
      />

      {/* Main Studio Modal Overlay Window */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#080A0F]/85 backdrop-blur-xl">
        <div className="modal-enter relative w-full max-w-4xl h-[90vh] sm:h-[86vh] rounded-3xl border border-[#1E2846] bg-[#121620] shadow-2xl flex flex-col overflow-hidden">
          {/* Pinned Modal Header (shrink-0) */}
          <div className="px-6 py-4 border-b border-[#1E2846] bg-[#0d1117] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#00E5FF]/10 text-[#00E5FF]">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase text-[#00E5FF] font-bold truncate max-w-[140px] sm:max-w-none">
                    {chapterTitle || "Chapter"}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-[10px] font-mono text-neon-lime uppercase">
                    {status}
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight line-clamp-1">
                  {lessonTitle}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {flashcards.length > 0 && (
                <button
                  onClick={() => setIsDeckOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neon-lime/40 bg-neon-lime/10 text-xs font-semibold text-neon-lime hover:bg-neon-lime/20 transition cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    Recall Deck ({flashcards.length})
                  </span>
                </button>
              )}
              <button
                onClick={() => fetchLessonPayload(true)}
                title="Re-synthesize with AI"
                className="p-2 rounded-xl border border-gray-800 bg-[#181B22] text-gray-400 hover:text-white transition cursor-pointer"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? "animate-spin text-[#00E5FF]" : ""}`}
                />
              </button>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl border border-gray-800 bg-[#181B22] text-gray-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Pinned Tab Switcher (shrink-0) */}
          <div className="px-6 pt-3 border-b border-[#1E2846] bg-[#0d1117] flex items-center gap-4 shrink-0">
            <button
              onClick={() => handleTabChange("lesson")}
              className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors border-b-2 ${
                activeTab === "lesson"
                  ? "border-[#00E5FF] text-[#00E5FF]"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> JIT Notes &amp; Formulas
            </button>
            <button
              onClick={() => handleTabChange("quiz")}
              className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors border-b-2 ${
                activeTab === "quiz"
                  ? "border-neon-lime text-neon-lime"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" /> Diagnostic Quiz (
              {quizQuestions.length})
            </button>
          </div>

          {/* Dedicated Independent Scroll Container */}
          <div
            ref={scrollContainerRef}
            className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-8 space-y-6"
          >
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-xs font-semibold text-red-400"
              >
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3 font-mono text-xs">
                <Sparkles className="h-6 w-6 animate-spin text-[#00E5FF]" />
                <span>Synthesizing JIT lesson content &amp; formulas...</span>
              </div>
            ) : activeTab === "lesson" ? (
              /* TAB 1: JIT NOTES & KATEX */
              <article className="glass-card rounded-2xl p-6 sm:p-8 text-sm text-gray-300 leading-relaxed">
                <div className="prose prose-invert prose-sm sm:prose-base max-w-none break-words whitespace-normal [&_.katex-display]:overflow-x-auto [&_.katex-display]:py-2">
                  <ReactMarkdown
                    components={{
                      pre: ({ ...props }) => (
                        <pre
                          className="overflow-x-auto p-4 bg-[#080A0F] rounded-xl my-4 text-xs border border-[#1E2846]"
                          {...props}
                        />
                      ),
                      h2: ({ ...props }) => (
                        <h2
                          className="text-lg font-bold text-white mb-3 mt-5 border-b border-[#1E2846] pb-1.5"
                          {...props}
                        />
                      ),
                      h3: ({ ...props }) => (
                        <h3
                          className="text-sm font-semibold text-[#00E5FF] mb-2 mt-4"
                          {...props}
                        />
                      ),
                      p: ({ ...props }) => (
                        <p
                          className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-3"
                          {...props}
                        />
                      ),
                      strong: ({ ...props }) => (
                        <strong
                          className="font-semibold text-white"
                          {...props}
                        />
                      ),
                      ul: ({ ...props }) => (
                        <ul
                          className="list-disc list-inside space-y-1.5 my-3 text-xs sm:text-sm text-slate-300"
                          {...props}
                        />
                      ),
                      ol: ({ ...props }) => (
                        <ol
                          className="list-decimal list-inside space-y-1.5 my-3 text-xs sm:text-sm text-slate-300"
                          {...props}
                        />
                      ),
                    }}
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {markdownContent}
                  </ReactMarkdown>
                </div>
              </article>
            ) : (
              /* TAB 2: DIAGNOSTIC QUIZ */
              <div className="space-y-6 pb-4">
                {evaluationScore !== null && (
                  <div
                    role="status"
                    className={`rounded-2xl border p-5 transition-all ${
                      evaluationScore >= 80
                        ? "border-neon-lime/50 bg-neon-lime/10 text-white"
                        : "border-amber-500/50 bg-[#12141A] text-amber-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-mono uppercase font-bold tracking-wider text-neon-lime">
                        Diagnostic Evaluation
                      </h4>
                      <span className="text-2xl font-mono font-bold">
                        {evaluationScore}%
                      </span>
                    </div>
                    <p className="text-xs opacity-90">
                      {evaluationScore >= 80
                        ? "Lesson Mastered! Downstream concept nodes updated."
                        : "Score below 80%. Review the JIT notes and re-attempt."}
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
                          className="glass-card p-5 sm:p-6 rounded-2xl space-y-3"
                        >
                          <h4 className="text-xs sm:text-sm font-bold text-gray-100">
                            {qIdx + 1}. {q.question}
                          </h4>
                          <div className="space-y-2">
                            {q.options.map((option, oIdx) => (
                              <button
                                key={`${questionKey}_opt_${oIdx}`}
                                onClick={() => handleOptionSelect(qIdx, oIdx)}
                                className={`w-full text-left p-3 rounded-xl border text-xs transition cursor-pointer break-words ${
                                  userAnswers[qIdx] === oIdx
                                    ? "border-neon-lime bg-neon-lime/10 text-white font-semibold"
                                    : "border-[#1E2846] bg-[#080A0F] text-slate-300 hover:border-slate-600"
                                }`}
                              >
                                <span>{option}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    <div className="pt-2">
                      <button
                        onClick={handleSubmitQuiz}
                        disabled={isEvaluating}
                        className="w-full py-3.5 bg-neon-lime hover:bg-[#aef525] text-midnight font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-lg shadow-neon-lime/10 disabled:opacity-50"
                      >
                        {isEvaluating
                          ? "Evaluating Submission..."
                          : "Submit Diagnostic Evaluation"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-center py-12 text-xs text-gray-500 font-mono">
                    No diagnostic quiz questions generated for this lesson node.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
