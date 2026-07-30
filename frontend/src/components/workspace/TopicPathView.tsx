import { useCallback, useEffect, useState } from "react";
import { getWorkspaceProgress } from "../../api/learning.api";
import api, { getAccessToken, setAccessToken } from "../../api/axios";
import {
  ConceptStatus,
  type ILearningProgress,
} from "../../types/learning.types";

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

  const fetchGraphPayload = useCallback(
    async (signal: AbortSignal, isRetry = false): Promise<Response> => {
      const token = getAccessToken();
      const response = await fetch(
        `${api.defaults.baseURL}/workspaces/${workspaceId}/relationships/stream`,
        {
          credentials: "include",
          signal,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      if (response.status === 401 && !isRetry) {
        try {
          const refreshRes = await api.post("/auth/refresh-token");
          const newToken = refreshRes.data?.data?.accessToken;
          if (newToken) {
            setAccessToken(newToken);
            return fetchGraphPayload(signal, true);
          }
        } catch {
          // Token refresh failed
        }
      }

      return response;
    },
    [workspaceId],
  );

  const loadData = useCallback(
    async (signal: AbortSignal) => {
      setLoadState("loading");
      setErrorMessage("");

      try {
        // 1. Fetch user learning progress
        const progressData: ILearningProgress[] =
          await getWorkspaceProgress(workspaceId);

        const pMap = new Map<string, ILearningProgress>();
        progressData.forEach((item) => {
          if (item.concept?.conceptId) {
            pMap.set(item.concept.conceptId, item);
          }
        });
        setProgressMap(pMap);

        // 2. Fetch workspace concepts
        const response = await fetchGraphPayload(signal);
        if (signal.aborted) return;

        if (!response.ok) {
          throw new Error(
            `Failed to load workspace curriculum (HTTP ${response.status}).`,
          );
        }

        const json = await response.json();
        const rawConcepts: ConceptData[] = json.data?.concepts || [];

        setConcepts(rawConcepts);
        setLoadState(rawConcepts.length > 0 ? "ready" : "empty");
      } catch (err) {
        if (signal.aborted) return;
        console.error("Error loading curriculum:", err);
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Something went wrong loading the topics.",
        );
        setLoadState("error");
      }
    },
    [workspaceId, fetchGraphPayload],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData, retryToken]);

  if (loadState === "loading") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#080A0F] text-slate-400">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-[#BCFF3C]" />
        <p className="text-xs font-mono text-slate-500">
          Loading learning modules…
        </p>
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[#080A0F] px-6 text-center">
        <p className="text-sm font-semibold text-red-400">
          Couldn't load curriculum path
        </p>
        <p className="max-w-sm text-xs text-slate-500">{errorMessage}</p>
        <button
          onClick={() => setRetryToken((n) => n + 1)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-[#BCFF3C]/50 hover:text-[#BCFF3C]"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loadState === "empty") {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#080A0F] p-8 text-center text-slate-600 text-xs">
        No topics found in this workspace blueprint.
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-[#080A0F] p-6 md:p-10">
      <div className="max-w-3xl mx-auto flex flex-col gap-6 pt-16">
        <div className="border-b border-slate-800 pb-4">
          <h2 className="text-lg font-bold text-white tracking-tight">
            Curriculum Modules
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete active topics to unlock downstream concepts.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {concepts.map((concept, idx) => {
            const prog = progressMap.get(concept.conceptId);
            const status = prog?.status || ConceptStatus.LOCKED;
            const score = prog?.masteryScore || 0;

            const isLocked = status === ConceptStatus.LOCKED;
            const isMastered = status === ConceptStatus.MASTERED;
            const isInProgress = status === ConceptStatus.IN_PROGRESS;

            return (
              <div
                key={concept.conceptId}
                onClick={() => {
                  if (!isLocked) {
                    onSelectConcept(concept.conceptId, concept.title, status);
                  }
                }}
                className={`group relative flex items-center justify-between rounded-2xl border p-5 transition-all duration-200 ${
                  isLocked
                    ? "border-slate-800/80 bg-[#0B0E14]/50 opacity-60 cursor-not-allowed"
                    : "border-slate-800 bg-[#0F131C] hover:border-[#BCFF3C]/50 cursor-pointer hover:shadow-lg hover:shadow-[#BCFF3C]/5"
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Step Number Badge */}
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold ${
                      isMastered
                        ? "bg-[#BCFF3C]/10 text-[#BCFF3C] border border-[#BCFF3C]/30"
                        : isInProgress
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          : !isLocked
                            ? "bg-sky-500/10 text-sky-400 border border-sky-500/30"
                            : "bg-slate-900 text-slate-600 border border-slate-800"
                    }`}
                  >
                    {idx + 1}
                  </div>

                  {/* Topic Details */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <h3
                        className={`text-sm font-bold transition-colors ${
                          isLocked
                            ? "text-slate-500"
                            : "text-white group-hover:text-[#BCFF3C]"
                        }`}
                      >
                        {concept.title}
                      </h3>

                      {/* Status Tag */}
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${
                          isMastered
                            ? "bg-[#BCFF3C]/10 text-[#BCFF3C] border-[#BCFF3C]/30"
                            : isInProgress
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              : !isLocked
                                ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
                                : "bg-slate-900 text-slate-500 border-slate-800"
                        }`}
                      >
                        {status}
                      </span>
                    </div>

                    {concept.description && (
                      <p className="text-xs text-slate-400 line-clamp-1">
                        {concept.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Indicator / Score */}
                <div className="flex items-center gap-3 pl-4">
                  {!isLocked && (
                    <div className="text-right">
                      <span className="block text-[10px] font-mono text-slate-500 uppercase">
                        Mastery
                      </span>
                      <span
                        className={`text-xs font-mono font-bold ${
                          score >= 80 ? "text-[#BCFF3C]" : "text-slate-300"
                        }`}
                      >
                        {score}%
                      </span>
                    </div>
                  )}

                  <div className="text-slate-500 group-hover:text-white transition-colors">
                    {isLocked ? "🔒" : "→"}
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
