import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  TopicPathView,
  type LoadState,
} from "../../components/workspace/TopicPathView";
import { ChapterList } from "../../components/workspace/ChapterList";
import { LessonList } from "../../components/workspace/LessonList";
import { TeacherStudio } from "../../components/workspace/TeacherStudio";
import { CurriculumGraph } from "../../components/workspace/CurriculumGraph";
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
  type ILessonProgress,
} from "../../types/learning.types";
import type {
  IConcept,
  IConceptTopic,
  ILessonNode,
} from "../../types/workspace.types";
import { Sparkles, ArrowLeft, Compass, Layers, GitBranch, Network } from "lucide-react";

interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
}

function buildProgressMaps(
  progressData:
    | { concepts?: ILearningProgress[]; lessons?: ILessonProgress[] }
    | null
    | undefined,
): {
  pMap: Map<string, ILearningProgress>;
  lMap: Map<string, ILessonProgress>;
} {
  const conceptProgress = Array.isArray(progressData?.concepts)
    ? progressData!.concepts
    : [];
  const lessonProgress = Array.isArray(progressData?.lessons)
    ? progressData!.lessons
    : [];

  const pMap = new Map<string, ILearningProgress>();
  conceptProgress.forEach((item) => {
    if (item.concept?.conceptId) {
      pMap.set(item.concept.conceptId, item);
    }
  });

  const lMap = new Map<string, ILessonProgress>();
  lessonProgress.forEach((item) => {
    if (!item.concept?.conceptId) return;
    const key = `${item.concept.conceptId}:${item.chapterId}:${item.lessonId}`;
    lMap.set(key, item);
  });

  return { pMap, lMap };
}

