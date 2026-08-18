import {
  ArrowLeft,
  Clock,
  Layers,
  Lock,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import type { IConcept, IConceptTopic } from "../../types/workspace.types";
import type { ILessonProgress } from "../../types/learning.types";
import { ConceptStatus } from "../../types/learning.types";

interface ChapterListProps {
  unit: IConcept;
  chapters: IConceptTopic[];
  isGenerating: boolean;
  lessonProgressMap: Map<string, ILessonProgress>;
  onSelectChapter: (chapter: IConceptTopic) => void;
  onBackToUnits: () => void;
  onGenerateChapters: () => void;
}

export function ChapterList({
  unit,
  chapters,
  isGenerating,
  lessonProgressMap,
  onSelectChapter,
  onBackToUnits,
  onGenerateChapters,
}: ChapterListProps) {
  /**
   * Derive chapter accessibility from first lesson's progress.
   * First chapter of unit is always accessible if the unit is accessible.
   */
  const isChapterAccessible = (chapter: IConceptTopic): boolean => {
    const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);
    if (chapter.id === sortedChapters[0]?.id) return true;
    if (!chapter.lessons || chapter.lessons.length === 0) return false;

    const sortedLessons = [...chapter.lessons].sort(
      (a, b) => a.order - b.order,
    );
    const firstLesson = sortedLessons[0];
    if (!firstLesson) return false;

    const key = `${unit.conceptId}:${chapter.id}:${firstLesson.id}`;
    const progress = lessonProgressMap.get(key);
    if (!progress) return false;

    return (
      progress.status === ConceptStatus.UNLOCKED ||
      progress.status === ConceptStatus.IN_PROGRESS ||
      progress.status === ConceptStatus.MASTERED
    );
  };

  /**
   * Calculate chapter completion progress based on its lesson records
   */
  const getChapterStats = (chapter: IConceptTopic) => {
    const lessons = chapter.lessons || [];
    if (lessons.length === 0) return { total: 0, mastered: 0, percentage: 0 };

    let mastered = 0;
    lessons.forEach((l) => {
      const key = `${unit.conceptId}:${chapter.id}:${l.id}`;
      const prog = lessonProgressMap.get(key);
      if (prog?.status === ConceptStatus.MASTERED) {
        mastered += 1;
      }
    });

    const percentage = Math.round((mastered / lessons.length) * 100);
    return {
      total: lessons.length,
      mastered,
      percentage: isNaN(percentage) ? 0 : percentage,
    };
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-[#080A0F] p-4 sm:p-6 md:p-10">
      <div className="max-w-6xl mx-auto flex flex-col gap-6 sm:gap-8 pt-24 sm:pt-16 pb-12">
        {/* Header Navigation & Title */}
        <div className="border-b border-gray-800/80 pb-6">
          <button
            onClick={onBackToUnits}
            className="mb-3.5 flex items-center gap-2 rounded-xl border border-gray-800 bg-[#12141A] px-3.5 py-2 text-xs font-medium text-gray-300 transition-all hover:border-gray-700 hover:text-white cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 text-[#BCFF3C]" /> Back to Modules
          </button>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#00E5FF]">
            Tier 3 Architecture • 2nd Pillar
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            {unit.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            {unit.description ||
              "Select an unlocked chapter card to explore its lesson sequence and diagnostic tests."}
          </p>
        </div>

        {/* Loading State */}
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 font-mono text-xs text-gray-500">
            <Sparkles className="h-6 w-6 animate-spin text-[#00E5FF]" />
            <span>Generating sub-modules &amp; chapters with AI...</span>
          </div>
        ) : chapters.length === 0 ? (
          /* Empty State */
          <div className="glass-card p-10 rounded-2xl flex flex-col items-center justify-center gap-4 text-center text-xs text-gray-500 max-w-md mx-auto">
            <span>No chapters found for this module yet.</span>
            <button
              onClick={onGenerateChapters}
              className="flex items-center gap-2 rounded-xl border border-[#00E5FF]/40 bg-[#00E5FF]/10 px-5 py-2.5 text-xs font-semibold text-[#00E5FF] transition-colors hover:bg-[#00E5FF]/20 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" /> Generate Chapters
            </button>
          </div>
        ) : (
          /* Chapter Cards Grid */
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {chapters.map((chapter) => {
              const accessible = isChapterAccessible(chapter);
              const { total, percentage } = getChapterStats(chapter);
              const isMastered = percentage === 100 && total > 0;

              return (
                <div
                  key={chapter.id}
                  onClick={
                    accessible ? () => onSelectChapter(chapter) : undefined
                  }
                  className={`glass-card p-6 rounded-2xl flex flex-col justify-between transition-all duration-300 relative ${
                    isMastered
                      ? "border-[#BCFF3C]/40 hover:border-[#BCFF3C]/80 cursor-pointer shadow-[0_0_20px_rgba(188,255,60,0.04)]"
                      : accessible
                        ? "border-[#00E5FF]/60 bg-[#00E5FF]/5 shadow-[0_0_25px_rgba(0,229,255,0.08)] cursor-pointer"
                        : "opacity-50 cursor-not-allowed border-gray-800"
                  }`}
                >
                  <div>
                    {/* Top Order Badge & Status */}
                    <div className="flex items-start justify-between gap-3 mb-4">
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
                          {String(chapter.order || 1).padStart(2, "0")}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${
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
                              ? "Active Chapter"
                              : "Locked"}
                        </span>
                      </div>

                      {isMastered ? (
                        <CheckCircle2 className="w-4 h-4 text-[#BCFF3C]" />
                      ) : accessible ? (
                        <span className="flex h-2 w-2 rounded-full bg-[#00E5FF] animate-ping"></span>
                      ) : (
                        <Lock className="w-4 h-4 text-gray-600" />
                      )}
                    </div>

                    <h3
                      className={`text-base font-bold mb-2 transition-colors ${
                        accessible
                          ? "text-white group-hover:text-neon-lime"
                          : "text-gray-500"
                      }`}
                    >
                      {chapter.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
                      {chapter.description ||
                        "No chapter description provided."}
                    </p>
                  </div>

                  {/* Metadata and Progress Bar */}
                  <div className="space-y-4 pt-4 border-t border-[#1E2846]">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#00E5FF]" />{" "}
                        {total} {total === 1 ? "Lesson" : "Lessons"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />{" "}
                        {chapter.estimatedMinutes || 30} min
                      </span>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                        <span>Progress</span>
                        <span
                          className={
                            isMastered
                              ? "text-[#BCFF3C] font-bold"
                              : accessible
                                ? "text-[#00E5FF] font-bold"
                                : "text-gray-600"
                          }
                        >
                          {percentage}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#080A0F] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isMastered
                              ? "bg-[#BCFF3C]"
                              : accessible
                                ? "bg-[#00E5FF]"
                                : "bg-gray-700"
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}
