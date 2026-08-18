import { useMemo } from "react";
import {
  ArrowLeft,
  Clock,
  Layers,
  Lock,
  Play,
  Sparkles,
  CheckCircle2,
  Grid,
} from "lucide-react";
import type {
  IConcept,
  IConceptTopic,
  ILessonNode,
} from "../../types/workspace.types";
import type { ILessonProgress } from "../../types/learning.types";
import { ConceptStatus } from "../../types/learning.types";

interface LessonListProps {
  unit: IConcept;
  chapter: IConceptTopic;
  lessons: ILessonNode[];
  isGenerating: boolean;
  lessonProgressMap: Map<string, ILessonProgress>;
  onSelectLesson: (lesson: ILessonNode) => void;
  onBackToChapters: () => void;
  onGenerateLessons: () => void;
}

export function LessonList({
  unit,
  chapter,
  lessons,
  isGenerating,
  lessonProgressMap,
  onSelectLesson,
  onBackToChapters,
  onGenerateLessons,
}: LessonListProps) {
  const getLessonProgress = (lesson: ILessonNode) => {
    const key = `${unit.conceptId}:${chapter.id}:${lesson.id}`;
    return lessonProgressMap.get(key);
  };

  const isLessonAccessible = (lesson: ILessonNode): boolean => {
    const sortedLessons = [...lessons].sort((a, b) => a.order - b.order);
    if (lesson.id === sortedLessons[0]?.id) return true;

    const progress = getLessonProgress(lesson);
    if (!progress) return false;

    return (
      progress.status === ConceptStatus.UNLOCKED ||
      progress.status === ConceptStatus.IN_PROGRESS ||
      progress.status === ConceptStatus.MASTERED
    );
  };

  // Compute upcoming lesson and overall chapter mastery
  const { upcomingLesson, masteredCount } = useMemo(() => {
    let nextLesson: ILessonNode | null = null;
    let mastered = 0;

    const sorted = [...lessons].sort((a, b) => a.order - b.order);
    for (const l of sorted) {
      const prog = getLessonProgress(l);
      if (prog?.status === ConceptStatus.MASTERED) {
        mastered += 1;
      } else if (!nextLesson && isLessonAccessible(l)) {
        nextLesson = l;
      }
    }

    if (!nextLesson && sorted.length > 0) {
      nextLesson = sorted[0];
    }

    return {
      upcomingLesson: nextLesson,
      masteredCount: mastered,
    };
  }, [lessons, unit, chapter, lessonProgressMap]);

  return (
    <div className="h-full w-full overflow-y-auto bg-[#080A0F] p-4 sm:p-6 lg:p-10">
      <div className="max-w-6xl mx-auto flex flex-col gap-8 pt-4 sm:pt-6 pb-12">
        {/* Header Navigation & Sub-module context */}
        <div className="border-b border-[#1E2846]/80 pb-6">
          <button
            onClick={onBackToChapters}
            className="mb-4 flex items-center gap-2 rounded-xl border border-[#1E2846] bg-[#0d1117] px-4 py-2 text-xs font-semibold text-gray-300 transition-all hover:border-[#00E5FF]/40 hover:text-white cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 text-[#BCFF3C]" /> Back to Chapters
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#00E5FF]">
              Tier 3 Architecture • 3rd Pillar
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-[10px] font-mono text-[#BCFF3C] uppercase">
              Chapter {chapter.order || 1}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            {chapter.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {chapter.description ||
              "Click any unlocked lesson card to launch its study studio, interactive JIT notes, and diagnostic quiz."}
          </p>
        </div>

        {/* NEXT UPCOMING LESSON HERO CARD */}
        {upcomingLesson && (
          <section className="bg-[#0d1117]/90 backdrop-blur-xl p-7 sm:p-8 rounded-3xl border border-[#BCFF3C]/50 shadow-[0_0_30px_rgba(188,255,60,0.08)] flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#BCFF3C]/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#BCFF3C]/10 text-[#BCFF3C] border border-[#BCFF3C]/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                  Next Upcoming Lesson
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Lesson #{String(upcomingLesson.order || 1).padStart(2, "0")}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {upcomingLesson.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                {upcomingLesson.description ||
                  "Interactive lesson nodes with KaTeX equations, active recall decks, and AI evaluation."}
              </p>
              <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#00E5FF]" />{" "}
                  {upcomingLesson.estimatedMinutes || 15} min study
                </span>
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#BCFF3C]" /> Active
                  Recall &amp; Diagnostic Quiz
                </span>
              </div>
            </div>

            <button
              onClick={() => onSelectLesson(upcomingLesson)}
              className="px-6 py-3.5 bg-[#BCFF3C] hover:bg-[#aef525] text-[#080A0F] font-bold text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-lg shadow-[#BCFF3C]/15 hover:scale-[1.02]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Open Lesson Studio</span>
            </button>
          </section>
        )}

        {/* ALL LESSONS CARDS GRID */}
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 font-mono text-xs text-gray-500">
            <Sparkles className="h-6 w-6 animate-spin text-[#00E5FF]" />
            <span>Generating lesson nodes with AI...</span>
          </div>
        ) : lessons.length === 0 ? (
          <div className="bg-[#0d1117] border border-dashed border-[#1E2846] rounded-3xl p-10 flex flex-col items-center justify-center gap-4 text-center max-w-md mx-auto">
            <span className="text-xs text-slate-400">
              No lesson nodes found for this chapter yet.
            </span>
            <button
              onClick={onGenerateLessons}
              className="flex items-center gap-2 rounded-xl border border-[#00E5FF]/40 bg-[#00E5FF]/10 px-5 py-2.5 text-xs font-semibold text-[#00E5FF] transition-colors hover:bg-[#00E5FF]/20 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" /> Generate Lessons
            </button>
          </div>
        ) : (
          <section className="space-y-5">
            <div className="flex items-center justify-between border-b border-[#1E2846]/60 pb-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2 font-bold">
                <Grid className="w-4 h-4 text-[#BCFF3C]" />
                Lesson Sequence
              </h3>
              <span className="text-xs font-mono text-slate-400">
                {masteredCount} of {lessons.length} Mastered
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lessons.map((lesson, idx) => {
                const accessible = isLessonAccessible(lesson);
                const prog = getLessonProgress(lesson);
                const isMastered = prog?.status === ConceptStatus.MASTERED;
                const score = prog?.masteryScore || 0;

                return (
                  <div
                    key={lesson.id}
                    onClick={
                      accessible ? () => onSelectLesson(lesson) : undefined
                    }
                    className={`group bg-[#0d1117]/90 backdrop-blur-xl border rounded-3xl p-7 transition-all duration-300 flex flex-col justify-between min-h-[230px] relative ${
                      isMastered
                        ? "border-[#BCFF3C]/40 hover:border-[#BCFF3C] hover:shadow-[0_0_25px_rgba(188,255,60,0.16)] hover:-translate-y-1 cursor-pointer"
                        : accessible
                          ? "border-[#00E5FF]/60 shadow-[0_0_25px_rgba(0,229,255,0.12)] hover:border-[#00E5FF] hover:shadow-[0_0_30px_rgba(0,229,255,0.22)] hover:-translate-y-1 cursor-pointer"
                          : "opacity-40 cursor-not-allowed border-[#1E2846]"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-8 h-8 rounded-xl font-mono text-xs font-bold flex items-center justify-center border ${
                              isMastered
                                ? "bg-[#BCFF3C]/10 text-[#BCFF3C] border-[#BCFF3C]/30"
                                : accessible
                                  ? "bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/30"
                                  : "bg-gray-800 text-gray-500 border-gray-800"
                            }`}
                          >
                            {String(lesson.order || idx + 1).padStart(2, "0")}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-semibold border ${
                              isMastered
                                ? "bg-[#BCFF3C]/10 border-[#BCFF3C]/30 text-[#BCFF3C]"
                                : accessible
                                  ? "bg-[#00E5FF]/10 border-[#00E5FF]/30 text-[#00E5FF]"
                                  : "bg-gray-800 border-gray-800 text-gray-500"
                            }`}
                          >
                            {isMastered
                              ? "Mastered"
                              : accessible
                                ? "Active Node"
                                : "Locked"}
                          </span>
                        </div>

                        {/* Status Icon / Blinking Active Indicator */}
                        {isMastered ? (
                          <div className="flex items-center gap-1.5 text-xs font-mono text-[#BCFF3C] font-bold">
                            <span>{score}%</span>
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        ) : accessible ? (
                          <span className="flex h-2.5 w-2.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E5FF] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00E5FF]"></span>
                          </span>
                        ) : (
                          <Lock className="w-4 h-4 text-gray-600" />
                        )}
                      </div>

                      <h4
                        className={`text-base sm:text-lg font-bold transition-colors line-clamp-1 ${
                          isMastered
                            ? "text-white group-hover:text-[#BCFF3C]"
                            : accessible
                              ? "text-white group-hover:text-[#00E5FF]"
                              : "text-gray-500"
                        }`}
                      >
                        {lesson.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 leading-relaxed">
                        {lesson.description ||
                          "Interactive lesson node with study notes and quiz testing."}
                      </p>
                    </div>

                    {/* Lesson Footer */}
                    <div className="mt-6 pt-4 border-t border-[#1E2846]/80 flex items-center justify-between text-xs font-mono text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />{" "}
                        {lesson.estimatedMinutes || 15} min
                      </span>
                      <span
                        className={`font-semibold ${
                          isMastered
                            ? "text-[#BCFF3C]"
                            : accessible
                              ? "text-[#00E5FF]"
                              : "text-gray-600"
                        }`}
                      >
                        {isMastered
                          ? "Review Notes →"
                          : accessible
                            ? "Launch Studio →"
                            : "Locked"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
