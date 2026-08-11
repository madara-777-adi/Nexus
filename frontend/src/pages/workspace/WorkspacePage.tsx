import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  TopicPathView,
  type LoadState,
} from "../../components/workspace/TopicPathView";
import { ChapterList } from "../../components/workspace/ChapterList";
import { LessonList } from "../../components/workspace/LessonList";
import { TeacherStudio } from "../../components/workspace/TeacherStudio";
import { ErrorBoundary } from "../../components/common/ErrorBoundary";
import {
  initializeWorkspaceProgress,
  getWorkspaceProgress,
} from "../../api/learning.api";
import { workspaceApi } from "../../api/workspace.api";
import { conceptApi } from "../../api/concept.api";
import {
  getTier1Modules,
  getTier2Subtopics,
  getTier3Lessons,
  planNextPath,
} from "../../api/ai.api";
import {
  ConceptStatus,
  type ILearningProgress,
} from "../../types/learning.types";
import type {
  IConcept,
  IConceptTopic,
  ILessonNode,
} from "../../types/workspace.types";
import { Sparkles, ArrowLeft, Compass } from "lucide-react";

interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
}

export function WorkspacePage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Selection state: exactly one navigation path Unit → Chapter → Lesson.
  const [selectedUnit, setSelectedUnit] = useState<IConcept | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<IConceptTopic | null>(
    null,
  );
  const [selectedLesson, setSelectedLesson] = useState<ILessonNode | null>(
    null,
  );

  // Curriculum data owned here so WorkspacePage can orchestrate JIT
  // Tier-2/Tier-3 generation against the real cached nodes.
  const [concepts, setConcepts] = useState<IConcept[]>([]);
  const [progressMap, setProgressMap] = useState<
    Map<string, ILearningProgress>
  >(new Map());
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [retryToken, setRetryToken] = useState(0);

  // Workspace identity, fetched from the backend (no hardcoded titles).
  const [workspaceTitle, setWorkspaceTitle] = useState<string>("");

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isPlanning, setIsPlanning] = useState<boolean>(false);
  const [isGeneratingTier2, setIsGeneratingTier2] = useState<boolean>(false);
  const [isGeneratingTier3, setIsGeneratingTier3] = useState<boolean>(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Generation identity refs — the concurrency guard for JIT generation:
  // (1) they prevent duplicate in-flight AI requests for the same node, and
  // (2) they identify which request a stale completion belongs to so it can
  // be compared against the current selection before applying its result.
  const activeTier2UnitIdRef = useRef<string | null>(null);
  const activeTier3ChapterIdRef = useRef<string | null>(null);

  // Set when POST /learning/init fails. Read by loadConcepts so a failed
  // initialization can never masquerade as a genuinely all-LOCKED curriculum.
  const initErrorRef = useRef<string | null>(null);

  // True while the bootstrap effect is mid-flight. Refs are synchronous, so
  // even when a Retry re-runs both effects in the same commit, the load effect
  // — which executes after this effect — can never fire GET /learning
  // concurrently with POST /learning/init.
  const bootstrapInFlightRef = useRef<boolean>(false);

  const showToast = useCallback(
    (
      message: string,
      type: "success" | "error" | "info" | "warning" = "info",
    ) => {
      const id = `toast_${Date.now()}`;
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    [],
  );

  useEffect(() => {
    const warning = (location.state as { warning?: string } | null)?.warning;
    if (warning) {
      showToast(warning, "warning");
      // Clear the navigation state so refreshing this page (or coming back
      // to it later) doesn't re-show the same one-time warning.
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRegenerateCurriculum = async () => {
    if (!workspaceId) return;
    setIsPlanning(true);
    try {
      // Best-effort retry for the empty-state case; the normal path already
      // generates curriculum at creation time in CreateWorkspaceModal. Use
      // the real workspace title when available.
      await getTier1Modules({
        workspaceId,
        workspaceTitle: workspaceTitle || "Workspace",
      });
      showToast("Curriculum generated. Refreshing...", "success");
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      showToast("Curriculum generation failed. Please try again.", "error");
    } finally {
      setIsPlanning(false);
    }
  };

  // Bootstrap: POST /learning/init first (idempotent server-side), then
  // release the load effect so the canonical GET /learning always runs AFTER
  // the LearningProgress records exist. Failure is recorded explicitly so the
  // load path can surface an actionable error instead of misleading LOCKED
  // Units. Re-runs (via retryToken) re-attempt initialization.
  useEffect(() => {
    if (!workspaceId) return;
    let cancelled = false;
    bootstrapInFlightRef.current = true;

    const init = async () => {
      try {
        await initializeWorkspaceProgress(workspaceId);
        if (!cancelled) initErrorRef.current = null;
      } catch (err: any) {
        if (!cancelled) {
          const message =
            err?.response?.data?.message ||
            "Failed to sync workspace progress.";
          initErrorRef.current = message;
          showToast(message, "error");
        }
      }

      try {
        const workspaceResult = await workspaceApi.getWorkspaceById(
          workspaceId,
        );
        if (workspaceResult?.data?.title) {
          setWorkspaceTitle(workspaceResult.data.title);
        }
      } catch (err) {
        showToast("Failed to load workspace details.", "error");
      } finally {
        if (!cancelled) {
          bootstrapInFlightRef.current = false;
          setIsInitializing(false);
        }
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [workspaceId, showToast, retryToken]);

  // --- Curriculum loading (owned by WorkspacePage; TopicPathView is presentational) ---
  const loadConcepts = useCallback(
    async (signal: AbortSignal) => {
      if (!workspaceId) return;
      setLoadState("loading");
      setErrorMessage("");
      try {
        const progressData: ILearningProgress[] = await getWorkspaceProgress(
          workspaceId,
        );
        if (signal.aborted) return;
        // Defensive: the progress payload can come back as a 204-like empty
        // response or otherwise non-array. Never let the refresh throw on
        // .forEach — an empty array degrades to "no progress yet" instead of a
        // stale, frozen progressMap.
        const safeProgress = Array.isArray(progressData) ? progressData : [];
        const pMap = new Map<string, ILearningProgress>();
        safeProgress.forEach((item) => {
          if (item.concept?.conceptId) {
            pMap.set(item.concept.conceptId, item);
          }
        });
        setProgressMap(pMap);

        const conceptsResponse = await conceptApi.getConceptsByWorkspace(
          workspaceId,
          signal,
        );
        if (signal.aborted) return;
        const rawConcepts = conceptsResponse.data || [];
        setConcepts(rawConcepts);

        // If progress initialization failed AND there is no progress data to
        // render, surface an actionable error instead of silently presenting
        // the empty progressMap as a genuinely all-LOCKED curriculum.
        if (initErrorRef.current && pMap.size === 0 && rawConcepts.length > 0) {
          setErrorMessage(
            `${initErrorRef.current} Unit states could not be initialized. Please retry.`,
          );
          setLoadState("error");
          return;
        }

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
    if (!workspaceId) return;
    // Sequencing guard: never load progress while initialization is still
    // running (first mount, or a Retry that re-runs the bootstrap effect).
    // The bootstrap effect sets bootstrapInFlightRef synchronously before this
    // effect's body executes, so GET /learning can never race ahead of
    // POST /learning/init. Once isInitializing flips false this effect re-runs
    // and performs the canonical, populated progress load.
    if (isInitializing || bootstrapInFlightRef.current) return;
    const controller = new AbortController();
    loadConcepts(controller.signal);
    return () => controller.abort();
  }, [workspaceId, loadConcepts, refreshKey, retryToken, isInitializing]);

  // Silent refetch of curriculum + progress after JIT generation completes.
  const refetchCurriculum = useCallback(
    async (): Promise<IConcept[] | null> => {
      if (!workspaceId) return null;
      try {
        const progressData: ILearningProgress[] = await getWorkspaceProgress(
          workspaceId,
        );
        // Defensive: same guard as loadConcepts — an empty/204-like payload
        // must not crash the post-submit / post-generation refresh path.
        const safeProgress = Array.isArray(progressData) ? progressData : [];
        const pMap = new Map<string, ILearningProgress>();
        safeProgress.forEach((item) => {
          if (item.concept?.conceptId) {
            pMap.set(item.concept.conceptId, item);
          }
        });
        setProgressMap(pMap);

        const response = await conceptApi.getConceptsByWorkspace(workspaceId);
        const raw = response.data || [];
        setLoadState(raw.length > 0 ? "ready" : "empty");
        return raw;
      } catch (err) {
        console.error("Error refetching curriculum after generation:", err);
        return null;
      }
    },
    [workspaceId],
  );

  // --- JIT Tier 2: generate chapters for a Unit only when none are cached ---
  const generateChaptersForUnit = useCallback(
    async (unit: IConcept) => {
      if (!workspaceId) return;
      if (!workspaceTitle) {
        showToast(
          "Workspace details not loaded. Please refresh and retry.",
          "error",
        );
        return;
      }
      // Duplicate-request guard: a Tier 2 request is already in flight for
      // this exact Unit, so re-selecting it must not issue another AI call.
      if (activeTier2UnitIdRef.current === unit.conceptId) return;
      activeTier2UnitIdRef.current = unit.conceptId;
      setIsGeneratingTier2(true);
      try {
        showToast(`Generating chapters for "${unit.title}"...`, "info");
        await getTier2Subtopics({
          conceptId: unit.conceptId,
          workspaceTitle,
          moduleTitle: unit.title,
          moduleDescription: unit.description,
        });
        const fresh = await refetchCurriculum();
        if (!fresh) {
          showToast(
            "Chapters generated, but refreshing the workspace failed. Please retry.",
            "error",
          );
          return;
        }
        const freshUnit =
          fresh.find((c) => c.conceptId === unit.conceptId) ?? unit;
        // Stale-result guard: only apply the fresh node if the user is still
        // on this Unit. The functional update reads the latest selection
        // state, so a completion for Unit A can never overwrite a newer
        // navigation to Unit B or back to the Units list.
        setSelectedUnit((prev) =>
          prev && prev.conceptId === unit.conceptId ? freshUnit : prev,
        );
        showToast(`Chapters generated for "${unit.title}".`, "success");
      } catch (err) {
        console.error("Tier 2 generation failed:", err);
        showToast("Failed to generate chapters. Please try again.", "error");
      } finally {
        // Only the generation that owns the ref may clear it — this keeps the
        // duplicate guard and the spinner correct even if a newer generation
        // for a different Unit started in the meantime.
        if (activeTier2UnitIdRef.current === unit.conceptId) {
          activeTier2UnitIdRef.current = null;
          setIsGeneratingTier2(false);
        }
      }
    },
    [workspaceId, workspaceTitle, showToast, refetchCurriculum],
  );

  const handleSelectUnit = useCallback(
    async (unit: IConcept) => {
      setSelectedUnit(unit);
      setSelectedChapter(null);
      setSelectedLesson(null);

      // Chapters already cached → skip Tier 2 and go straight to the list.
      if (unit.topics && unit.topics.length > 0) return;
      await generateChaptersForUnit(unit);
    },
    [generateChaptersForUnit],
  );

  const handleGenerateChapters = useCallback(() => {
    if (selectedUnit) {
      generateChaptersForUnit(selectedUnit);
    }
  }, [selectedUnit, generateChaptersForUnit]);

  // --- JIT Tier 3: generate lesson nodes for a Chapter when none are cached ---
  const generateLessonsForChapter = useCallback(
    async (unit: IConcept, chapter: IConceptTopic) => {
      if (!workspaceId) return;
      if (!workspaceTitle) {
        showToast(
          "Workspace details not loaded. Please refresh and retry.",
          "error",
        );
        return;
      }
      // Duplicate-request guard: a Tier 3 request is already in flight for
      // this exact Chapter, so re-selecting it must not issue another AI call.
      if (activeTier3ChapterIdRef.current === chapter.id) return;
      activeTier3ChapterIdRef.current = chapter.id;
      setIsGeneratingTier3(true);
      try {
        showToast(`Generating lessons for "${chapter.title}"...`, "info");
        await getTier3Lessons({
          conceptId: unit.conceptId,
          workspaceTitle,
          moduleTitle: unit.title,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          chapterDescription: chapter.description,
        });
        const fresh = await refetchCurriculum();
        if (!fresh) {
          showToast(
            "Lessons generated, but refreshing the workspace failed. Please retry.",
            "error",
          );
          return;
        }
        const freshUnit =
          fresh.find((c) => c.conceptId === unit.conceptId) ?? unit;
        const freshChapter =
          freshUnit.topics.find((t) => t.id === chapter.id) ?? chapter;
        // Stale-result guards: the functional updates read the latest
        // selection state, so a completion for Unit A / Chapter A can never
        // overwrite a newer navigation to Unit B / Chapter B or back up the
        // hierarchy (Cases 2, 3, 4, 5).
        setSelectedUnit((prev) =>
          prev && prev.conceptId === unit.conceptId ? freshUnit : prev,
        );
        setSelectedChapter((prev) =>
          prev && prev.id === chapter.id ? freshChapter : prev,
        );
        showToast(`Lessons generated for "${chapter.title}".`, "success");
      } catch (err) {
        console.error("Tier 3 generation failed:", err);
        showToast("Failed to generate lessons. Please try again.", "error");
      } finally {
        // Only the generation that owns the ref may clear it — keeps the
        // duplicate guard and spinner correct across overlapping requests.
        if (activeTier3ChapterIdRef.current === chapter.id) {
          activeTier3ChapterIdRef.current = null;
          setIsGeneratingTier3(false);
        }
      }
    },
    [workspaceId, workspaceTitle, showToast, refetchCurriculum],
  );

  const handleSelectChapter = useCallback(
    async (chapter: IConceptTopic) => {
      if (!selectedUnit) return;
      setSelectedChapter(chapter);
      setSelectedLesson(null);

      // Lesson nodes already cached → skip Tier 3.
      if (chapter.lessons && chapter.lessons.length > 0) return;
      await generateLessonsForChapter(selectedUnit, chapter);
    },
    [selectedUnit, generateLessonsForChapter],
  );

  const handleGenerateLessons = useCallback(() => {
    if (selectedUnit && selectedChapter) {
      generateLessonsForChapter(selectedUnit, selectedChapter);
    }
  }, [selectedUnit, selectedChapter, generateLessonsForChapter]);

  // --- Lesson selection + back navigation ---
  const handleSelectLesson = useCallback((lesson: ILessonNode) => {
    setSelectedLesson(lesson);
  }, []);

  const handleCloseStudio = useCallback(() => {
    setSelectedLesson(null);
  }, []);

  const handleBackToUnits = useCallback(() => {
    setSelectedUnit(null);
    setSelectedChapter(null);
    setSelectedLesson(null);
  }, []);

  const handleBackToChapters = useCallback(() => {
    setSelectedChapter(null);
    setSelectedLesson(null);
  }, []);

  const handleAskPlanner = async () => {
    if (!workspaceId) return;
    setIsPlanning(true);

    try {
      const plan = await planNextPath({ workspaceId });
      const nextConcept = plan?.nextConcept?.trim();
      if (!nextConcept) {
        showToast(
          "You've mastered all current modules in this workspace!",
          "info",
        );
        return;
      }

      // The planner prompt is fed conceptIds as the available graph nodes, so
      // the LLM's nextConcept is expected to be one of them. Match by
      // conceptId first, then by title as a tolerant fallback. We only ever
      // select a real Unit here — we never fabricate a Chapter or Lesson Node.
      const match = concepts.find(
        (c) =>
          c.conceptId === nextConcept ||
          c.title.trim().toLowerCase() === nextConcept.toLowerCase(),
      );
      if (match) {
        showToast(`Next path: "${match.title}"`, "success");
        handleSelectUnit(match);
      } else {
        showToast(
          `Planner recommends: "${nextConcept}". Select it manually.`,
          "info",
        );
      }
    } catch (error) {
      showToast("Planner offline. Try selecting a module manually.", "warning");
    } finally {
      setIsPlanning(false);
    }
  };

  if (!workspaceId) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#080A0F] text-gray-500 font-mono text-sm">
        Workspace ID missing.
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#080A0F] text-gray-200">
      {/* Toast Overlay */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 rounded-xl border p-4 text-xs font-medium shadow-2xl backdrop-blur-md transition-all ${
              toast.type === "error"
                ? "border-red-500/40 bg-[#12141A] text-red-300"
                : toast.type === "success"
                  ? "border-[#BCFF3C]/50 bg-[#12141A] text-[#BCFF3C]"
                  : toast.type === "warning"
                    ? "border-amber-500/40 bg-[#12141A] text-amber-300"
                    : "border-gray-800 bg-[#12141A] text-gray-300"
            }`}
          >
            <span>{toast.message}</span>
            <button
              onClick={() =>
                setToasts((prev) => prev.filter((t) => t.id !== toast.id))
              }
              className="text-gray-500 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Header Overlay */}
      <header className="absolute top-4 left-4 z-10 flex items-center gap-4 rounded-xl border border-gray-800 bg-[#12141A]/90 p-3 backdrop-blur-md">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 rounded-lg border border-gray-800 bg-[#181B22] px-3 py-1.5 text-xs font-medium text-gray-300 hover:border-gray-700 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
        </button>

        <div className="h-4 w-px bg-gray-800" />

        {/* Branding */}
        <span className="font-mono text-xs font-semibold tracking-wider text-white">
          NEXUS<span className="text-[#BCFF3C]">SPACE</span>
        </span>

        <div className="h-4 w-px bg-gray-800" />

        <button
          onClick={handleAskPlanner}
          disabled={isPlanning || isInitializing}
          className="flex items-center gap-2 rounded-lg bg-[#00E5FF]/10 border border-[#00E5FF]/30 px-3 py-1.5 text-xs font-semibold text-[#00E5FF] hover:bg-[#00E5FF]/20 transition-all disabled:opacity-50 cursor-pointer"
        >
          {isPlanning ? (
            <Sparkles className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Compass className="h-3.5 w-3.5" />
          )}
          <span>Next Recommended Concept</span>
        </button>
      </header>

      {/* Main Canvas View */}
      <div className="flex h-full w-full">
        <div
          className={`h-full transition-all duration-300 ${
            selectedLesson ? "w-1/2 lg:w-3/5" : "w-full"
          }`}
        >
          {isInitializing ? (
            <div className="flex h-full w-full items-center justify-center gap-3 font-mono text-xs text-gray-500">
              <Sparkles className="h-4 w-4 animate-spin text-[#BCFF3C]" />
              <span>Initializing Learning OS...</span>
            </div>
          ) : (
            <ErrorBoundary
              key={`${workspaceId}_${refreshKey}`}
              fallbackTitle="Workspace execution error"
            >
              {selectedUnit ? (
                selectedChapter ? (
                  <LessonList
                    unit={selectedUnit}
                    chapter={selectedChapter}
                    lessons={selectedChapter.lessons ?? []}
                    isGenerating={isGeneratingTier3}
                    onSelectLesson={handleSelectLesson}
                    onBackToChapters={handleBackToChapters}
                    onGenerateLessons={handleGenerateLessons}
                  />
                ) : (
                  <ChapterList
                    unit={selectedUnit}
                    chapters={selectedUnit.topics ?? []}
                    isGenerating={isGeneratingTier2}
                    onSelectChapter={handleSelectChapter}
                    onBackToUnits={handleBackToUnits}
                    onGenerateChapters={handleGenerateChapters}
                  />
                )
              ) : (
                <TopicPathView
                  concepts={concepts}
                  progressMap={progressMap}
                  loadState={loadState}
                  errorMessage={errorMessage}
                  isRegenerating={isPlanning}
                  onSelectUnit={handleSelectUnit}
                  onRegenerateCurriculum={handleRegenerateCurriculum}
                  onRetry={() => setRetryToken((n) => n + 1)}
                />
              )}
            </ErrorBoundary>
          )}
        </div>

        {selectedLesson && selectedUnit && (
          <div className="h-full w-1/2 lg:w-2/5 animate-in slide-in-from-right duration-300">
            <ErrorBoundary
              key={selectedLesson.id}
              fallbackTitle="Could not load studio view"
            >
              <TeacherStudio
                workspaceId={workspaceId}
                workspaceTitle={workspaceTitle}
                conceptId={selectedUnit.conceptId}
                conceptTitle={selectedUnit.title}
                status={
                  progressMap.get(selectedUnit.conceptId)?.status ??
                  ConceptStatus.LOCKED
                }
                chapterId={selectedChapter?.id}
                chapterTitle={selectedChapter?.title}
                lessonId={selectedLesson.id}
                lessonTitle={selectedLesson.title}
                onClose={handleCloseStudio}
                onProgressUpdated={() => setRefreshKey((prev) => prev + 1)}
              />
            </ErrorBoundary>
          </div>
        )}
      </div>
    </div>
  );
}
