import { useState, useEffect } from "react";
import { useTeacherStream } from "../../hooks/useTeacherStream";
import { evaluateSubmission } from "../../api/ai.api";
import { ConceptStatus } from "../../types/learning.types";

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

  // Interactive Subtopic State
  const [selectedSubtopic, setSelectedSubtopic] = useState<{
    topicTitle: string;
    subtopicTitle: string;
  } | null>(null);

  useEffect(() => {
    if (!workspaceId || !conceptId) return;

    setUserAnswers({});
    setEvaluationScore(null);
    setUnlockedNodes([]);
    setSelectedSubtopic(null);
    setActiveTab("lesson");

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
  }, [workspaceId, workspaceTitle, conceptId, conceptTitle]);

  const handleRegenerate = () => {
    streamLesson({
      workspaceId,
      workspaceTitle: workspaceTitle || "Workspace",
      conceptId,
      conceptTitle: conceptTitle || "Concept",
      difficulty: "Intermediate",
      preferredDepth: "Balanced",
      forceRefresh: true,
    });
  };

  const handleOptionSelect = (questionIndex: number, optionIndex: number) => {
    setUserAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
  };

  const handleSubmitQuiz = async () => {
    const quizList = Array.isArray(parsedLesson?.quiz) ? parsedLesson.quiz : [];
    if (quizList.length === 0) return;

    setIsEvaluating(true);
    try {
      const learnerAnswers = quizList.map((q, idx) => ({
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
        questions: quizList as any,
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
            {parsedLesson?.concept || conceptTitle}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRegenerate}
            title="Re-generate Lesson & Quiz with AI"
            className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:border-[#BCFF3C]/50 hover:text-[#BCFF3C] transition-colors cursor-pointer"
          >
            🔄 Refresh AI
          </button>
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
          Curriculum Pedagogy
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
          {Array.isArray(parsedLesson?.quiz)
            ? `(${parsedLesson.quiz.length})`
            : "(0)"}
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Selected Subtopic Detail Popover */}
        {selectedSubtopic && (
          <div className="rounded-xl border border-[#BCFF3C]/40 bg-[#BCFF3C]/5 p-4 text-xs space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="font-mono font-semibold text-[#BCFF3C] uppercase tracking-wider">
                Focus Area: {selectedSubtopic.topicTitle}
              </span>
              <button
                onClick={() => setSelectedSubtopic(null)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-sm font-bold text-white">
              {selectedSubtopic.subtopicTitle}
            </p>
            <p className="text-slate-300 leading-relaxed">
              Active subtopic focus node. Master this core module before taking
              the diagnostic assessment!
            </p>
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

            {/* Overview / Description */}
            {parsedLesson?.description && (
              <section className="rounded-xl border border-slate-800 bg-[#0F131C] p-5">
                <h3 className="mb-2 text-xs font-mono font-semibold text-[#BCFF3C] uppercase tracking-wider">
                  Overview & Description
                </h3>
                <p className="text-sm leading-relaxed text-slate-300">
                  {parsedLesson.description}
                </p>
              </section>
            )}

            {/* Learning Objectives */}
            {Array.isArray(parsedLesson?.objectives) &&
              parsedLesson.objectives.length > 0 && (
                <section className="rounded-xl border border-slate-800 bg-[#0F131C] p-5">
                  <h3 className="mb-3 text-xs font-mono font-semibold text-sky-400 uppercase tracking-wider">
                    Learning Objectives
                  </h3>
                  <ul className="space-y-2 text-sm text-slate-300">
                    {parsedLesson.objectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-sky-400">•</span>
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

            {/* Interactive Topics & Subtopics */}
            {Array.isArray(parsedLesson?.topics) &&
              parsedLesson.topics.length > 0 && (
                <section className="rounded-xl border border-slate-800 bg-[#0F131C] p-5 space-y-4">
                  <h3 className="text-xs font-mono font-semibold text-[#BCFF3C] uppercase tracking-wider">
                    Curriculum Topics (Click a topic to focus)
                  </h3>
                  <div className="space-y-3">
                    {parsedLesson.topics.map((topic, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-slate-800/80 bg-[#080A0F] p-4 space-y-2"
                      >
                        <h4 className="text-sm font-semibold text-white">
                          {i + 1}. {topic?.title || "Topic"}
                        </h4>
                        <p className="text-xs text-slate-400">
                          {topic?.description || ""}
                        </p>
                        {Array.isArray(topic?.subtopics) &&
                          topic.subtopics.length > 0 && (
                            <div className="pt-1 flex flex-wrap gap-1.5">
                              {topic.subtopics.map((sub, sIdx) => (
                                <button
                                  key={sIdx}
                                  onClick={() =>
                                    setSelectedSubtopic({
                                      topicTitle: topic?.title || "Topic",
                                      subtopicTitle: sub,
                                    })
                                  }
                                  className={`rounded border px-2.5 py-1 text-[11px] font-mono transition-all cursor-pointer ${
                                    selectedSubtopic?.subtopicTitle === sub
                                      ? "border-[#BCFF3C] bg-[#BCFF3C]/20 text-white font-bold"
                                      : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600 hover:text-white"
                                  }`}
                                >
                                  {sub}
                                </button>
                              ))}
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

            {/* Hands-On Activities */}
            {Array.isArray(parsedLesson?.activities) &&
              parsedLesson.activities.length > 0 && (
                <section className="rounded-xl border border-amber-500/20 bg-[#14120B] p-5 space-y-3">
                  <h3 className="text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider">
                    Hands-On Activities
                  </h3>
                  {parsedLesson.activities
                    .filter((act) => act && act?.type?.toLowerCase() !== "quiz")
                    .map((act, i) => (
                      <div key={i} className="space-y-2">
                        <h4 className="text-sm font-semibold text-amber-200">
                          {act?.title || "Activity"}
                        </h4>
                        <p className="text-xs text-amber-100/80">
                          {act?.description || ""}
                        </p>
                        {Array.isArray(act?.instructions) &&
                          act.instructions.length > 0 && (
                            <ol className="list-decimal list-inside space-y-1 text-xs text-amber-200/90 pl-1">
                              {act.instructions.map((inst, idx) => (
                                <li key={idx}>{inst}</li>
                              ))}
                            </ol>
                          )}
                      </div>
                    ))}
                </section>
              )}

            {/* Resources */}
            {Array.isArray(parsedLesson?.resources) &&
              parsedLesson.resources.length > 0 && (
                <section className="rounded-xl border border-slate-800 bg-[#0F131C] p-5 space-y-3">
                  <h3 className="text-xs font-mono font-semibold text-purple-400 uppercase tracking-wider">
                    Recommended Learning Resources
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {parsedLesson.resources.map((res, i) => (
                      <a
                        key={i}
                        href={res?.url || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 rounded-lg border border-slate-800 bg-[#080A0F] p-3 text-xs text-slate-300 transition-colors hover:border-purple-500/40 hover:text-white"
                      >
                        <span className="rounded bg-purple-950/60 p-1 text-purple-400 font-mono text-[10px]">
                          {(res?.type || "LINK").toUpperCase()}
                        </span>
                        <span className="truncate font-medium">
                          {res?.title || "Resource Link"}
                        </span>
                      </a>
                    ))}
                  </div>
                </section>
              )}

            {/* Assessment */}
            {parsedLesson?.assessment && (
              <section className="rounded-xl border border-slate-800 bg-[#0F131C] p-5 space-y-2">
                <h3 className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider">
                  Cap-Stone Assessment:{" "}
                  {parsedLesson.assessment?.title || "Project"}
                </h3>
                <p className="text-xs text-slate-300">
                  {parsedLesson.assessment?.description || ""}
                </p>
                {Array.isArray(parsedLesson.assessment?.requirements) && (
                  <ul className="mt-2 space-y-1 text-xs text-slate-400">
                    {parsedLesson.assessment.requirements.map((req, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="text-emerald-400">✓</span> {req}
                      </li>
                    ))}
                  </ul>
                )}
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

            {Array.isArray(parsedLesson?.quiz) &&
            parsedLesson.quiz.length > 0 ? (
              <div className="space-y-6">
                {parsedLesson.quiz.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    className="rounded-xl border border-slate-800 bg-[#0F131C] p-5"
                  >
                    <h4 className="mb-4 text-sm font-semibold text-slate-100">
                      {qIdx + 1}. {q?.question || "Question"}
                    </h4>
                    <div className="space-y-2">
                      {Array.isArray(q?.options) &&
                        q.options.map((option, oIdx) => (
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
              <div className="text-center py-12 text-sm text-slate-500 space-y-3">
                <p>No diagnostic questions found in cached lesson payload.</p>
                <button
                  onClick={handleRegenerate}
                  className="rounded-lg bg-[#BCFF3C]/10 border border-[#BCFF3C]/40 px-4 py-2 font-mono text-xs font-bold text-[#BCFF3C] hover:bg-[#BCFF3C]/20 transition-all cursor-pointer"
                >
                  ✨ Click here to re-generate with Quiz
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
