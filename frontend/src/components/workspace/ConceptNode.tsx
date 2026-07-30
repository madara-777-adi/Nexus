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
    border: "border-gray-800/80",
    bg: "bg-[#12141A]/50",
    text: "text-gray-500",
    badge: "bg-gray-800/60 text-gray-500 border border-gray-800",
    handle: "!bg-gray-800",
  },
  [ConceptStatus.UNLOCKED]: {
    border: "border-gray-800 hover:border-[#00E5FF]/60",
    bg: "bg-[#12141A]",
    text: "text-gray-200",
    badge: "bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30",
    handle: "!bg-[#00E5FF]",
  },
  [ConceptStatus.IN_PROGRESS]: {
    border: "border-amber-500/50 hover:border-amber-500/80",
    bg: "bg-[#12141A]",
    text: "text-amber-200",
    badge: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
    handle: "!bg-amber-400",
  },
  [ConceptStatus.MASTERED]: {
    border: "border-[#BCFF3C]/40 hover:border-[#BCFF3C]/80",
    bg: "bg-[#12141A]",
    text: "text-white",
    badge: "bg-[#BCFF3C]/10 text-[#BCFF3C] border border-[#BCFF3C]/30",
    handle: "!bg-[#BCFF3C]",
  },
};

export const ConceptNode = memo(({ data }: NodeProps<ConceptNodeType>) => {
  const { title, conceptId, status, masteryScore, onSelectNode } = data;
  const theme = statusThemeMap[status] || statusThemeMap[ConceptStatus.LOCKED];
  const isClickable = status !== ConceptStatus.LOCKED;

  return (
    <div
      onClick={() => isClickable && onSelectNode(conceptId, title, status)}
      className={`relative min-w-[220px] rounded-xl border p-4 transition-all duration-200 ${
        isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-60"
      } ${theme.border} ${theme.bg}`}
    >
      <Handle type="target" position={Position.Top} className={theme.handle} />

      <div className="flex items-center justify-between gap-2 mb-2">
        <span
          className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${theme.badge}`}
        >
          {status}
        </span>
        {status !== ConceptStatus.LOCKED && (
          <span className="text-xs font-mono font-semibold text-gray-400">
            {masteryScore}%
          </span>
        )}
      </div>

      <h4 className={`text-sm font-medium tracking-tight leading-snug ${theme.text}`}>
        {title}
      </h4>

      <Handle type="source" position={Position.Bottom} className={theme.handle} />
    </div>
  );
});

ConceptNode.displayName = "ConceptNode";