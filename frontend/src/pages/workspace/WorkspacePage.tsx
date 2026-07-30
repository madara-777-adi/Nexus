import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TopicPathView } from "../../components/workspace/TopicPathView";
import { TeacherStudio } from "../../components/workspace/TeacherStudio";
import { ErrorBoundary } from "../../components/common/ErrorBoundary";
import { initializeWorkspaceProgress } from "../../api/learning.api";
import { planNextPath } from "../../api/ai.api";
import { ConceptStatus } from "../../types/learning.types";
import { Sparkles, ArrowLeft, Compass } from "lucide-react";

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
  const [toasts, setToasts] = useState<Toast[]>([]);

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
          `Next path: "${plan.recommendedNodeTitle || "Module"}"`,
          "success",
        );
      } else {
        showToast(
          "You've mastered all current modules in this workspace!",
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
            selectedConcept ? "w-1/2 lg:w-3/5" : "w-full"
          }`}
        >
          {isInitializing ? (
            <div className="flex h-full w-full items-center justify-center text-xs font-mono text-gray-500 gap-3">
              <Sparkles className="h-4 w-4 animate-spin text-[#BCFF3C]" />
              <span>Initializing Learning OS...</span>
            </div>
          ) : (
            <ErrorBoundary
              key={`${workspaceId}_${refreshKey}`}
              fallbackTitle="Workspace execution error"
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
              fallbackTitle="Could not load studio view"
            >
              <TeacherStudio
                workspaceTitle="Mission Control"
                workspaceId={workspaceId}
                conceptId={selectedConcept.id}
                conceptTitle={selectedConcept.title}
                status={selectedConcept.status}
                onClose={() => setSelectedConcept(null)}
                onProgressUpdated={() => setRefreshKey((prev) => prev + 1)}
              />
            </ErrorBoundary>
          </div>
        )}
      </div>
    </div>
  );
}
