import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { WorkspaceGraph } from "../../components/workspace/WorkspaceGraph";
import { TeacherStudio } from "../../components/workspace/TeacherStudio";
import { initializeWorkspaceProgress } from "../../api/learning.api";
import { ConceptStatus } from "../../types/learning.types";

export function WorkspacePage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();

  const [selectedConcept, setSelectedConcept] = useState<{
    id: string;
    title: string;
    status: ConceptStatus;
  } | null>(null);

  const [graphRefreshKey, setGraphRefreshKey] = useState<number>(0);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Initialize learning state when entering a workspace
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
    []
  );

  const handleProgressUpdated = useCallback(() => {
    // Trigger graph state refresh when a quiz evaluation completes
    setGraphRefreshKey((prev) => prev + 1);
  }, []);

  if (!workspaceId) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#080A0F] text-slate-400">
        Workspace ID not found.
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#080A0F]">
      {/* Navigation Header overlay */}
      <header className="absolute top-4 left-4 z-10 flex items-center gap-3 rounded-xl border border-slate-800 bg-[#0F131C]/90 p-3 backdrop-blur-md">
        <button
          onClick={() => navigate("/dashboard")}
          className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-slate-700 hover:text-white"
        >
          ← Dashboard
        </button>
        <div className="h-4 w-px bg-slate-800" />
        <span className="text-xs font-mono font-medium text-slate-400">
          NexusSpace Graph Workspace
        </span>
      </header>

      {/* Main Container */}
      <div className="flex h-full w-full">
        {/* Graph Canvas */}
        <div
          className={`h-full transition-all duration-300 ${
            selectedConcept ? "w-1/2 lg:w-3/5" : "w-full"
          }`}
        >
          {isInitializing ? (
            <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
              Initializing knowledge graph state...
            </div>
          ) : (
            <WorkspaceGraph
              key={`${workspaceId}_${graphRefreshKey}`}
              workspaceId={workspaceId}
              onSelectConcept={handleSelectConcept}
            />
          )}
        </div>

        {/* Sliding AI Teacher Panel */}
        {selectedConcept && (
          <div className="h-full w-1/2 lg:w-2/5 animate-in slide-in-from-right duration-300">
            <TeacherStudio
              workspaceTitle="Workspace Engine"
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