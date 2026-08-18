import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { Plus, Trash2, Layers, AlertTriangle } from "lucide-react";
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
  "A* Heuristic Search",
  "Segment Tree",
  "Suffix Automaton",
  "Floyd-Warshall",
  "AVL Tree Rotation",
  "Bloom Filter",
  "Convex Hull",
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
  "Instruction Pipelining",
  "Branch Predictor",
  "SIMD Vectorization",
  "RISC-V Microarchitecture",
  "L1 Cache Line",
  "Out-of-Order Execution",
  "Register Renaming",
  "Memory Bus Arbitration",
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
  "Write-Ahead Log (WAL)",
  "ACID Serializability",
  "Abstract Syntax Tree (AST)",
  "SSA Intermediate Rep",
  "Mark-and-Sweep GC",
  "LL(1) Parser",
  "Query Optimization",
];

const COLOR_POOL = ["188, 255, 60", "0, 255, 255", "156, 163, 175"];

class StreamParticle {
  index: number;
  totalParticles: number;
  radius: number = 0;
  angle: number = 0;
  speed: number = 0;
  text: string = "";
  fontSize: number = 0;
  baseOpacity: number = 0;
  colorStr: string = "";
  x: number = 0;
  y: number = 0;
  canvasWidth: number;
  canvasHeight: number;

  constructor(
    index: number,
    totalParticles: number,
    canvasWidth: number,
    canvasHeight: number,
  ) {
    this.index = index;
    this.totalParticles = totalParticles;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.reset();
  }

  randomFixed(seed: number) {
    const x = Math.sin(this.index * 17.13 + seed) * 10000;
    return x - Math.floor(x);
  }

  reset() {
    const minRadius = 140;
    const maxRadius = Math.max(this.canvasWidth, this.canvasHeight) / 1.05;
    const totalRings = 8;

    const ringIndex = this.index % totalRings;
    const radiusStep = (maxRadius - minRadius) / totalRings;

    this.radius =
      minRadius + ringIndex * radiusStep + (this.randomFixed(1) * 20 - 10);

    const ringOffsetAngle = (ringIndex / totalRings) * Math.PI;
    const particlesInRing = Math.ceil(this.totalParticles / totalRings);
    const particleInRingIndex = Math.floor(this.index / totalRings);

    this.angle =
      ringOffsetAngle + (particleInRingIndex / particlesInRing) * Math.PI * 2;

    const direction = ringIndex % 2 === 0 ? 1 : -1;
    const baseVelocity = 0.0035;

    this.speed = (120 / this.radius) * baseVelocity * direction;
    this.text =
      CORE_CSE_CONCEPTS[
        Math.floor(this.randomFixed(2) * CORE_CSE_CONCEPTS.length)
      ];
    this.fontSize = this.randomFixed(3) * 8 + 10; // 10px to 18px
    this.baseOpacity = this.randomFixed(4) * 0.25 + 0.15; // 0.15 to 0.40 opacity
    this.colorStr =
      COLOR_POOL[Math.floor(this.randomFixed(5) * COLOR_POOL.length)];
  }

  update(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.angle += this.speed;

    const centerX = this.canvasWidth / 2;
    const centerY = this.canvasHeight / 2;
    this.x = centerX + Math.cos(this.angle) * this.radius;
    this.y = centerY + Math.sin(this.angle) * this.radius;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.font = `bold ${this.fontSize}px monospace`;
    ctx.shadowBlur = 4;
    ctx.shadowColor = `rgba(${this.colorStr}, ${this.baseOpacity})`;

    ctx.fillStyle = `rgba(${this.colorStr}, ${this.baseOpacity})`;
    ctx.fillText(this.text, this.x, this.y);

    ctx.shadowBlur = 0;
  }
}

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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // Background Animation Engine (Identical to HomePage mechanics)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: StreamParticle[] = [];
    const particleCount = 100; // Adjusted for a bit less density than homepage

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(
          new StreamParticle(i, particleCount, canvas.width, canvas.height),
        );
      }
    };

    const drawCentralVoid = () => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const voidRadius = 260;

      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        voidRadius,
      );

      gradient.addColorStop(0, "rgba(8, 10, 15, 0.95)");
      gradient.addColorStop(0.6, "rgba(8, 10, 15, 0.7)");
      gradient.addColorStop(1, "rgba(8, 10, 15, 0)");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, voidRadius, 0, Math.PI * 2);
      ctx.fill();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.update(canvas.width, canvas.height);
        particle.draw(ctx);
      });

      drawCentralVoid();
      animationRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
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

  return (
    <div className="min-h-screen bg-[#080A0F] text-white flex flex-col relative selection:bg-neon-lime selection:text-midnight overflow-x-hidden font-sans">
      {/* Background Animated Canvas (Same as Homepage) */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
      ></canvas>

      {/* Top Persistent Navigation Bar (From 2nd Image) */}
      <header className="border-b border-[#1E2846] bg-[#0d1117]/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-neovision text-neon-lime text-xl tracking-wider uppercase font-bold">
            NexusSpace
          </span>
        </div>

        {/* User Dropdown */}
        <UserDropdown />
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col gap-6 sm:gap-8 relative z-10 pt-10">
        {/* Title Header & Action Button (From 1st Image) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1E2846]/60">
          <div className="space-y-1 w-full sm:w-auto">
            <h1 className="font-neovision text-2xl md:text-3xl text-white tracking-wide">
              WORKSPACES
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Select or create a workspace to manage your knowledge nodes.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto bg-neon-lime text-midnight font-bold text-xs uppercase tracking-wider px-5 py-3 min-h-[44px] rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(188,255,60,0.2)]"
          >
            <Plus className="w-4 h-4" />
            <span>New Workspace</span>
          </button>
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

        {/* Loading State Skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-[#121620]/80 backdrop-blur-xl border border-[#1E2846] rounded-2xl p-5 animate-pulse flex flex-col gap-3 h-44"
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
                No Workspaces Found
              </h3>
              <p className="text-gray-400 text-xs mt-1 max-w-sm">
                You haven't created any workspaces yet. Click below to start
                building your knowledge paths.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-2 bg-neon-lime text-midnight font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
            >
              Create Workspace
            </button>
          </div>
        ) : (
          /* Workspaces Grid (Original Layout) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {workspaces.map((ws) => (
              <div
                key={ws.workspaceId}
                onClick={() => navigate(`/workspace/${ws.workspaceId}`)}
                className="group bg-[#121620]/80 backdrop-blur-xl border border-[#1E2846] hover:border-neon-lime/60 rounded-2xl p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-[0_0_20px_rgba(188,255,60,0.06)] relative"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-white font-bold text-lg group-hover:text-neon-lime transition-colors line-clamp-1 pr-4">
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

                <div className="mt-6 pt-3 border-t border-[#1E2846]/60 flex items-center justify-between text-[11px] text-gray-500">
                  <span className="font-mono text-[10px]">
                    {ws.workspaceId}
                  </span>
                  <span>
                    {new Date(ws.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-[#080A0F]/80 backdrop-blur-md flex items-center justify-center p-4">
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
