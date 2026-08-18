import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import {
  Plus,
  Trash2,
  Layers,
  AlertTriangle,
  Quote,
  Sparkles,
  Terminal,
} from "lucide-react";
import { workspaceApi } from "../../api/workspace.api";
import { CreateWorkspaceModal } from "../../components/workspace/CreateWorkspaceModal";
import { UserDropdown } from "../../components/layout/UserDropdown";
import type { IWorkspace } from "../../types/workspace.types";

// Curated pool of foundational Computer Science wisdom
const CS_QUOTES = [
  {
    quote:
      "There are only two hard things in Computer Science: cache invalidation and naming things.",
    author: "Phil Karlton",
    field: "Systems Architecture",
  },
  {
    quote: "Simplicity is prerequisite for reliability.",
    author: "Edsger W. Dijkstra",
    field: "Algorithms & Verification",
  },
  {
    quote: "Premature optimization is the root of all evil.",
    author: "Donald Knuth",
    field: "Analysis of Algorithms",
  },
  {
    quote: "Talk is cheap. Show me the code.",
    author: "Linus Torvalds",
    field: "Kernel & OS Design",
  },
  {
    quote:
      "Programs must be written for people to read, and only incidentally for machines to execute.",
    author: "Harold Abelson",
    field: "Structure and Interpretation",
  },
  {
    quote: "Make it work, make it right, make it fast.",
    author: "Kent Beck",
    field: "Software Engineering",
  },
  {
    quote:
      "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.",
    author: "Martin Fowler",
    field: "Refactoring & Design",
  },
  {
    quote:
      "The function of good software is to make the complex appear to be simple.",
    author: "Grady Booch",
    field: "Object-Oriented Design",
  },
  {
    quote: "First, solve the problem. Then, write the code.",
    author: "John Johnson",
    field: "Problem Solving",
  },
];

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

  // Daily Quote Rotation Logic (Day-of-year calculation)
  const dailyQuote = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    return CS_QUOTES[dayOfYear % CS_QUOTES.length];
  }, []);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await workspaceApi.getAllWorkspaces();
        setWorkspaces(response.data || []);
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
    e.stopPropagation();
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
    <div className="min-h-screen bg-[#080A0F] text-white flex flex-col selection:bg-[#BCFF3C] selection:text-[#080A0F] relative overflow-x-hidden">
      {/* Rich Atmospheric Background Gradient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Top-Center Cyan Ambient Glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-[#00E5FF]/10 rounded-full blur-[140px]"></div>
        {/* Bottom-Left Neon Lime Ambient Glow */}
        <div className="absolute -bottom-24 -left-20 w-[550px] h-[400px] bg-[#BCFF3C]/8 rounded-full blur-[130px]"></div>
        {/* Bottom-Right Electric Violet Ambient Glow */}
        <div className="absolute top-1/2 -right-24 w-[500px] h-[450px] bg-purple-600/8 rounded-full blur-[150px]"></div>
      </div>

      {/* Top Sticky Navigation Bar[cite: 1] */}
      <header className="bg-transparent sticky top-0 z-40 px-6 sm:px-10 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-neovision text-[#BCFF3C] text-xl tracking-wider uppercase font-bold">
            NexusSpace
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-[#121620] border border-[#1E2846] text-[10px] font-mono text-gray-400 uppercase hidden sm:inline-block">
            Tier 1 • Skills
          </span>
        </div>
        {/* User Dropdown */}
        <UserDropdown />
      </header>

      {/* Main Dual-Column Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 sm:px-10 py-10 sm:py-12 flex flex-col lg:flex-row gap-8 lg:gap-10 items-stretch relative z-10">
        {/* LEFT COLUMN: Vertical CS Wisdom Quote Card */}
        <aside className="w-full lg:w-[340px] xl:w-[360px] shrink-0 bg-[#0d1117]/90 backdrop-blur-xl border border-[#1E2846] rounded-3xl p-7 sm:p-8 flex flex-col justify-between gap-8 shadow-2xl relative overflow-hidden min-h-[380px] lg:min-h-[440px]">
          {/* Subtle Accent Glow Inside Card */}
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#00E5FF]/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#1E2846]/80 pb-4">
              <div className="flex items-center gap-2.5">
                <Terminal className="w-4 h-4 text-[#00E5FF]" />
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#00E5FF]">
                  CS Wisdom
                </span>
              </div>
              <Quote className="w-4 h-4 text-gray-600" />
            </div>

            <div className="space-y-4">
              <p className="text-sm sm:text-base text-gray-200 leading-relaxed font-sans italic">
                "{dailyQuote.quote}"
              </p>
              <div className="pt-2">
                <p className="text-sm font-bold text-white tracking-tight">
                  — {dailyQuote.author}
                </p>
                <p className="text-xs font-mono text-[#00E5FF]/80 mt-1">
                  {dailyQuote.field}
                </p>
              </div>
            </div>
          </div>

          {/* Blueprint Counter Footer */}
          <div className="pt-5 border-t border-[#1E2846]/80 flex items-center justify-between text-xs font-mono text-gray-400">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#BCFF3C] animate-pulse"></span>
              <span className="text-gray-300 font-semibold">
                {workspaces.length}
              </span>{" "}
              {workspaces.length === 1 ? "Blueprint" : "Blueprints"}
            </span>
            <span className="text-[11px] text-gray-500 font-medium">
              Tier 1 Active
            </span>
          </div>
        </aside>

        {/* RIGHT COLUMN: Action Banner + Workspaces Grid */}
        <section className="flex-1 w-full flex flex-col gap-8">
          {/* Top Add Skill Banner */}
          <div className="bg-[#0d1117]/90 backdrop-blur-xl border border-[#1E2846] rounded-3xl p-7 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#BCFF3C]" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#BCFF3C] font-semibold">
                  Skill Management
                </span>
              </div>
              <h1 className="font-neovision text-2xl sm:text-3xl text-white tracking-wide">
                SKILLS &amp; WORKSPACES
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Select an existing skill blueprint or spawn a new knowledge
                workspace.
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#BCFF3C] hover:bg-[#aef525] text-[#080A0F] font-bold text-xs uppercase tracking-wider px-6 py-3.5 min-h-[48px] rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#BCFF3C]/15 hover:scale-[1.02] shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Skill Blueprint</span>
            </button>
          </div>

          {/* Global Error Banner */}
          {error && (
            <div
              role="alert"
              className="bg-red-500/20 text-red-400 border border-red-500/30 p-5 rounded-2xl text-xs font-semibold backdrop-blur-md"
            >
              {error}
            </div>
          )}

          {/* Workspaces Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-[#0d1117]/80 backdrop-blur-xl border border-[#1E2846] rounded-3xl p-7 animate-pulse flex flex-col justify-between h-52"
                >
                  <div className="space-y-3">
                    <div className="h-5 bg-[#1E2846]/60 rounded-lg w-1/2"></div>
                    <div className="h-4 bg-[#1E2846]/30 rounded-lg w-3/4"></div>
                  </div>
                  <div className="h-3 bg-[#1E2846]/40 rounded-lg w-1/3 mt-6"></div>
                </div>
              ))}
            </div>
          ) : workspaces.length === 0 ? (
            /* Empty State */
            <div className="bg-[#0d1117]/80 backdrop-blur-xl border border-dashed border-[#1E2846] rounded-3xl p-10 sm:p-14 text-center flex flex-col items-center justify-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#1E2846]/40 flex items-center justify-center text-[#BCFF3C] text-xl shadow-inner">
                <Layers className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-white text-lg font-bold">
                  No Skill Blueprints Found
                </h3>
                <p className="text-gray-400 text-xs sm:text-sm max-w-sm leading-relaxed">
                  You haven't created any skill workspaces yet. Click the button
                  above to build your first track.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-3 bg-[#BCFF3C] text-[#080A0F] font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl hover:opacity-90 transition-opacity cursor-pointer shadow-md shadow-[#BCFF3C]/10"
              >
                Create First Blueprint
              </button>
            </div>
          ) : (
            /* Cards Grid with Electric Cyan Glow on Hover */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {workspaces.map((ws) => (
                <div
                  key={ws.workspaceId}
                  onClick={() => navigate(`/workspace/${ws.workspaceId}`)}
                  className="group bg-[#0d1117]/90 backdrop-blur-xl border border-[#1E2846] hover:border-[#00E5FF] rounded-3xl p-7 transition-all duration-300 cursor-pointer flex flex-col justify-between hover:shadow-[0_0_30px_rgba(0,229,255,0.18)] hover:-translate-y-1 min-h-[220px] relative"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-white font-bold text-base sm:text-lg group-hover:text-[#00E5FF] transition-colors line-clamp-1 pr-2">
                        {ws.title}
                      </h3>
                      <button
                        onClick={(e) =>
                          handleDeleteClick(e, ws.workspaceId, ws.title)
                        }
                        disabled={deletingId === ws.workspaceId}
                        className="text-gray-500 hover:text-red-400 min-h-[36px] min-w-[36px] p-2 rounded-xl border border-transparent hover:border-red-500/30 hover:bg-red-500/10 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                        title="Delete Workspace"
                      >
                        {deletingId === ws.workspaceId ? (
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-400 border-t-transparent inline-block" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-gray-400 text-xs sm:text-sm line-clamp-2 leading-relaxed">
                      {ws.description ||
                        "Interactive modular curriculum and knowledge track."}
                    </p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-[#1E2846]/80 flex items-center justify-between text-xs text-gray-500">
                    <span className="font-mono text-[11px] text-slate-400">
                      {ws.workspaceId}
                    </span>
                    <span className="font-mono text-[11px]">
                      {new Date(ws.createdAt).toLocaleDateString("en-US", {
                        month: "numeric",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0d1117] border border-[#1E2846] rounded-3xl max-w-md w-full p-7 flex flex-col gap-5 shadow-2xl modal-enter">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-5 h-5 shrink-0" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Delete Workspace?
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="text-[#BCFF3C] font-semibold">
                "{deleteTarget.title}"
              </span>
              ? This action cannot be undone and will permanently remove all
              associated knowledge nodes and lesson progress.
            </p>
            {deleteError && (
              <div className="bg-red-500/20 text-red-400 border border-red-500/30 p-4 rounded-xl text-xs font-semibold">
                {deleteError}
              </div>
            )}
            <div className="flex items-center justify-end gap-3 mt-2 pt-2">
              <button
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError("");
                }}
                className="px-5 py-2.5 text-xs font-semibold text-gray-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteWorkspace}
                disabled={deletingId === deleteTarget.id}
                className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-red-500/20"
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
