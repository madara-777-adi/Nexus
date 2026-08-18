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

// Deep Core Computer Science Concepts
const CORE_CSE_CONCEPTS = [
  // Data Structures & Algorithms
  "Red-Black Tree",
  "Dijkstra O(E log V)",
  "Dynamic Programming",
  "Topological Sort",
  "B+ Tree Index",
  "Trie Node",
  "Disjoint Set Union",
  "Min-Heap Priority",
  "QuickSelect",
  "A* Heuristic Search",
  "Segment Tree",
  "Suffix Automaton",
  "Floyd-Warshall",
  "AVL Tree Rotation",
  "Bloom Filter",
  "Convex Hull",

  // Operating Systems & Low-Level
  "Mutex Lock",
  "Semaphore Barrier",
  "Context Switch",
  "Virtual Memory Paging",
  "TLB Cache Miss",
  "Deadlock Graph",
  "IPC Ring Buffer",
  "Thread Preemption",
  "DMA Controller",
  "Kernel Space Ring 0",
  "Copy-On-Write",
  "Fork & Exec",

  // Computer Architecture
  "Instruction Pipelining",
  "Branch Predictor",
  "SIMD Vectorization",
  "RISC-V Microarchitecture",
  "L1 Cache Line",
  "Out-of-Order Execution",
  "Register Renaming",
  "Memory Bus Arbitration",

  // Distributed Systems & Networking
  "Paxos Consensus",
  "Raft State Machine",
  "Two-Phase Commit",
  "TCP 3-Way Handshake",
  "BGP Routing Table",
  "CAP Theorem",
  "Vector Clocks",
  "Gossip Protocol",
  "Quorum Read/Write",
  "Consistent Hashing",
  "Zero-Copy Socket",

  // Database Internals & Compilers
  "Write-Ahead Log (WAL)",
  "ACID Serializability",
  "Abstract Syntax Tree (AST)",
  "SSA Intermediate Rep",
  "Mark-and-Sweep GC",
  "LL(1) Parser",
  "Query Optimization",
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

  // 4-Corner Diagonal Streams Canvas Engine with Multi-Attribute Variations
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lanes: StreamLane[] = [];

    const COLOR_PALETTE = [
      "188, 255, 60", // Neon Lime
      "0, 229, 255", // Cyan
      "168, 85, 247", // Electric Violet
      "52, 211, 153", // Emerald
      "148, 163, 184", // Slate Gray
      "244, 114, 182", // Rose
    ];

    const generateWordEntity = (initialDistance: number): WordEntity => {
      const text =
        CORE_CSE_CONCEPTS[Math.floor(Math.random() * CORE_CSE_CONCEPTS.length)];
      // Font size variations: 10px up to 21px
      const fontSizes = [10, 11, 12, 13, 14, 16, 18, 20];
      const fontSize = fontSizes[Math.floor(Math.random() * fontSizes.length)];

      // Speed variations: Some slow and ambient, some swift
      const speed = 0.22 + Math.random() * 0.45;

      // Visibility variations: From deep ambient (0.08) to crisp neon (0.34)
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

      // 1. TOP-LEFT CORNER: Up-Right Trajectories (↗)
      const tlLaneCount = 4;
      for (let i = 0; i < tlLaneCount; i++) {
        const laneOffset = i * 85;
        const trackLength = Math.hypot(W * 0.6, H * 0.6);
        lanes.push({
          originX: -80 + i * 40,
          originY: H * 0.45 - laneOffset,
          angle: -0.58,
          trackLength,
          words: [
            generateWordEntity(0),
            generateWordEntity(trackLength * 0.42),
          ],
        });
      }

      // 2. BOTTOM-LEFT CORNER: Up-Right Trajectories (↗)
      const blLaneCount = 4;
      for (let i = 0; i < blLaneCount; i++) {
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

      // 3. TOP-RIGHT CORNER: Down-Right Trajectories (↘)
      const trLaneCount = 4;
      for (let i = 0; i < trLaneCount; i++) {
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

      // 4. BOTTOM-RIGHT CORNER: Down-Left Trajectories (↙)
      const brLaneCount = 4;
      for (let i = 0; i < brLaneCount; i++) {
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

          // Wrap back to beginning of track with a new random CSE concept and properties
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

      {/* Top Persistent Navigation Bar */}
      <header className="border-b border-[#1E2846] bg-[#0d1117]/85 backdrop-blur-xl sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-neovision text-neon-lime text-xl tracking-wider uppercase font-bold">
            NexusSpace
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-[#121620] border border-[#1E2846] text-[10px] font-mono text-slate-400 uppercase hidden sm:inline-block">
            Tier 1 • Skills
          </span>
        </div>

        {/* User Profile Dropdown */}
        <UserDropdown />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 sm:gap-8 relative z-10">
        {/* Header Title Section & Metric Counters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#1E2846]/80">
          <div className="space-y-1.5">
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
            <h1 className="font-neovision text-3xl sm:text-4xl text-white tracking-wide">
              SKILLS &amp; WORKSPACES
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
              Manage your technical learning tracks. Launch an existing
              blueprint to explore module pathways or initialize a new track
              with AI.
            </p>
          </div>

          {/* Quick Metrics & CTA */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="glass-card px-4 py-2.5 rounded-2xl flex items-center gap-3 bg-[#121620]/80 backdrop-blur-xl border border-[#1E2846]">
              <div className="p-2 rounded-xl bg-neon-lime/10 text-neon-lime">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-slate-500 uppercase">
                  Blueprints
                </p>
                <p className="text-sm sm:text-base font-extrabold text-white font-mono">
                  {workspaces.length}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-neon-lime hover:bg-[#aef525] text-midnight font-bold text-xs uppercase tracking-wider px-5 py-3.5 min-h-[44px] rounded-2xl transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(188,255,60,0.25)] hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>New Skill Blueprint</span>
            </button>
          </div>
        </div>

        {/* Global Error Notice */}
        {error && (
          <div
            role="alert"
            className="bg-red-500/10 text-red-400 border border-red-500/30 p-4 rounded-2xl text-xs font-semibold backdrop-blur-md"
          >
            {error}
          </div>
        )}

        {/* Search & Filter Controls */}
        {workspaces.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search skill tracks, technologies..."
                className="w-full glass-input bg-[#080A0F]/80 backdrop-blur-xl rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-all"
              />
            </div>
            <span className="text-xs font-mono text-slate-500">
              Showing {filteredWorkspaces.length} of {workspaces.length} Tracks
            </span>
          </div>
        )}

        {/* Loading State Skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="glass-card bg-[#121620]/80 backdrop-blur-xl border border-[#1E2846] rounded-3xl p-6 animate-pulse flex flex-col justify-between h-56"
              >
                <div className="space-y-3">
                  <div className="h-5 bg-[#1E2846]/60 rounded-lg w-1/2"></div>
                  <div className="h-4 bg-[#1E2846]/40 rounded-lg w-4/5"></div>
                  <div className="h-4 bg-[#1E2846]/30 rounded-lg w-2/3"></div>
                </div>
                <div className="h-4 bg-[#1E2846]/50 rounded-lg w-1/3 mt-6"></div>
              </div>
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          /* Empty State */
          <div className="glass-card bg-[#121620]/80 backdrop-blur-xl border-dashed border-[#1E2846] rounded-3xl p-10 sm:p-16 text-center flex flex-col items-center justify-center gap-4 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-neon-lime/10 border border-neon-lime/30 flex items-center justify-center text-neon-lime shadow-[0_0_20px_rgba(188,255,60,0.15)]">
              <Layers className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-white text-lg font-bold">
                No Skill Blueprints Yet
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm mt-1 leading-relaxed">
                Initialize your first skill blueprint to synthesize multi-tier
                modules, diagnostic tests, and interactive active recall cards.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-2 bg-neon-lime hover:bg-[#aef525] text-midnight font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition cursor-pointer shadow-lg shadow-neon-lime/15"
            >
              Create First Blueprint
            </button>
          </div>
        ) : (
          /* Workspaces Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Real Workspace Cards */}
            {filteredWorkspaces.map((ws) => (
              <div
                key={ws.workspaceId}
                onClick={() => navigate(`/workspace/${ws.workspaceId}`)}
                className="group glass-card bg-[#121620]/80 backdrop-blur-xl border border-[#1E2846] hover:border-neon-lime/60 rounded-3xl p-6 transition-all duration-300 cursor-pointer flex flex-col justify-between hover:shadow-[0_10px_30px_rgba(188,255,60,0.06)] hover:-translate-y-1 relative"
              >
                <div>
                  {/* Card Top Metadata & Delete */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center text-xs font-mono font-bold border border-[#00E5FF]/20">
                        <BookOpen className="w-4 h-4" />
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#121620] border border-[#1E2846] text-[10px] font-mono text-[#00E5FF] uppercase font-semibold">
                        Tier 1 Blueprint
                      </span>
                    </div>

                    <button
                      onClick={(e) =>
                        handleDeleteClick(e, ws.workspaceId, ws.title)
                      }
                      disabled={deletingId === ws.workspaceId}
                      className="text-slate-500 hover:text-red-400 p-2 rounded-xl border border-transparent hover:border-red-500/30 hover:bg-red-500/10 transition-all cursor-pointer disabled:opacity-50"
                      title="Delete Blueprint"
                    >
                      {deletingId === ws.workspaceId ? (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-400 border-t-transparent inline-block" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-neon-lime transition-colors line-clamp-1 mb-2">
                    {ws.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                    {ws.description ||
                      "Interactive structured learning track and modular curriculum."}
                  </p>
                </div>

                {/* Card Bottom Actions & Launch */}
                <div className="mt-6 pt-4 border-t border-[#1E2846] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {new Date(ws.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
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

            {/* Inline Quick Add Blueprint Card */}
            <div
              onClick={() => setIsModalOpen(true)}
              className="glass-card bg-[#121620]/60 backdrop-blur-xl border-dashed border-[#1E2846] hover:border-[#00E5FF]/60 rounded-3xl p-6 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-center gap-3 min-h-[220px] hover:bg-[#00E5FF]/5 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF] group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-[#00E5FF] transition-colors">
                  Create New Blueprint
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                  Synthesize a new knowledge path from any topic
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-[#080A0F]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121620] border border-[#1E2846] rounded-3xl max-w-md w-full p-6 flex flex-col gap-4 shadow-2xl modal-enter">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                Delete Skill Blueprint?
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="text-neon-lime font-semibold">
                "{deleteTarget.title}"
              </span>
              ? This action cannot be undone and will remove all generated
              modules, chapters, and diagnostic progress.
            </p>
            {deleteError && (
              <div className="bg-red-500/10 text-red-400 border border-red-500/30 p-3 rounded-xl text-xs font-semibold">
                {deleteError}
              </div>
            )}
            <div className="flex items-center justify-end gap-3 mt-2 pt-3 border-t border-[#1E2846]">
              <button
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError("");
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteWorkspace}
                disabled={deletingId === deleteTarget.id}
                className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-red-500/20"
              >
                {deletingId === deleteTarget.id ? (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent inline-block" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  "Delete Blueprint"
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
