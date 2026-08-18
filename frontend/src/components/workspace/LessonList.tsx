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
  /**
   * Derive lesson progress and accessibility from LessonProgress map
   */
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

  // Find the next upcoming/active lesson node to display as the Hero Card
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

    // Default to first accessible lesson if not all are completed
    if (!nextLesson && sorted.length > 0) {
      nextLesson = sorted[0];
    }

    return {
      upcomingLesson: nextLesson,
      masteredCount: mastered,
    };
  }, [lessons, unit, chapter, lessonProgressMap]);

  return (
    <div className="h-full w-full overflow-y-auto bg-[#080A0F] p-4 sm:p-6 md:p-10">
      <div className="max-w-6xl mx-auto flex flex-col gap-6 sm:gap-8 pt-24 sm:pt-16 pb-12">
        {/* Header Navigation & Sub-module context */}
        <div className="border-b border-gray-800/80 pb-6">
          <button
            onClick={onBackToChapters}
            className="mb-3.5 flex items-center gap-2 rounded-xl border border-gray-800 bg-[#12141A] px-3.5 py-2 text-xs font-medium text-gray-300 transition-all hover:border-gray-700 hover:text-white cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 text-[#BCFF3C]" /> Back to Chapters
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#00E5FF]">
              Tier 3 • Sub-module Focus
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-[10px] font-mono text-[#BCFF3C] uppercase">
              Chapter {chapter.order || 1}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            {chapter.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            {chapter.description ||
              "Click any unlocked lesson card to launch its pop-up study studio, interactive notes, and diagnostic quiz."}
          </p>
        </div>

        {/* NEXT UPCOMING LESSON HERO CARD */}
        {upcomingLesson && (
          <section className="glass-card p-6 sm:p-7 rounded-2xl border-[#BCFF3C]/50 shadow-[0_0_25px_rgba(188,255,60,0.06)] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#BCFF3C]/10 text-[#BCFF3C] text-[10px] font-mono font-bold uppercase tracking-wider">
                  Next Upcoming Lesson
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Lesson #{String(upcomingLesson.order || 1).padStart(2, "0")}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {upcomingLesson.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                {upcomingLesson.description ||
                  "Interactive lesson nodes with KaTeX equations, active recall decks, and AI evaluation."}
              </p>
              <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#00E5FF]" />{" "}
                  {upcomingLesson.estimatedMinutes || 15} min study
                </span>
                <span className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-[#BCFF3C]" /> Recall &amp;
                  Quiz
                </span>
              </div>
            </div>

            <button
              onClick={() => onSelectLesson(upcomingLesson)}
              className="px-6 py-3.5 bg-neon-lime hover:bg-[#aef525] text-midnight font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-lg shadow-neon-lime/10"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Open Lesson Window</span>
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
          <div className="glass-card p-10 rounded-2xl flex flex-col items-center justify-center gap-4 text-center text-xs text-gray-500 max-w-md mx-auto">
            <span>No lesson nodes found for this chapter yet.</span>
            <button
              onClick={onGenerateLessons}
              className="flex items-center gap-2 rounded-xl border border-[#00E5FF]/40 bg-[#00E5FF]/10 px-5 py-2.5 text-xs font-semibold text-[#00E5FF] transition-colors hover:bg-[#00E5FF]/20 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" /> Generate Lessons
            </button>
          </div>
        ) : (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
                <Grid className="w-4 h-4 text-[#BCFF3C]" />
                Lesson Cards in Chapter
              </h3>
              <span className="text-xs font-mono text-slate-500">
                {masteredCount} of {lessons.length} Mastered
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lessons.map((lesson) => {
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
                    className={`glass-card p-5 rounded-2xl flex flex-col justify-between transition-all duration-200 relative ${
                      isMastered
                        ? "border-[#BCFF3C]/30 hover:border-[#BCFF3C]/70 cursor-pointer"
                        : accessible
                          ? "border-[#00E5FF]/60 bg-[#00E5FF]/5 shadow-[0_0_20px_rgba(0,229,255,0.06)] cursor-pointer"
                          : "opacity-50 cursor-not-allowed border-gray-800"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-7 h-7 rounded-lg font-mono text-xs font-bold flex items-center justify-center ${
                              isMastered
                                ? "bg-[#BCFF3C]/10 text-[#BCFF3C]"
                                : accessible
                                  ? "bg-[#00E5FF]/20 text-[#00E5FF]"
                                  : "bg-gray-800 text-gray-500"
                            }`}
                          >
                            {String(lesson.order || 1).padStart(2, "0")}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                              isMastered
                                ? "bg-[#BCFF3C]/10 text-[#BCFF3C]"
                                : accessible
                                  ? "bg-[#00E5FF]/10 text-[#00E5FF]"
                                  : "bg-gray-800 text-gray-500"
                            }`}
                          >
                            {isMastered
                              ? "Mastered"
                              : accessible
                                ? "In Progress"
                                : "Locked"}
                          </span>
                        </div>

                        {isMastered ? (
                          <div className="flex items-center gap-1.5 text-xs font-mono text-[#BCFF3C] font-bold">
                            <span>{score}%</span>
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        ) : accessible ? (
                          <span className="flex h-2 w-2 rounded-full bg-[#00E5FF] animate-ping"></span>
                        ) : (
                          <Lock className="w-4 h-4 text-gray-500" />
                        )}
                      </div>

                      <h4
                        className={`text-base font-bold mb-1.5 transition-colors ${
                          accessible
                            ? "text-white group-hover:text-neon-lime"
                            : "text-gray-500"
                        }`}
                      >
                        {lesson.title}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {lesson.description ||
                          "No lesson description provided."}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#1E2846] flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />{" "}
                        {lesson.estimatedMinutes || 15} min
                      </span>
                      <span
                        className={
                          isMastered
                            ? "text-[#BCFF3C]"
                            : accessible
                              ? "text-[#00E5FF] font-bold"
                              : "text-gray-500"
                        }
                      >
                        {isMastered
                          ? "Review Notes →"
                          : accessible
                            ? "Open Pop-up →"
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
