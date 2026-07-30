import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TopicPathView } from "../../components/workspace/TopicPathView";
import { TeacherStudio } from "../../components/workspace/TeacherStudio";
import { ErrorBoundary } from "../../components/common/ErrorBoundary";
import { initializeWorkspaceProgress } from "../../api/learning.api";
import { planNextPath } from "../../api/ai.api";
import { ConceptStatus } from "../../types/learning.types";

interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
}

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

  // Virtual Toast Notification State
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (
      message: string,
      type: "success" | "error" | "info" | "warning" = "info",
    ) => {
      const id = `toast_${Date.now()}`;
      setToasts((prev) => [...prev, { id, type, message }]);

      // Auto dismiss toast after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    [],
  );

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    if (!workspaceId) return;

    const initProgress = async () => {
      try {
        await initializeWorkspaceProgress(workspaceId);
      } catch (err) {
        showToast("Failed to sync workspace progress.", "error");
      } finally {
        setIsInitializing(false);
      }
    };

    initProgress();
  }, [workspaceId, showToast]);

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
        showToast(
          `Next recommended topic: "${plan.recommendedNodeTitle || "Module"}"`,
          "success",
        );
      } else {
        showToast(
          "You've mastered all current topics in this workspace!",
          "info",
        );
      }
    } catch (error) {
      showToast("AI Planner encountered an issue. Please try again.", "error");
    } finally {
      setIsPlanning(false);
    }
  };

  if (!workspaceId) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#080A0F] text-slate-400 font-mono text-sm">
        Workspace ID not found.
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#080A0F] text-slate-200">
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 rounded-xl border p-4 text-xs font-medium shadow-2xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-2 ${
              toast.type === "error"
                ? "border-red-500/40 bg-red-950/80 text-red-200"
                : toast.type === "success"
                  ? "border-[#BCFF3C]/50 bg-[#080A0F]/90 text-[#BCFF3C]"
                  : toast.type === "warning"
                    ? "border-amber-500/40 bg-amber-950/80 text-amber-200"
                    : "border-slate-800 bg-[#0F131C]/90 text-slate-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold uppercase tracking-wider text-[10px]">
                {toast.type}:
              </span>
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 rounded text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Navigation Header Overlay */}
      <header className="absolute top-4 left-4 z-10 flex items-center gap-3 rounded-xl border border-slate-800 bg-[#0F131C]/90 p-3 backdrop-blur-md">
        <button
          onClick={() => navigate("/dashboard")}
          className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-slate-700 hover:text-white cursor-pointer"
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
          className="flex items-center gap-2 rounded-lg bg-[#BCFF3C]/10 px-3 py-1.5 text-xs font-bold text-[#BCFF3C] transition-colors hover:bg-[#BCFF3C]/20 disabled:opacity-50 cursor-pointer"
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
            <div className="flex h-full w-full items-center justify-center text-xs font-mono text-slate-500">
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 animate-ping rounded-full bg-[#BCFF3C]" />
                <span>Initializing curriculum progression state...</span>
              </div>
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
            <ErrorBoundary
              key={selectedConcept.id}
              fallbackTitle="Could not display lesson content"
            >
              <TeacherStudio
                workspaceTitle="Workspace Engine"
                workspaceId={workspaceId}
                conceptId={selectedConcept.id}
                conceptTitle={selectedConcept.title}
                status={selectedConcept.status}
                onClose={() => setSelectedConcept(null)}
                onProgressUpdated={handleProgressUpdated}
              />
            </ErrorBoundary>
          </div>
        )}
      </div>
    </div>
  );
}
