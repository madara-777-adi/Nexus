import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TopicPathView } from "../../components/workspace/TopicPathView";
import { TeacherStudio } from "../../components/workspace/TeacherStudio";
import { ErrorBoundary } from "../../components/common/ErrorBoundary";
import { initializeWorkspaceProgress } from "../../api/learning.api";
import { planNextPath } from "../../api/ai.api";
import { ConceptStatus } from "../../types/learning.types";

export function WorkspacePage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();

  const [selectedConcept, setSelectedConcept] = useState<{
    id: string;
    title: string;
    status: ConceptStatus;
  } | null>(null);

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isPlanning, setIsPlanning] = useState<boolean>(false);

  useEffect(() => {
    if (!workspaceId) return;

    const initProgress = async () => {
      try {
        await initializeWorkspaceProgress(workspaceId);
      } catch (err) {
        console.error("Failed to initialize workspace progress:", err);
      } finally {
        setIsInitializing(false);
      }
    };

    initProgress();
  }, [workspaceId]);

  const handleSelectConcept = useCallback(
    (conceptId: string, title: string, status: ConceptStatus) => {
      setSelectedConcept({ id: conceptId, title, status });
    },
    [],
  );

  const handleProgressUpdated = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handleAskPlanner = async () => {
    if (!workspaceId) return;
    setIsPlanning(true);
    try {
      const plan = await planNextPath({ workspaceId });

      if (plan && plan.recommendedNodeId) {
        setSelectedConcept({
          id: plan.recommendedNodeId,
          title: plan.recommendedNodeTitle || "Recommended Concept",
          status: ConceptStatus.UNLOCKED,
        });
      } else {
        alert("You've mastered everything in this workspace!");
      }
    } catch (error) {
      console.error("Failed to get AI plan:", error);
      alert("The AI Planner encountered an issue.");
    } finally {
      setIsPlanning(false);
    }
  };

  if (!workspaceId) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#080A0F] text-slate-400">
        Workspace ID not found.
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#080A0F]">
      {/* Navigation Header Overlay */}
      <header className="absolute top-4 left-4 z-10 flex items-center gap-3 rounded-xl border border-slate-800 bg-[#0F131C]/90 p-3 backdrop-blur-md">
        <button
          onClick={() => navigate("/dashboard")}
          className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-slate-700 hover:text-white"
        >
          ← Dashboard
        </button>
        <div className="h-4 w-px bg-slate-800" />
        <span className="text-xs font-mono font-medium text-slate-400">
          NexusSpace Curriculum Path
        </span>
        <div className="h-4 w-px bg-slate-800" />

        {/* AI Planner Button */}
        <button
          onClick={handleAskPlanner}
          disabled={isPlanning || isInitializing}
          className="flex items-center gap-2 rounded-lg bg-[#BCFF3C]/10 px-3 py-1.5 text-xs font-bold text-[#BCFF3C] transition-colors hover:bg-[#BCFF3C]/20 disabled:opacity-50"
        >
          {isPlanning ? (
            <>
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#BCFF3C]/30 border-t-[#BCFF3C]" />
              Consulting AI...
            </>
          ) : (
            "✨ What should I study next?"
          )}
        </button>
      </header>

      {/* Main Container */}
      <div className="flex h-full w-full">
        <div
          className={`h-full transition-all duration-300 ${
            selectedConcept ? "w-1/2 lg:w-3/5" : "w-full"
          }`}
        >
          {isInitializing ? (
            <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
              Initializing curriculum progression state...
            </div>
          ) : (
            <ErrorBoundary
              key={`${workspaceId}_${refreshKey}`}
              fallbackTitle="This workspace hit a runtime error"
            >
              <TopicPathView
                workspaceId={workspaceId}
                onSelectConcept={handleSelectConcept}
              />
            </ErrorBoundary>
          )}
        </div>

        {selectedConcept && (
          <div className="h-full w-1/2 lg:w-2/5 animate-in slide-in-from-right duration-300">
            <TeacherStudio
              workspaceTitle="Workspace Engine"
              workspaceId={workspaceId}
              conceptId={selectedConcept.id}
              conceptTitle={selectedConcept.title}
              status={selectedConcept.status}
              onClose={() => setSelectedConcept(null)}
              onProgressUpdated={handleProgressUpdated}
            />
          </div>
        )}
      </div>
    </div>
  );
}
