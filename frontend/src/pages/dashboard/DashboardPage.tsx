import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import {
  Plus,
  Trash2,
  Layers,
  AlertTriangle,
  Search,
  ArrowRight,
  BookOpen,
  Calendar,
} from "lucide-react";
import { workspaceApi } from "../../api/workspace.api";
import { CreateWorkspaceModal } from "../../components/workspace/CreateWorkspaceModal";
import { UserDropdown } from "../../components/layout/UserDropdown";
import type { IWorkspace } from "../../types/workspace.types";

const CORE_CSE_CONCEPTS = [
  "Red-Black Tree",
  "Dijkstra O(E log V)",
  "Dynamic Programming",
  "Topological Sort",
  "B+ Tree Index",
  "Trie Node",
  "Disjoint Set Union",
  "Min-Heap Priority",
  "QuickSelect",
  "A* Heuristic",
  "Segment Tree",
  "Suffix Automaton",
  "Floyd-Warshall",
  "AVL Rotation",
  "Bloom Filter",
  "Mutex Lock",
  "Semaphore",
  "Context Switch",
  "Virtual Memory Paging",
  "TLB Cache Miss",
  "Deadlock Graph",
  "Ring 0 Kernel",
  "Copy-On-Write",
  "Fork & Exec",
  "Pipelining",
  "Branch Predictor",
  "SIMD",
  "RISC-V",
  "L1 Cache",
  "Raft Consensus",
  "Paxos",
  "Two-Phase Commit",
  "TCP 3-Way Handshake",
  "CAP Theorem",
  "Vector Clocks",
  "Consistent Hashing",
  "Write-Ahead Log",
  "ACID",
  "AST Parser",
  "Mark-and-Sweep GC",
];

interface WordEntity {
  text: string;
  distance: number;
  speed: number;
  fontSize: number;
  opacity: number;
  colorStr: string;
}

interface StreamLane {
  originX: number;
  originY: number;
  angle: number;
  trackLength: number;
  words: WordEntity[];
}

