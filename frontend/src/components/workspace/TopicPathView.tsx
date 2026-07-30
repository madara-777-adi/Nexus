import { useCallback, useEffect, useState } from "react";
import { getWorkspaceProgress } from "../../api/learning.api";
import api from "../../api/axios";
import {
  ConceptStatus,
  type ILearningProgress,
} from "../../types/learning.types";
import {
  Lock,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  RefreshCw,
} from "lucide-react";

interface TopicPathViewProps {
  workspaceId: string;
  onSelectConcept: (
    conceptId: string,
    title: string,
    status: ConceptStatus,
  ) => void;
}

type LoadState = "loading" | "ready" | "empty" | "error";

interface ConceptData {
  conceptId: string;
  title: string;
  description?: string;
  level?: number;
}

export function TopicPathView({
  workspaceId,
  onSelectConcept,
}: TopicPathViewProps) {
  const [concepts, setConcepts] = useState<ConceptData[]>([]);
  const [progressMap, setProgressMap] = useState<
    Map<string, ILearningProgress>
  >(new Map());
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [retryToken, setRetryToken] = useState(0);

  const loadData = useCallback(
    async (signal: AbortSignal) => {
      setLoadState("loading");
      setErrorMessage("");

      try {
        const progressData: ILearningProgress[] =
          await getWorkspaceProgress(workspaceId);

        const pMap = new Map<string, ILearningProgress>();
        progressData.forEach((item) => {
          if (item.concept?.conceptId) {
            pMap.set(item.concept.conceptId, item);
          }
        });
        setProgressMap(pMap);

        // Audit 4.1 Fix: Use shared Axios instance to handle Bearer headers & 401 retries automatically
        const response = await api.get(
          `/workspaces/${workspaceId}/relationships/stream`,
          { signal },
        );

        if (signal.aborted) return;

        const rawConcepts: ConceptData[] = response.data?.data?.concepts || [];

        setConcepts(rawConcepts);
        setLoadState(rawConcepts.length > 0 ? "ready" : "empty");
      } catch (err: any) {
        if (signal.aborted) return;
        console.error("Error loading curriculum:", err);
        setErrorMessage(
          err.response?.data?.message ||
            err.message ||
            "Something went wrong loading the topics.",
        );
        setLoadState("error");
      }
    },
    [workspaceId],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData, retryToken]);

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
          onClick={() => setRetryToken((n) => n + 1)}
          className="flex items-center gap-2 rounded-xl border border-gray-800 bg-[#12141A] px-4 py-2 text-xs font-medium text-gray-200 transition-colors hover:border-[#00E5FF]/60 hover:text-white cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      </div>
    );
  }

  if (loadState === "empty") {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#080A0F] p-8 text-center text-gray-500 text-xs">
        No topics found in this workspace blueprint.
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
                    onSelectConcept(concept.conceptId, concept.title, status);
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
