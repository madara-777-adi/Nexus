import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { ConceptStatus } from "../../types/learning.types";

export interface ConceptNodeData extends Record<string, unknown> {
  title: string;
  conceptId: string;
  status: ConceptStatus;
  masteryScore: number;
  onSelectNode: (conceptId: string, title: string, status: ConceptStatus) => void;
}

export type ConceptNodeType = Node<ConceptNodeData, "conceptNode">;

const statusThemeMap = {
  [ConceptStatus.LOCKED]: {
    border: "border-slate-800",
    bg: "bg-[#080A0F]",
    text: "text-slate-500",
    badge: "bg-slate-900/80 text-slate-500 border border-slate-800",
    glow: "",
  },
  [ConceptStatus.UNLOCKED]: {
    border: "border-slate-700 hover:border-slate-500",
    bg: "bg-[#0F131C]",
    text: "text-slate-200",
    badge: "bg-slate-800/80 text-slate-300 border border-slate-700",
    glow: "hover:shadow-lg hover:shadow-black/50",
  },
  [ConceptStatus.IN_PROGRESS]: {
    border: "border-amber-500/50",
    bg: "bg-[#14120B]",
    text: "text-amber-200",
    badge: "bg-amber-950/80 text-amber-400 border border-amber-500/30",
    glow: "shadow-lg shadow-amber-500/10",
  },
  [ConceptStatus.MASTERED]: {
    border: "border-[#BCFF3C]",
    bg: "bg-[#0D150A]",
    text: "text-white",
    badge: "bg-[#BCFF3C]/10 text-[#BCFF3C] border border-[#BCFF3C]/30",
    glow: "shadow-lg shadow-[#BCFF3C]/20",
  },
};

export const ConceptNode = memo(({ data }: NodeProps<ConceptNodeType>) => {
  const { title, conceptId, status, masteryScore, onSelectNode } = data;
  const theme = statusThemeMap[status] || statusThemeMap[ConceptStatus.LOCKED];
  const isClickable = status !== ConceptStatus.LOCKED;

  return (
    <div
      onClick={() => isClickable && onSelectNode(conceptId, title, status)}
      className={`relative min-w-[200px] rounded-xl border p-4 transition-all duration-200 ${
        isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-60"
      } ${theme.border} ${theme.bg} ${theme.glow}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-700" />

      <div className="flex items-center justify-between gap-2 mb-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${theme.badge}`}>
          {status}
        </span>
        {status !== ConceptStatus.LOCKED && (
          <span className="text-xs font-mono font-medium text-slate-400">
            {masteryScore}%
          </span>
        )}
      </div>

      <h4 className={`text-sm font-semibold tracking-tight ${theme.text}`}>{title}</h4>

      <Handle type="source" position={Position.Bottom} className="!bg-[#BCFF3C]" />
    </div>
  );
});

ConceptNode.displayName = "ConceptNode";