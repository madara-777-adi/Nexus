import React from "react";
import { Lock, Unlock, CheckCircle2, ChevronRight } from "lucide-react";

export type ModuleStatus = "locked" | "unlocked" | "mastered";

interface ModuleNodeProps {
  order: number;
  title: string;
  description: string;
  status: ModuleStatus;
  isActive?: boolean;
  onClick: () => void;
}

export const ModuleNode: React.FC<ModuleNodeProps> = ({
  order,
  title,
  description,
  status,
  isActive = false,
  onClick,
}) => {
  const isLocked = status === "locked";
  const isMastered = status === "mastered";

  // Base card styling - Solid dark surface (#12141A), no glass
  let borderStyle = "border-gray-800/80 bg-[#12141A] text-gray-400";
  let badgeStyle = "bg-gray-800 text-gray-500";
  let statusTextColor = "text-gray-500";

  if (isMastered) {
    borderStyle = isActive
      ? "border-[#BCFF3C] bg-[#12141A] text-white shadow-[0_0_15px_rgba(188,255,60,0.08)]"
      : "border-[#BCFF3C]/40 bg-[#12141A] hover:border-[#BCFF3C]/80 text-gray-200";
    badgeStyle = "bg-[#BCFF3C]/10 text-[#BCFF3C]";
    statusTextColor = "text-[#BCFF3C]";
  } else if (!isLocked) {
    // Unlocked / Active Concept -> Knowledge Cyan (#00E5FF)
    borderStyle = isActive
      ? "border-[#00E5FF] bg-[#12141A] text-white shadow-[0_0_15px_rgba(0,229,255,0.08)]"
      : "border-gray-700 bg-[#12141A] hover:border-[#00E5FF]/60 text-gray-200";
    badgeStyle = "bg-[#00E5FF]/10 text-[#00E5FF]";
    statusTextColor = "text-[#00E5FF]";
  }

  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className={`group relative flex w-full flex-col rounded-xl border p-5 text-left transition-all duration-200 ease-out ${borderStyle} ${
        isLocked ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      }`}
    >
      <div className="flex w-full items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-semibold ${badgeStyle}`}
          >
            {order}
          </span>
          <h3 className="font-medium text-[15px] tracking-tight text-gray-100 group-hover:text-white">
            {title}
          </h3>
        </div>

        {/* Status Indicator Icon */}
        {isMastered ? (
          <CheckCircle2 className="h-4 w-4 text-[#BCFF3C]" />
        ) : isLocked ? (
          <Lock className="h-4 w-4 text-gray-600" />
        ) : (
          <Unlock className="h-4 w-4 text-[#00E5FF]" />
        )}
      </div>

      <p className="text-sm leading-relaxed text-gray-400 font-normal line-clamp-2">
        {description}
      </p>

      {/* Footer State Label */}
      <div className="mt-4 flex items-center justify-between w-full pt-3 border-t border-gray-800/60">
        <span
          className={`text-[11px] font-semibold uppercase tracking-wider ${statusTextColor}`}
        >
          {isLocked ? "Locked" : isMastered ? "Mastered" : "Ready to Explore"}
        </span>
        {!isLocked && (
          <ChevronRight
            className={`h-4 w-4 transition-transform duration-200 ${
              isActive ? "translate-x-1 text-white" : "text-gray-500 group-hover:translate-x-0.5"
            }`}
          />
        )}
      </div>
    </button>
  );
};