export function Dashboard() {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<IWorkspace[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [error, setError] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // 4-Corner Diagonal Streams Canvas Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lanes: StreamLane[] = [];

    const COLOR_PALETTE = [
      "188, 255, 60", // Neon Lime
      "0, 229, 255", // Cyan
      "168, 85, 247", // Violet
      "52, 211, 153", // Emerald
      "148, 163, 184", // Slate Gray
    ];

    const generateWordEntity = (initialDistance: number): WordEntity => {
      const text =
        CORE_CSE_CONCEPTS[Math.floor(Math.random() * CORE_CSE_CONCEPTS.length)];
      const fontSizes = [11, 12, 13, 14, 16, 18, 20];
      const fontSize = fontSizes[Math.floor(Math.random() * fontSizes.length)];
      const speed = 0.22 + Math.random() * 0.42;
      const opacity = Number((0.08 + Math.random() * 0.26).toFixed(2));
      const colorStr =
        COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];

      return {
        text,
        distance: initialDistance,
        speed,
        fontSize,
        opacity,
        colorStr,
      };
    };

    const initializeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      lanes = [];

      const W = canvas.width;
      const H = canvas.height;

      // 1. TOP-LEFT: Up-Right (↗)
      for (let i = 0; i < 4; i++) {
        const laneOffset = i * 85;
        const trackLength = Math.hypot(W * 0.6, H * 0.6);
        lanes.push({
          originX: -80 + i * 40,
          originY: H * 0.45 - laneOffset,
          angle: -0.58,
          trackLength,
          words: [
            generateWordEntity(0),
            generateWordEntity(trackLength * 0.45),
          ],
        });
      }

      // 2. BOTTOM-LEFT: Up-Right (↗)
      for (let i = 0; i < 4; i++) {
        const laneOffset = i * 90;
        const trackLength = Math.hypot(W * 0.6, H * 0.65);
        lanes.push({
          originX: -70 + i * 45,
          originY: H + 30 - laneOffset,
          angle: -0.68,
          trackLength,
          words: [
            generateWordEntity(trackLength * 0.15),
            generateWordEntity(trackLength * 0.58),
          ],
        });
      }

      // 3. TOP-RIGHT: Down-Right (↘)
      for (let i = 0; i < 4; i++) {
        const laneOffset = i * 90;
        const trackLength = Math.hypot(W * 0.6, H * 0.6);
        lanes.push({
          originX: W * 0.52 + laneOffset,
          originY: -50 + (i % 2) * 35,
          angle: 0.65,
          trackLength,
          words: [
            generateWordEntity(trackLength * 0.05),
            generateWordEntity(trackLength * 0.52),
          ],
        });
      }

      // 4. BOTTOM-RIGHT: Down-Left (↙)
      for (let i = 0; i < 4; i++) {
        const laneOffset = i * 85;
        const trackLength = Math.hypot(W * 0.55, H * 0.55);
        lanes.push({
          originX: W + 60 - (i % 2) * 30,
          originY: H * 0.48 + laneOffset,
          angle: 2.52,
          trackLength,
          words: [
            generateWordEntity(trackLength * 0.2),
            generateWordEntity(trackLength * 0.62),
          ],
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      lanes.forEach((lane) => {
        const cosA = Math.cos(lane.angle);
        const sinA = Math.sin(lane.angle);

        lane.words.forEach((word) => {
          word.distance += word.speed;

          if (word.distance > lane.trackLength) {
            word.distance = -90;
            const fresh = generateWordEntity(0);
            word.text = fresh.text;
            word.fontSize = fresh.fontSize;
            word.opacity = fresh.opacity;
            word.speed = fresh.speed;
            word.colorStr = fresh.colorStr;
          }

          const currentX = lane.originX + cosA * word.distance;
          const currentY = lane.originY + sinA * word.distance;

          ctx.save();
          ctx.translate(currentX, currentY);
          ctx.rotate(lane.angle);

          ctx.font = `bold ${word.fontSize}px monospace`;
          ctx.fillStyle = `rgba(${word.colorStr}, ${word.opacity})`;
          ctx.fillText(word.text, 0, 0);

          ctx.restore();
        });
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("resize", initializeCanvas);
    initializeCanvas();
    animate();

    return () => {
      window.removeEventListener("resize", initializeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
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

  const filteredWorkspaces = useMemo(() => {
    if (!searchQuery.trim()) return workspaces;
    const q = searchQuery.toLowerCase();
    return workspaces.filter(
      (ws) =>
        ws.title.toLowerCase().includes(q) ||
        (ws.description && ws.description.toLowerCase().includes(q)),
    );
  }, [workspaces, searchQuery]);

  return (
    <div className="min-h-screen bg-[#080A0F] text-white flex flex-col relative selection:bg-neon-lime selection:text-midnight overflow-x-hidden font-sans">
      {/* 4-Corner Diagonal Vector Streams Background Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0 opacity-90"
      />

      {/* Persistent Navigation Bar */}
      <header className="border-b border-[#1E2846] bg-[#0d1117]/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-neovision text-neon-lime text-xl tracking-wider uppercase font-bold">
            NexusSpace
          </span>
          <span className="px-2 py-0.5 rounded bg-surface-border text-[10px] font-mono text-gray-400 uppercase hidden sm:inline-block">
            Tier 1 • Dashboard
          </span>
        </div>

        {/* User Dropdown */}
        <UserDropdown />
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col gap-6 sm:gap-8 relative z-10">
        {/* Title Header & Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1E2846]/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#00E5FF]">
                Interactive Command Center
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-neon-lime">
                <span className="w-1.5 h-1.5 rounded-full bg-neon-lime animate-pulse"></span>
                AI Graph Connected
              </span>
            </div>
            <h1 className="font-neovision text-2xl md:text-3xl text-white tracking-wide">
              SKILLS &amp; WORKSPACES
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 max-w-xl">
              Manage your technical learning tracks. Launch an existing
              blueprint to explore module pathways or initialize a new track
              with AI.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#121620]/80 backdrop-blur-xl border border-[#1E2846] px-3.5 py-2 rounded-xl text-xs font-mono">
              <BookOpen className="w-4 h-4 text-[#00E5FF]" />
              <div className="text-[10px] text-gray-400 uppercase">
                Blueprints:{" "}
                <span className="font-bold text-white text-xs">
                  {workspaces.length}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-neon-lime text-midnight font-bold text-xs uppercase tracking-wider px-5 py-3 min-h-[44px] rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-neon-lime/10"
            >
              <Plus className="w-4 h-4" />
              <span>New Skill Blueprint</span>
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div
            role="alert"
            className="bg-red-500/20 text-red-400 border border-red-500/30 p-4 rounded-xl text-xs font-semibold backdrop-blur-md"
          >
            {error}
          </div>
        )}

        {/* Search Input Filter */}
        {workspaces.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search skill tracks, technologies..."
                className="w-full glass-input bg-[#080A0F]/80 backdrop-blur-xl rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-all"
              />
            </div>
            <span className="text-xs font-mono text-slate-500">
              Showing {filteredWorkspaces.length} of {workspaces.length} Tracks
            </span>
          </div>
        )}

        {/* Loading State Skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-[#121620]/80 backdrop-blur-xl border border-[#1E2846] rounded-2xl p-5 animate-pulse flex flex-col gap-3 h-48"
              >
                <div className="h-5 bg-[#1E2846]/60 rounded w-1/2"></div>
                <div className="h-4 bg-[#1E2846]/30 rounded w-3/4"></div>
                <div className="mt-auto h-3 bg-[#1E2846]/40 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          /* Empty State */
          <div className="bg-[#121620]/80 backdrop-blur-xl border border-dashed border-[#1E2846] rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#1E2846]/40 flex items-center justify-center text-neon-lime text-xl">
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
            {filteredWorkspaces.map((ws) => (
              <div
                key={ws.workspaceId}
                onClick={() => navigate(`/workspace/${ws.workspaceId}`)}
                className="group bg-[#121620]/80 backdrop-blur-xl border border-[#1E2846] hover:border-neon-lime/60 rounded-2xl p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-xl hover:shadow-neon-lime/5 relative"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center text-xs font-mono font-bold border border-[#00E5FF]/20">
                        <BookOpen className="w-3.5 h-3.5" />
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#080A0F] border border-[#1E2846] text-[10px] font-mono text-[#00E5FF] uppercase font-semibold">
                        Tier 1 Blueprint
                      </span>
                    </div>

                    <button
                      onClick={(e) =>
                        handleDeleteClick(e, ws.workspaceId, ws.title)
                      }
                      disabled={deletingId === ws.workspaceId}
                      className="text-gray-500 hover:text-red-400 min-h-[32px] min-w-[32px] p-1.5 rounded-lg border border-transparent hover:border-red-500/30 hover:bg-red-500/10 transition-all cursor-pointer disabled:opacity-50"
                      title="Delete Workspace"
                    >
                      {deletingId === ws.workspaceId ? (
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-400 border-t-transparent inline-block" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <h3 className="text-white font-bold text-base group-hover:text-neon-lime transition-colors line-clamp-1 mt-1">
                    {ws.title}
                  </h3>
                  <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed">
                    {ws.description || "No description provided."}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-[#1E2846]/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-gray-500 font-mono text-[11px]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {new Date(ws.createdAt).toLocaleDateString(undefined, {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-neon-lime font-semibold text-xs group-hover:translate-x-1 transition-transform">
                    <span>Launch Blueprint</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}

            {/* Quick Add Blueprint Card */}
            <div
              onClick={() => setIsModalOpen(true)}
              className="bg-[#121620]/50 backdrop-blur-xl border border-dashed border-[#1E2846] hover:border-[#00E5FF]/60 rounded-2xl p-5 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center gap-2 min-h-[160px] hover:bg-[#00E5FF]/5 group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF] group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-white group-hover:text-[#00E5FF] transition-colors mt-1">
                Create New Blueprint
              </h4>
              <p className="text-[11px] text-gray-500 max-w-[180px]">
                Synthesize a new knowledge path from any topic
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121620] border border-[#1E2846] rounded-2xl max-w-md w-full p-6 flex flex-col gap-4 shadow-2xl modal-enter">
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
