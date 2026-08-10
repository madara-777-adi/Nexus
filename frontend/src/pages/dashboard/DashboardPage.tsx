import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

  // Fetch workspaces on component mount
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await workspaceApi.getAllWorkspaces();
        setWorkspaces(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load workspaces.");
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
    e.stopPropagation(); // Prevent card click / navigation
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
    } catch (err: any) {
      setDeleteError(
        err.response?.data?.message || "Failed to delete workspace.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-midnight text-white flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-surface-border bg-[#0d1117]/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-neovision text-neon-lime text-xl tracking-wider uppercase font-bold">
            NexusSpace
          </span>
        </div>

        {/* Account Dropdown Menu */}
        <UserDropdown />
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 flex flex-col gap-8">
        {/* Welcome Section & CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-border/50">
          <div className="w-full sm:w-auto">
            <h1 className="font-neovision text-2xl md:text-3xl text-white tracking-wide">
              WORKSPACES
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Select or create a workspace to manage your knowledge nodes.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto bg-neon-lime text-midnight font-bold text-xs uppercase tracking-wider px-5 py-3 min-h-[44px] rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-neon-lime/10"
          >
            <span>+</span> New Workspace
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/20 text-red-400 border border-red-500/30 p-4 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Loading State Skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-[#0d1117] border border-surface-border/50 rounded-2xl p-5 animate-pulse flex flex-col gap-3 h-40"
              >
                <div className="h-5 bg-surface-border/40 rounded w-1/2"></div>
                <div className="h-4 bg-surface-border/20 rounded w-3/4"></div>
                <div className="mt-auto h-3 bg-surface-border/30 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          /* Empty State */
          <div className="bg-[#0d1117] border border-dashed border-surface-border rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full bg-surface-border/30 flex items-center justify-center text-neon-lime text-xl">
              📂
            </div>
            <div>
              <h3 className="text-white text-base font-semibold">
                No Workspaces Found
              </h3>
              <p className="text-gray-400 text-xs mt-1 max-w-sm">
                You haven't created any workspaces yet. Click below to start
                building your knowledge base.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-2 bg-neon-lime text-midnight font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
            >
              Create Workspace
            </button>
          </div>
        ) : (
          /* Workspace Cards Grid */
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {workspaces.map((ws) => (
              <div
                key={ws.workspaceId}
                onClick={() => navigate(`/workspace/${ws.workspaceId}`)}
                className="group bg-[#0d1117] border border-surface-border hover:border-neon-lime/60 rounded-2xl p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-xl hover:shadow-neon-lime/5 relative"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-white font-bold text-base group-hover:text-neon-lime transition-colors line-clamp-1 pr-6">
                      {ws.title}
                    </h3>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                          ws.visibility === "PUBLIC"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                            : "bg-surface-border/50 text-gray-400 border-surface-border"
                        }`}
                      >
                        {ws.visibility}
                      </span>

                      {/* Delete Button */}
                      <button
                        onClick={(e) =>
                          handleDeleteClick(e, ws.workspaceId, ws.title)
                        }
                        disabled={deletingId === ws.workspaceId}
                        className="text-gray-500 hover:text-red-400 min-h-[44px] min-w-[44px] p-2 rounded-lg border border-transparent hover:border-red-500/30 hover:bg-red-500/10 transition-all cursor-pointer disabled:opacity-50"
                        title="Delete Workspace"
                      >
                        {deletingId === ws.workspaceId ? (
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-400 border-t-transparent inline-block" />
                        ) : (
                          "🗑️"
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
          <div className="bg-[#0d1117] border border-surface-border rounded-2xl max-w-md w-full p-6 flex flex-col gap-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Delete Workspace?</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="text-neon-lime font-semibold">
                "{deleteTarget.title}"
              </span>
              ? This action cannot be undone and will permanently remove all
              associated knowledge nodes.
            </p>
            {deleteError && (
              <div className="bg-red-500/20 text-red-400 border border-red-500/30 p-3 rounded-xl text-xs">
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
                className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