export function WorkspacePage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedUnit, setSelectedUnit] = useState<IConcept | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<IConceptTopic | null>(
    null,
  );
  const [selectedLesson, setSelectedLesson] = useState<ILessonNode | null>(
    null,
  );

  const [viewMode, setViewMode] = useState<"standard" | "graph">("standard");
  const [concepts, setConcepts] = useState<IConcept[]>([]);
  const [progressMap, setProgressMap] = useState<
    Map<string, ILearningProgress>
  >(new Map());
  const [lessonProgressMap, setLessonProgressMap] = useState<
    Map<string, ILessonProgress>
  >(new Map());
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [retryToken, setRetryToken] = useState(0);

  const [workspaceTitle, setWorkspaceTitle] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isPlanning, setIsPlanning] = useState<boolean>(false);
  const [isGeneratingTier2, setIsGeneratingTier2] = useState<boolean>(false);
  const [isGeneratingTier3, setIsGeneratingTier3] = useState<boolean>(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const activeTier2UnitIdRef = useRef<string | null>(null);
  const activeTier3ChapterIdRef = useRef<string | null>(null);
  const initErrorRef = useRef<string | null>(null);
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
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, []);

  const handleRegenerateCurriculum = async () => {
    if (!workspaceId) return;
    setIsPlanning(true);
    try {
      await getTier1Modules({
        workspaceId,
        workspaceTitle: workspaceTitle || "Workspace",
      });
      showToast("Curriculum generated. Refreshing...", "success");
      setRefreshKey((prev) => prev + 1);
    } catch {
      showToast("Curriculum generation failed. Please try again.", "error");
    } finally {
      setIsPlanning(false);
    }
  };

  useEffect(() => {
    if (!workspaceId) return;
    let cancelled = false;
    bootstrapInFlightRef.current = true;

    const init = async () => {
      try {
        await initializeWorkspaceProgress(workspaceId);
        if (!cancelled) initErrorRef.current = null;
      } catch (err: unknown) {
        if (!cancelled) {
          const message = "Failed to sync workspace progress.";
          initErrorRef.current = message;
          showToast(message, "error");
        }
      }
      try {
        const workspaceResult =
          await workspaceApi.getWorkspaceById(workspaceId);
        if (workspaceResult?.data?.title) {
          setWorkspaceTitle(workspaceResult.data.title);
        }
      } catch {
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

  const loadConcepts = useCallback(
    async (signal: AbortSignal) => {
      if (!workspaceId) return;
      setLoadState("loading");
      setErrorMessage("");
      try {
        const progressData = await getWorkspaceProgress(workspaceId);
        if (signal.aborted) return;
        const { pMap, lMap } = buildProgressMaps(progressData);
        setProgressMap(pMap);
        setLessonProgressMap(lMap);

        const conceptsResponse = await conceptApi.getConceptsByWorkspace(
          workspaceId,
          signal,
        );
        if (signal.aborted) return;
        const rawConcepts = conceptsResponse.data || [];
        setConcepts(rawConcepts);

        if (initErrorRef.current && pMap.size === 0 && rawConcepts.length > 0) {
          setErrorMessage(
            `${initErrorRef.current} Unit states could not be initialized. Please retry.`,
          );
          setLoadState("error");
          return;
        }

        setLoadState(rawConcepts.length > 0 ? "ready" : "empty");
      } catch {
        if (signal.aborted) return;
        setErrorMessage("Something went wrong loading the modules.");
        setLoadState("error");
      }
    },
    [workspaceId],
  );

  useEffect(() => {
    if (!workspaceId || isInitializing || bootstrapInFlightRef.current) return;
    const controller = new AbortController();
    loadConcepts(controller.signal);
    return () => controller.abort();
  }, [workspaceId, loadConcepts, refreshKey, retryToken, isInitializing]);

  const refetchCurriculum = useCallback(async (): Promise<
    IConcept[] | null
  > => {
    if (!workspaceId) return null;
    try {
      const progressData = await getWorkspaceProgress(workspaceId);
      const { pMap, lMap } = buildProgressMaps(progressData);
      setProgressMap(pMap);
      setLessonProgressMap(lMap);
      const response = await conceptApi.getConceptsByWorkspace(workspaceId);
      const raw = response.data || [];
      setLoadState(raw.length > 0 ? "ready" : "empty");
      return raw;
    } catch {
      return null;
    }
  }, [workspaceId]);

  const generateChaptersForUnit = useCallback(
    async (unit: IConcept) => {
      if (!workspaceId || !workspaceTitle) return;
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
        if (fresh) {
          const freshUnit =
            fresh.find((c) => c.conceptId === unit.conceptId) ?? unit;
          setSelectedUnit((prev) =>
            prev && prev.conceptId === unit.conceptId ? freshUnit : prev,
          );
          showToast(`Chapters generated for "${unit.title}".`, "success");
        }
      } catch {
        showToast("Failed to generate chapters. Please try again.", "error");
      } finally {
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
      if (unit.topics && unit.topics.length > 0) return;
      await generateChaptersForUnit(unit);
    },
    [generateChaptersForUnit],
  );

  const handleGenerateChapters = useCallback(() => {
    if (selectedUnit) {
      if (selectedUnit.topics && selectedUnit.topics.length > 0) return;
      generateChaptersForUnit(selectedUnit);
    }
  }, [selectedUnit, generateChaptersForUnit]);

  const generateLessonsForChapter = useCallback(
    async (unit: IConcept, chapter: IConceptTopic) => {
      if (!workspaceId || !workspaceTitle) return;
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
        if (fresh) {
          const freshUnit =
            fresh.find((c) => c.conceptId === unit.conceptId) ?? unit;
          const freshChapter =
            freshUnit.topics.find((t) => t.id === chapter.id) ?? chapter;
          setSelectedUnit((prev) =>
            prev && prev.conceptId === unit.conceptId ? freshUnit : prev,
          );
          setSelectedChapter((prev) =>
            prev && prev.id === chapter.id ? freshChapter : prev,
          );
          showToast(`Lessons generated for "${chapter.title}".`, "success");
        }
      } catch {
        showToast("Failed to generate lessons. Please try again.", "error");
      } finally {
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
      if (chapter.lessons && chapter.lessons.length > 0) return;
      await generateLessonsForChapter(selectedUnit, chapter);
    },
    [selectedUnit, generateLessonsForChapter],
  );

  const handleGenerateLessons = useCallback(() => {
    if (selectedUnit && selectedChapter) {
      if (selectedChapter.lessons && selectedChapter.lessons.length > 0) return;
      generateLessonsForChapter(selectedUnit, selectedChapter);
    }
  }, [selectedUnit, selectedChapter, generateLessonsForChapter]);

  const handleAskPlanner = async () => {
    if (!workspaceId) return;
    setIsPlanning(true);
    try {
      const plan = await planNextPath({ workspaceId });
      const nextConcept = plan?.nextConcept?.trim();
      if (!nextConcept) {
        showToast("All current modules mastered!", "info");
        return;
      }
      const match = concepts.find(
        (c) =>
          c.conceptId === nextConcept ||
          c.title.trim().toLowerCase() === nextConcept.toLowerCase(),
      );
      if (match) {
        showToast(`Next path: "${match.title}"`, "success");
        handleSelectUnit(match);
      }
    } catch {
      showToast("Planner offline.", "warning");
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
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#080A0F] text-slate-100 selection:bg-neon-lime selection:text-midnight">
      {/* Toast Overlay */}
      <div className="fixed bottom-5 right-5 z-70 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto rounded-xl border border-surface-border bg-[#12141A] p-4 text-xs font-medium shadow-2xl backdrop-blur-md"
          >
            {t.message}
          </div>
        ))}
      </div>

      {/* Top Navigation Bar (Fixed 64px height) */}
      <header className="h-16 shrink-0 glass-nav px-4 lg:px-8 flex items-center justify-between z-30">
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-neon-lime" />
            <span>Tier 1: Skills Dashboard</span>
          </button>
          <div className="h-4 w-px bg-[#1E2846] hidden sm:block"></div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#080A0F] border border-[#1E2846] rounded-xl text-xs text-slate-300">
            <span className="text-slate-500 font-mono">Skill:</span>
            <span className="font-medium text-slate-200 truncate max-w-[180px] sm:max-w-none">
              {workspaceTitle || "Workspace Blueprint"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAskPlanner}
            disabled={isPlanning || isInitializing}
            className="flex items-center gap-2 bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] hover:bg-[#00E5FF]/20 font-bold px-3.5 py-1.5 rounded-xl text-xs transition disabled:opacity-50 cursor-pointer"
          >
            {isPlanning ? (
              <Sparkles className="w-4 h-4 animate-spin" />
            ) : (
              <Compass className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Next Best Path</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Dual-Panel Body */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative z-10">
        {/* Left Sidebar (Independent vertical scroll) */}
        <aside className="w-16 lg:w-64 glass-sidebar h-full overflow-y-auto p-3 lg:p-4 flex flex-col justify-between shrink-0 border-r border-[#1E2846]">
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider hidden lg:block mb-3 px-2">
                Learning Hierarchy
              </span>
              <nav className="space-y-1.5">
                <button
                  onClick={() => {
                    setSelectedUnit(null);
                    setSelectedChapter(null);
                    setSelectedLesson(null);
                    setViewMode("standard");
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                    !selectedUnit && viewMode === "standard"
                      ? "bg-neon-lime/10 border border-neon-lime/20 text-neon-lime"
                      : "text-slate-400 hover:text-slate-100 hover:bg-[#1E2846]/40"
                  }`}
                >
                  <Layers className="w-4 h-4 shrink-0" />
                  <span className="hidden lg:inline">Tier 2 • Modules</span>
                </button>
                <button
                  disabled={!selectedUnit}
                  onClick={() => {
                    setSelectedChapter(null);
                    setSelectedLesson(null);
                    setViewMode("standard");
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition ${
                    selectedUnit && !selectedChapter && viewMode === "standard"
                      ? "bg-neon-lime/10 border border-neon-lime/20 text-neon-lime cursor-pointer"
                      : selectedUnit
                        ? "text-slate-400 hover:text-slate-100 hover:bg-[#1E2846]/40 cursor-pointer"
                        : "opacity-40 cursor-not-allowed text-gray-500"
                  }`}
                >
                  <GitBranch className="w-4 h-4 shrink-0" />
                  <span className="hidden lg:inline">Tier 3 • Chapters</span>
                </button>
                <button
                  onClick={() => {
                    setViewMode("graph");
                    setSelectedUnit(null);
                    setSelectedChapter(null);
                    setSelectedLesson(null);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                    viewMode === "graph"
                      ? "bg-[#00E5FF]/10 border border-[#00E5FF]/20 text-[#00E5FF]"
                      : "text-slate-400 hover:text-slate-100 hover:bg-[#1E2846]/40"
                  }`}
                >
                  <Network className="w-4 h-4 shrink-0" />
                  <span className="hidden lg:inline">Curriculum Graph</span>
                </button>
              </nav>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-3 p-3 bg-[#080A0F] border border-[#1E2846] rounded-xl text-xs">
            <div className="w-2 h-2 rounded-full bg-neon-lime"></div>
            <div className="flex-1 truncate">
              <p className="text-slate-200 font-medium truncate">
                JIT Graph Active
              </p>
              <p className="text-[10px] text-slate-500">4-Tier Synced</p>
            </div>
          </div>
        </aside>

        {/* Right Content Area (Independent vertical scroll) */}
        <main className="flex-1 h-full overflow-y-auto relative">
          <ErrorBoundary
            key={`${workspaceId}_${refreshKey}_${viewMode}`}
            fallbackTitle="Workspace view failed to load"
          >
            {viewMode === "graph" ? (
              <CurriculumGraph
                concepts={concepts}
                progressMap={progressMap}
                lessonProgressMap={lessonProgressMap}
              />
            ) : selectedUnit ? (
              selectedChapter ? (
                <LessonList
                  unit={selectedUnit}
                  chapter={selectedChapter}
                  lessons={selectedChapter.lessons ?? []}
                  isGenerating={isGeneratingTier3}
                  lessonProgressMap={lessonProgressMap}
                  onSelectLesson={(lesson) => setSelectedLesson(lesson)}
                  onBackToChapters={() => {
                    setSelectedChapter(null);
                    setSelectedLesson(null);
                  }}
                  onGenerateLessons={handleGenerateLessons}
                />
              ) : (
                <ChapterList
                  unit={selectedUnit}
                  chapters={selectedUnit.topics ?? []}
                  isGenerating={isGeneratingTier2}
                  lessonProgressMap={lessonProgressMap}
                  onSelectChapter={handleSelectChapter}
                  onBackToUnits={() => {
                    setSelectedUnit(null);
                    setSelectedChapter(null);
                    setSelectedLesson(null);
                  }}
                  onGenerateChapters={handleGenerateChapters}
                />
              )
            ) : (
              <TopicPathView
                concepts={concepts}
                progressMap={progressMap}
                lessonProgressMap={lessonProgressMap}
                loadState={loadState}
                errorMessage={errorMessage}
                isRegenerating={isPlanning}
                onSelectUnit={handleSelectUnit}
                onRegenerateCurriculum={handleRegenerateCurriculum}
                onRetry={() => setRetryToken((n) => n + 1)}
              />
            )}
          </ErrorBoundary>
        </main>
      </div>

      {/* Pop-up Studio Modal Overlay (Tier 4) */}
      {selectedLesson && selectedUnit && (
        <ErrorBoundary
          key={selectedLesson.id}
          fallbackTitle="Could not load lesson experience studio"
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
            onClose={() => setSelectedLesson(null)}
            onProgressUpdated={() => setRefreshKey((prev) => prev + 1)}
          />
        </ErrorBoundary>
      )}
    </div>
  );
}
