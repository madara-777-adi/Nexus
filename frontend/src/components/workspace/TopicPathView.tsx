import { useMemo } from "react";
import {
  ConceptStatus,
  type ILearningProgress,
  type ILessonProgress,
} from "../../types/learning.types";
import type { IConcept } from "../../types/workspace.types";
import {
  Lock,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  BookOpen,
  ArrowRight,
} from "lucide-react";

export type LoadState = "loading" | "ready" | "empty" | "error";

interface TopicPathViewProps {
  concepts: IConcept[];
  progressMap: Map<string, ILearningProgress>;
  lessonProgressMap?: Map<string, ILessonProgress>;
  loadState: LoadState;
  errorMessage: string;
  isRegenerating?: boolean;
  onSelectUnit: (unit: IConcept) => void;
  onRegenerateCurriculum?: () => void;
  onRetry: () => void;
}

export function TopicPathView({
  concepts,
  progressMap,
  lessonProgressMap = new Map(),
  loadState,
  errorMessage,
  isRegenerating,
  onSelectUnit,
  onRegenerateCurriculum,
  onRetry,
}: TopicPathViewProps) {
  // Compute overall skill mastery and completed module count
  const { overallMastery, completedCount, activeUnit, activeChapter } =
    useMemo(() => {
      if (concepts.length === 0) {
        return {
          overallMastery: 0,
          completedCount: 0,
          activeUnit: null,
          activeChapter: null,
        };
      }

      let totalScore = 0;
      let completed = 0;
      let inProgressUnit: IConcept | null = null;

      concepts.forEach((concept) => {
        const prog = progressMap.get(concept.conceptId);
        const score = prog?.masteryScore || 0;
        totalScore += score;
        if (prog?.status === ConceptStatus.MASTERED) {
          completed += 1;
        } else if (
          !inProgressUnit &&
          (prog?.status === ConceptStatus.IN_PROGRESS ||
            prog?.status === ConceptStatus.UNLOCKED)
        ) {
          inProgressUnit = concept;
        }
      });

      // Default active unit to first unlocked if none marked IN_PROGRESS
      const currentUnit = inProgressUnit || concepts[0] || null;
      const currentChapter = currentUnit?.topics?.[0] || null;
      const avgMastery = Math.round(totalScore / concepts.length);

      return {
        overallMastery: isNaN(avgMastery) ? 0 : avgMastery,
        completedCount: completed,
        activeUnit: currentUnit,
        activeChapter: currentChapter,
      };
    }, [concepts, progressMap]);

  // Compute lesson count & mastered count for the active chapter
  const activeChapterStats = useMemo(() => {
    if (!activeUnit || !activeChapter) {
      return { totalLessons: 0, masteredLessons: 0 };
    }
    const lessons = activeChapter.lessons || [];
    let mastered = 0;
    lessons.forEach((l) => {
      const key = `${activeUnit.conceptId}:${activeChapter.id}:${l.id}`;
      const prog = lessonProgressMap.get(key);
      if (prog?.status === ConceptStatus.MASTERED) {
        mastered += 1;
      }
    });
    return {
      totalLessons: lessons.length,
      masteredLessons: mastered,
    };
  }, [activeUnit, activeChapter, lessonProgressMap]);

  // 1. Loading State
  if (loadState === "loading") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#080A0F] text-gray-500 font-mono text-xs p-6">
        <Sparkles className="h-6 w-6 animate-spin text-[#00E5FF]" />
        <span>Loading Tier 2 Module Graph...</span>
      </div>
    );
  }

  // 2. Error State
  if (loadState === "error") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[#080A0F] px-6 text-center">
        <p className="text-sm font-medium text-red-400">
          Couldn't load module graph
        </p>
        <p className="max-w-sm text-xs text-gray-500">{errorMessage}</p>
        <button
          onClick={onRetry}
          className="flex items-center gap-2 rounded-xl border border-gray-800 bg-[#12141A] px-4 py-2 text-xs font-medium text-gray-200 transition-colors hover:border-[#00E5FF]/60 hover:text-white cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      </div>
    );
  }

  // 3. Empty State
  if (loadState === "empty") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[#080A0F] p-8 text-center text-gray-500 text-xs">
        <span>No modules found in this skill blueprint.</span>
        {onRegenerateCurriculum && (
          <button
            onClick={onRegenerateCurriculum}
            disabled={isRegenerating}
            className="flex items-center gap-2 rounded-xl border border-[#00E5FF]/40 bg-[#00E5FF]/10 px-4 py-2 text-xs font-semibold text-[#00E5FF] transition-colors hover:bg-[#00E5FF]/20 disabled:opacity-50 cursor-pointer"
          >
            <Sparkles
              className={`h-3.5 w-3.5 ${isRegenerating ? "animate-spin" : ""}`}
            />
            {isRegenerating ? "Generating Modules..." : "Generate Curriculum"}
          </button>
        )}
      </div>
    );
  }

  // 4. Ready State — Tier 2 Modules Grid
  return (
    <div className="h-full w-full overflow-y-auto bg-[#080A0F] p-4 sm:p-6 md:p-10">
      <div className="max-w-6xl mx-auto flex flex-col gap-6 sm:gap-8 pt-24 sm:pt-16 pb-12">
        {/* Module Header & Metric Badges */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800/80 pb-6">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#00E5FF]">
              Tier 2 Architecture • 1st Pillar
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              MODULES &amp; PROGRESSION
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Units originating from your selected skill blueprint. Click an
              unlocked module to explore its sub-modules.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="glass-card px-4 py-2 rounded-xl text-center">
              <p className="text-[10px] uppercase font-mono text-slate-500">
                Skill Mastery
              </p>
              <p className="text-base font-extrabold text-[#BCFF3C]">
                {overallMastery}%
              </p>
            </div>
            <div className="glass-card px-4 py-2 rounded-xl text-center">
              <p className="text-[10px] uppercase font-mono text-slate-500">
                Completed
              </p>
              <p className="text-base font-extrabold text-purple-400">
                {completedCount} / {concepts.length}
              </p>
            </div>
          </div>
        </div>

        {/* Tier 2 Modules Cards Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#BCFF3C]" />
              Module Units
            </h2>
            <span className="text-xs font-mono text-gray-500">
              {concepts.length} {concepts.length === 1 ? "Module" : "Modules"}{" "}
              Available
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {concepts.map((concept, idx) => {
              const prog = progressMap.get(concept.conceptId);
              const status = prog?.status || ConceptStatus.LOCKED;
              const score = prog?.masteryScore || 0;
              const isLocked = status === ConceptStatus.LOCKED;
              const isMastered = status === ConceptStatus.MASTERED;
              const isInProgress =
                status === ConceptStatus.IN_PROGRESS ||
                status === ConceptStatus.UNLOCKED;

              return (
                <div
                  key={concept.conceptId}
                  onClick={() => {
                    if (!isLocked) onSelectUnit(concept);
                  }}
                  className={`glass-card p-5 sm:p-6 rounded-2xl flex flex-col justify-between transition-all duration-300 relative ${
                    isMastered
                      ? "border-[#BCFF3C]/40 hover:border-[#BCFF3C]/80 cursor-pointer shadow-[0_0_20px_rgba(188,255,60,0.04)]"
                      : isInProgress
                        ? "border-[#00E5FF]/60 bg-[#00E5FF]/5 shadow-[0_0_25px_rgba(0,229,255,0.08)] cursor-pointer"
                        : "opacity-50 cursor-not-allowed border-gray-800"
                  }`}
                >
                  <div>
                    {/* Top Status Badges */}
                    <div className="flex items-start justify-between gap-3 mb-3.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-7 h-7 rounded-lg font-mono text-xs font-bold flex items-center justify-center ${
                            isMastered
                              ? "bg-[#BCFF3C]/10 text-[#BCFF3C]"
                              : isInProgress
                                ? "bg-[#00E5FF]/20 text-[#00E5FF]"
                                : "bg-gray-800 text-gray-500"
                          }`}
                        >
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${
                            isMastered
                              ? "bg-[#BCFF3C]/10 border-[#BCFF3C]/30 text-[#BCFF3C]"
                              : isInProgress
                                ? "bg-[#00E5FF]/10 border-[#00E5FF]/30 text-[#00E5FF]"
                                : "bg-gray-800 border-gray-800 text-gray-500"
                          }`}
                        >
                          {status}
                        </span>
                      </div>

                      {isMastered ? (
                        <CheckCircle2 className="w-4 h-4 text-[#BCFF3C]" />
                      ) : isInProgress ? (
                        <span className="flex h-2 w-2 rounded-full bg-[#00E5FF] animate-ping"></span>
                      ) : (
                        <Lock className="w-4 h-4 text-gray-600" />
                      )}
                    </div>

                    <h3
                      className={`text-base font-bold mb-1.5 transition-colors ${
                        isLocked
                          ? "text-gray-500"
                          : "text-white group-hover:text-neon-lime"
                      }`}
                    >
                      {concept.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                      {concept.description || "No module description provided."}
                    </p>
                  </div>

                  {/* Progress Bar & Mastery Score */}
                  <div className="space-y-2 pt-4 border-t border-[#1E2846]">
                    <div className="flex justify-between text-xs font-mono text-slate-400">
                      <span>Unit Progress</span>
                      <span
                        className={
                          isMastered
                            ? "text-[#BCFF3C] font-bold"
                            : isInProgress
                              ? "text-[#00E5FF] font-bold"
                              : "text-gray-600"
                        }
                      >
                        {score}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#080A0F] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isMastered
                            ? "bg-[#BCFF3C]"
                            : isInProgress
                              ? "bg-[#00E5FF]"
                              : "bg-gray-700"
                        }`}
                        style={{
                          width: `${Math.max(score, isMastered ? 100 : 0)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Active Ongoing Sub-Module Focus Container */}
        {activeUnit && (
          <section className="glass-card p-6 sm:p-7 rounded-2xl border-[#00E5FF]/40 space-y-4 shadow-[0_0_30px_rgba(0,229,255,0.06)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E2846] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#00E5FF]/10 text-[#00E5FF] shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#00E5FF] tracking-wider">
                    Active Ongoing Module
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                    {activeUnit.title}
                  </h3>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#BCFF3C]/10 text-[#BCFF3C] text-xs font-mono font-bold w-fit">
                {activeUnit.topics?.length || 0} Sub-modules (Chapters)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-1">
              <div className="p-4 bg-[#080A0F] border border-[#1E2846] rounded-xl">
                <p className="text-[11px] font-mono text-slate-500 uppercase">
                  Current Chapter Focus
                </p>
                <p className="text-xs sm:text-sm font-semibold text-slate-200 mt-1 truncate">
                  {activeChapter?.title || "Overview & Fundamentals"}
                </p>
              </div>
              <div className="p-4 bg-[#080A0F] border border-[#1E2846] rounded-xl">
                <p className="text-[11px] font-mono text-slate-500 uppercase">
                  Lesson Node Progress
                </p>
                <p className="text-xs sm:text-sm font-semibold text-[#BCFF3C] mt-1 font-mono">
                  {activeChapterStats.masteredLessons} /{" "}
                  {activeChapterStats.totalLessons} Mastered
                </p>
              </div>
              <div className="p-4 bg-[#080A0F] border border-[#1E2846] rounded-xl">
                <p className="text-[11px] font-mono text-slate-500 uppercase">
                  Est. Completion
                </p>
                <p className="text-xs sm:text-sm font-semibold text-[#00E5FF] mt-1">
                  {activeChapter?.estimatedMinutes || 30} mins
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onSelectUnit(activeUnit)}
                className="w-full py-3.5 bg-neon-lime hover:bg-[#aef525] text-midnight font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(188,255,60,0.2)]"
              >
                <span>Open Sub-modules &amp; View Lesson Cards</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
