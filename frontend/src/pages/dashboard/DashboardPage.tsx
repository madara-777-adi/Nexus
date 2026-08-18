import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { Plus, Trash2, Layers, AlertTriangle } from "lucide-react";
import { workspaceApi } from "../../api/workspace.api";
import { CreateWorkspaceModal } from "../../components/workspace/CreateWorkspaceModal";
import { UserDropdown } from "../../components/layout/UserDropdown";
import type { IWorkspace } from "../../types/workspace.types";

export function Dashboard() {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<IWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await workspaceApi.getAllWorkspaces();
        setWorkspaces(response.data);
      } catch (err: unknown) {
        if (isAxiosError(err)) {
          setError(err.response?.data?.message || "Failed to load workspaces.");
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load workspaces.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchWorkspaces();
  }, []);

  const handleWorkspaceCreated = (newWorkspace: IWorkspace) => {
    setWorkspaces((prev) => [newWorkspace, ...prev]);
  };

  const handleDeleteClick = (
    e: React.MouseEvent,
    workspaceId: string,
    title: string,
  ) => {
    e.stopPropagation(); // Prevent card navigation
    setDeleteError("");
    setDeleteTarget({ id: workspaceId, title });
  };

  const confirmDeleteWorkspace = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    setDeleteError("");
    try {
      await workspaceApi.deleteWorkspace(deleteTarget.id);
      setWorkspaces((prev) =>
        prev.filter((ws) => ws.workspaceId !== deleteTarget.id),
      );
      setDeleteTarget(null);
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        setDeleteError(
          err.response?.data?.message || "Failed to delete workspace.",
        );
      } else if (err instanceof Error) {
        setDeleteError(err.message);
      } else {
        setDeleteError("Failed to delete workspace.");
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-midnight text-white flex flex-col selection:bg-neon-lime selection:text-midnight">
      {/* Top Sticky Navigation Bar */}
      <header className="border-b border-surface-border bg-[#0d1117]/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-neovision text-neon-lime text-xl tracking-wider uppercase font-bold">
            NexusSpace
          </span>
          <span className="px-2 py-0.5 rounded bg-surface-border text-[10px] font-mono text-gray-400 uppercase hidden sm:inline-block">
            Tier 1 • Skills
          </span>
        </div>

        {/* User Dropdown */}
        <UserDropdown />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col gap-6 sm:gap-8">
        {/* Welcome Section & CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-border/50">
          <div className="w-full sm:w-auto">
            <h1 className="font-neovision text-2xl md:text-3xl text-white tracking-wide">
              SKILLS &amp; WORKSPACES
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Select a skill blueprint to open its modules, or create a new
              workspace.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto bg-neon-lime text-midnight font-bold text-xs uppercase tracking-wider px-5 py-3 min-h-[44px] rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-neon-lime/10"
          >
            <Plus className="w-4 h-4" />
            <span>New Skill Blueprint</span>
          </button>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div
            role="alert"
            className="bg-red-500/20 text-red-400 border border-red-500/30 p-4 rounded-xl text-xs font-semibold"
          >
            {error}
          </div>
        )}

        {/* Loading State Skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-[#0d1117] border border-surface-border/50 rounded-2xl p-5 animate-pulse flex flex-col gap-3 h-44"
              >
                <div className="h-5 bg-surface-border/40 rounded w-1/2"></div>
                <div className="h-4 bg-surface-border/20 rounded w-3/4"></div>
                <div className="mt-auto h-3 bg-surface-border/30 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          /* Empty State */
          <div className="bg-[#0d1117] border border-dashed border-surface-border rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-surface-border/30 flex items-center justify-center text-neon-lime text-xl">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-white text-base font-semibold">
                No Skill Blueprints Found
              </h3>
              <p className="text-gray-400 text-xs mt-1 max-w-sm">
                You haven't created any skill workspaces yet. Click below to
                start building your knowledge paths.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-2 bg-neon-lime text-midnight font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
            >
              Create Blueprint
            </button>
          </div>
        ) : (
          /* Workspaces Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {workspaces.map((ws) => (
              <div
                key={ws.workspaceId}
                onClick={() => navigate(`/workspace/${ws.workspaceId}`)}
                className="group bg-[#0d1117] border border-surface-border hover:border-neon-lime/60 rounded-2xl p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-xl hover:shadow-neon-lime/5 relative"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-white font-bold text-base group-hover:text-neon-lime transition-colors line-clamp-1 pr-4">
                      {ws.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) =>
                          handleDeleteClick(e, ws.workspaceId, ws.title)
                        }
                        disabled={deletingId === ws.workspaceId}
                        className="text-gray-500 hover:text-red-400 min-h-[36px] min-w-[36px] p-2 rounded-lg border border-transparent hover:border-red-500/30 hover:bg-red-500/10 transition-all cursor-pointer disabled:opacity-50"
                        title="Delete Workspace"
                      >
                        {deletingId === ws.workspaceId ? (
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-400 border-t-transparent inline-block" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed">
                    {ws.description || "No description provided."}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-surface-border/40 flex items-center justify-between text-[11px] text-gray-500">
                  <span className="font-mono text-[10px]">
                    {ws.workspaceId}
                  </span>
                  <span>{new Date(ws.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d1117] border border-surface-border rounded-2xl max-w-md w-full p-6 flex flex-col gap-4 shadow-2xl modal-enter">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-lg font-bold text-white">
                Delete Workspace?
              </h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="text-neon-lime font-semibold">
                "{deleteTarget.title}"
              </span>
              ? This action cannot be undone and will permanently remove all
              associated knowledge nodes and lesson progress.
            </p>
            {deleteError && (
              <div className="bg-red-500/20 text-red-400 border border-red-500/30 p-3 rounded-xl text-xs font-semibold">
                {deleteError}
              </div>
            )}
            <div className="flex items-center justify-end gap-3 mt-2">
              <button
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError("");
                }}
                className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteWorkspace}
                disabled={deletingId === deleteTarget.id}
                className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deletingId === deleteTarget.id ? (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent inline-block" />
                    Deleting...
                  </>
                ) : (
                  "Delete Workspace"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onWorkspaceCreated={handleWorkspaceCreated}
      />
    </div>
  );
}
