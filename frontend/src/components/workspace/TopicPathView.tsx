import { useMemo } from "react";
import {
  Sparkles,
  Lock,
  CheckCircle2,
  BookOpen,
  Layers,
} from "lucide-react";
import type { IConcept } from "../../types/workspace.types";
import type {
  ILearningProgress,
  ILessonProgress,
} from "../../types/learning.types";
import { ConceptStatus } from "../../types/learning.types";

export type LoadState = "loading" | "ready" | "empty" | "error";

interface TopicPathViewProps {
  concepts: IConcept[];
  progressMap: Map<string, ILearningProgress>;
  lessonProgressMap: Map<string, ILessonProgress>;
  loadState: LoadState;
  errorMessage?: string;
  isRegenerating?: boolean;
  onSelectUnit: (concept: IConcept) => void;
  onRegenerateCurriculum?: () => void;
  onRetry?: () => void;
}

export function TopicPathView({
  concepts,
  progressMap,
  loadState,
  errorMessage,
  isRegenerating,
  onSelectUnit,
  onRegenerateCurriculum,
  onRetry,
}: TopicPathViewProps) {
  // Sort modules strictly by order
  const sortedConcepts = useMemo(() => {
    return [...concepts].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [concepts]);

  // Overall workspace stats
  const overallStats = useMemo(() => {
    if (concepts.length === 0)
      return { masteryPercentage: 0, completedCount: 0 };
    let totalMastery = 0;
    let completedCount = 0;

    concepts.forEach((c) => {
      const prog = progressMap.get(c.conceptId);
      if (prog?.status === ConceptStatus.MASTERED) {
        completedCount++;
      }
      totalMastery += prog?.masteryScore || 0;
    });

    const masteryPercentage = Math.round(totalMastery / concepts.length);
    return { masteryPercentage, completedCount };
  }, [concepts, progressMap]);

  return (
    <div className="h-full w-full overflow-y-auto bg-[#080A0F] p-4 sm:p-6 lg:p-10">
      <div className="max-w-6xl mx-auto flex flex-col gap-8 pt-4 sm:pt-6 pb-12">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#1E2846]/80">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#00E5FF]">
                Tier 2 Architecture • 1st Pillar
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-[#BCFF3C]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#BCFF3C] animate-pulse"></span>
                Module Progression
              </span>
            </div>
            <h1 className="font-neovision text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              MODULES &amp; PROGRESSION
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
              Units originating from your skill blueprint. Click an unlocked
              module to explore its sub-modules and chapters.
            </p>
          </div>

          {/* Quick Mastery Counters */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="bg-[#0d1117]/90 backdrop-blur-xl border border-[#1E2846] px-4 py-2.5 rounded-2xl flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#00E5FF]/10 text-[#00E5FF]">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-slate-500 uppercase">
                  Mastery
                </p>
                <p className="text-sm font-extrabold text-[#00E5FF] font-mono">
                  {overallStats.masteryPercentage}%
                </p>
              </div>
            </div>

            <div className="bg-[#0d1117]/90 backdrop-blur-xl border border-[#1E2846] px-4 py-2.5 rounded-2xl flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#BCFF3C]/10 text-[#BCFF3C]">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-slate-500 uppercase">
                  Completed
                </p>
                <p className="text-sm font-extrabold text-white font-mono">
                  {overallStats.completedCount}/{concepts.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic States */}
        {loadState === "loading" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-[#0d1117]/80 backdrop-blur-xl border border-[#1E2846] rounded-3xl p-7 animate-pulse flex flex-col justify-between h-56"
              >
                <div className="space-y-3">
                  <div className="h-5 bg-[#1E2846]/60 rounded-lg w-1/2"></div>
                  <div className="h-4 bg-[#1E2846]/30 rounded-lg w-4/5"></div>
                </div>
                <div className="h-3 bg-[#1E2846]/40 rounded-lg w-1/3 mt-6"></div>
              </div>
            ))}
          </div>
        ) : loadState === "error" ? (
          <div className="bg-[#0d1117] border border-red-500/30 rounded-3xl p-8 text-center flex flex-col items-center gap-4 max-w-md mx-auto">
            <p className="text-xs font-semibold text-red-400">
              {errorMessage || "Failed to load modules."}
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-bold uppercase cursor-pointer"
              >
                Retry
              </button>
            )}
          </div>
        ) : loadState === "empty" ? (
          <div className="bg-[#0d1117] border border-dashed border-[#1E2846] rounded-3xl p-10 text-center flex flex-col items-center gap-4 max-w-md mx-auto">
            <p className="text-xs text-slate-400">No modules generated yet.</p>
            {onRegenerateCurriculum && (
              <button
                onClick={onRegenerateCurriculum}
                disabled={isRegenerating}
                className="flex items-center gap-2 bg-[#BCFF3C] text-[#080A0F] font-bold text-xs uppercase px-5 py-2.5 rounded-xl cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isRegenerating ? "Generating..." : "Generate Modules"}
                </span>
              </button>
            )}
          </div>
        ) : (
          /* MODULES GRID (Electric Cyan Glow + Smooth Lift) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedConcepts.map((concept, idx) => {
              const prog = progressMap.get(concept.conceptId);
              const status = prog?.status || ConceptStatus.LOCKED;
              const isUnlocked =
                status === ConceptStatus.UNLOCKED ||
                status === ConceptStatus.IN_PROGRESS ||
                status === ConceptStatus.MASTERED ||
                idx === 0; // First module always accessible
              const isMastered = status === ConceptStatus.MASTERED;
              const masteryScore = prog?.masteryScore || 0;

              return (
                <div
                  key={concept.conceptId}
                  onClick={isUnlocked ? () => onSelectUnit(concept) : undefined}
                  className={`group bg-[#0d1117]/90 backdrop-blur-xl border rounded-3xl p-7 transition-all duration-300 flex flex-col justify-between min-h-[230px] relative ${
                    isMastered
                      ? "border-[#BCFF3C]/40 hover:border-[#BCFF3C] hover:shadow-[0_0_25px_rgba(188,255,60,0.16)] hover:-translate-y-1 cursor-pointer"
                      : isUnlocked
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
                              : isUnlocked
                                ? "bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/30"
                                : "bg-gray-800 text-gray-500 border-gray-800"
                          }`}
                        >
                          {String(concept.order || idx + 1).padStart(2, "0")}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-semibold border ${
                            isMastered
                              ? "bg-[#BCFF3C]/10 border-[#BCFF3C]/30 text-[#BCFF3C]"
                              : isUnlocked
                                ? "bg-[#00E5FF]/10 border-[#00E5FF]/30 text-[#00E5FF]"
                                : "bg-gray-800 border-gray-800 text-gray-500"
                          }`}
                        >
                          {isMastered
                            ? "Mastered"
                            : isUnlocked
                              ? "Unlocked"
                              : "Locked"}
                        </span>
                      </div>

                      {/* Status Icon / Active Blinking Indicator */}
                      {isMastered ? (
                        <CheckCircle2 className="w-4 h-4 text-[#BCFF3C]" />
                      ) : isUnlocked ? (
                        <span className="flex h-2.5 w-2.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E5FF] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00E5FF]"></span>
                        </span>
                      ) : (
                        <Lock className="w-4 h-4 text-gray-600" />
                      )}
                    </div>

                    <h3
                      className={`text-base sm:text-lg font-bold transition-colors line-clamp-1 ${
                        isMastered
                          ? "text-white group-hover:text-[#BCFF3C]"
                          : isUnlocked
                            ? "text-white group-hover:text-[#00E5FF]"
                            : "text-gray-500"
                      }`}
                    >
                      {concept.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 leading-relaxed">
                      {concept.description ||
                        "Synthesized knowledge module track."}
                    </p>
                  </div>

                  {/* Footer Progress & Trigger */}
                  <div className="mt-6 pt-4 border-t border-[#1E2846]/80 space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-[#00E5FF]" />
                        <span>{concept.topics?.length || 0} Chapters</span>
                      </span>
                      <span
                        className={`font-bold ${
                          isMastered
                            ? "text-[#BCFF3C]"
                            : isUnlocked
                              ? "text-[#00E5FF]"
                              : "text-gray-600"
                        }`}
                      >
                        {masteryScore}%
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-[#080A0F] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isMastered
                            ? "bg-[#BCFF3C]"
                            : isUnlocked
                              ? "bg-[#00E5FF]"
                              : "bg-gray-700"
                        }`}
                        style={{ width: `${masteryScore}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
