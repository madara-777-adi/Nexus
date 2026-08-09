import {
  ConceptStatus,
  type ILearningProgress,
} from "../../types/learning.types";
import type { IConcept } from "../../types/workspace.types";
import {
  Lock,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  RefreshCw,
} from "lucide-react";

export type LoadState = "loading" | "ready" | "empty" | "error";

interface TopicPathViewProps {
  concepts: IConcept[];
  progressMap: Map<string, ILearningProgress>;
  loadState: LoadState;
  errorMessage: string;
  isRegenerating?: boolean;
  onSelectUnit: (unit: IConcept) => void;
  onRegenerateCurriculum?: () => void;
  onRetry: () => void;
}

/**
 * Presentational Unit curriculum view. WorkspacePage owns all data fetching
 * and JIT Tier-2 orchestration; this component only renders state via props.
 */
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

  if (loadState === "loading") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#080A0F] text-gray-500 font-mono text-xs">
        <Sparkles className="h-5 w-5 animate-spin text-[#00E5FF]" />
        <span>Loading curriculum graph...</span>
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[#080A0F] px-6 text-center">
        <p className="text-sm font-medium text-red-400">
          Couldn't load curriculum path
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

  if (loadState === "empty") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[#080A0F] p-8 text-center text-gray-500 text-xs">
        <span>No topics found in this workspace blueprint.</span>
        {onRegenerateCurriculum && (
          <button
            onClick={onRegenerateCurriculum}
            disabled={isRegenerating}
            className="flex items-center gap-2 rounded-xl border border-[#00E5FF]/40 bg-[#00E5FF]/10 px-4 py-2 text-xs font-semibold text-[#00E5FF] transition-colors hover:bg-[#00E5FF]/20 disabled:opacity-50 cursor-pointer"
          >
            <Sparkles
              className={`h-3.5 w-3.5 ${isRegenerating ? "animate-spin" : ""}`}
            />
            {isRegenerating ? "Generating..." : "Generate Curriculum"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-[#080A0F] p-6 md:p-10">
      <div className="max-w-3xl mx-auto flex flex-col gap-6 pt-16">
        <div className="border-b border-gray-800/80 pb-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#00E5FF]">
            1st Pillars
          </span>
          <h2 className="text-lg font-medium text-white tracking-tight mt-0.5">
            Curriculum Path
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {concepts.map((concept, idx) => {
            const prog = progressMap.get(concept.conceptId);
            const status = prog?.status || ConceptStatus.LOCKED;
            const score = prog?.masteryScore || 0;

            const isLocked = status === ConceptStatus.LOCKED;
            const isMastered = status === ConceptStatus.MASTERED;

            let cardStyle =
              "border-gray-800/80 bg-[#12141A]/50 opacity-60 cursor-not-allowed";
            let badgeStyle = "bg-gray-800 text-gray-500";
            let statusTagStyle = "bg-gray-800/60 text-gray-500 border-gray-800";

            if (isMastered) {
              cardStyle =
                "border-[#BCFF3C]/40 bg-[#12141A] hover:border-[#BCFF3C]/80 cursor-pointer text-gray-200";
              badgeStyle = "bg-[#BCFF3C]/10 text-[#BCFF3C]";
              statusTagStyle =
                "bg-[#BCFF3C]/10 text-[#BCFF3C] border-[#BCFF3C]/30";
            } else if (!isLocked) {
              cardStyle =
                "border-gray-800 bg-[#12141A] hover:border-[#00E5FF]/60 cursor-pointer text-gray-200";
              badgeStyle = "bg-[#00E5FF]/10 text-[#00E5FF]";
              statusTagStyle =
                "bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/30";
            }

            return (
              <div
                key={concept.conceptId}
                onClick={() => {
                  if (!isLocked) {
                    onSelectUnit(concept);
                  }
                }}
                className={`group relative flex items-center justify-between rounded-xl border p-5 transition-all duration-200 ${cardStyle}`}
              >
                <div className="flex items-center gap-4">
                  {/* Step Number Badge */}
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-semibold ${badgeStyle}`}
                  >
                    {idx + 1}
                  </div>

                  {/* Topic Details */}
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2.5">
                      <h3
                        className={`text-sm font-medium transition-colors ${
                          isLocked
                            ? "text-gray-500"
                            : "text-white group-hover:text-[#00E5FF]"
                        }`}
                      >
                        {concept.title}
                      </h3>

                      {/* Status Tag */}
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${statusTagStyle}`}
                      >
                        {status}
                      </span>
                    </div>

                    {concept.description && (
                      <p className="text-xs text-gray-400 line-clamp-1 font-normal">
                        {concept.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Indicator / Mastery Score */}
                <div className="flex items-center gap-3 pl-4">
                  {!isLocked && (
                    <div className="text-right">
                      <span className="block text-[10px] font-mono text-gray-500 uppercase">
                        Mastery
                      </span>
                      <span
                        className={`text-xs font-mono font-semibold ${
                          score >= 80 ? "text-[#BCFF3C]" : "text-gray-300"
                        }`}
                      >
                        {score}%
                      </span>
                    </div>
                  )}

                  <div className="text-gray-500 group-hover:text-white transition-colors">
                    {isMastered ? (
                      <CheckCircle2 className="h-4 w-4 text-[#BCFF3C]" />
                    ) : isLocked ? (
                      <Lock className="h-4 w-4 text-gray-600" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-[#00E5FF] transition-transform duration-200 group-hover:translate-x-0.5" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
