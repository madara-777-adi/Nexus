import React from "react";
import { BookOpen, Sparkles, ChevronRight } from "lucide-react";

export interface Subtopic {
  id: string;
  title: string;
  description?: string;
}

interface SubtopicsDrawerProps {
  moduleTitle: string;
  subtopics: Subtopic[];
  activeSubtopicId?: string;
  isLoading?: boolean;
  onSelectSubtopic: (subtopic: Subtopic) => void;
}

export const SubtopicsDrawer: React.FC<SubtopicsDrawerProps> = ({
  moduleTitle,
  subtopics,
  activeSubtopicId,
  isLoading = false,
  onSelectSubtopic,
}) => {
  return (
    <div className="flex w-full flex-col rounded-xl border border-gray-800 bg-[#12141A] p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between border-b border-gray-800/80 pb-3">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#00E5FF]">
            2nd Pillar • Subtopics
          </span>
          <h4 className="mt-0.5 text-base font-medium tracking-tight text-gray-100">
            {moduleTitle}
          </h4>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-xs font-mono text-gray-500">
          <Sparkles className="h-4 w-4 animate-spin text-[#00E5FF]" />
          <span>Synthesizing subtopics...</span>
        </div>
      ) : subtopics.length === 0 ? (
        <p className="py-6 text-center text-xs text-gray-500">
          No subtopics generated for this module yet.
        </p>
      ) : (
        /* Subtopics List */
        <div className="flex flex-col gap-2.5">
          {subtopics.map((subtopic) => {
            const isSelected = subtopic.id === activeSubtopicId;
            return (
              <button
                key={subtopic.id}
                onClick={() => onSelectSubtopic(subtopic)}
                className={`group flex items-start justify-between w-full rounded-lg border p-3.5 text-left transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "border-[#00E5FF] bg-[#1A1D26] text-white shadow-[0_0_15px_rgba(0,229,255,0.06)]"
                    : "border-gray-800/60 bg-[#181B22] hover:border-gray-700 hover:bg-[#1C2029] text-gray-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <BookOpen
                    className={`mt-0.5 h-4 w-4 shrink-0 ${
                      isSelected
                        ? "text-[#00E5FF]"
                        : "text-gray-500 group-hover:text-gray-400"
                    }`}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium leading-snug">
                      {subtopic.title}
                    </span>
                    {subtopic.description && (
                      <span className="mt-1 line-clamp-1 text-xs text-gray-400">
                        {subtopic.description}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight
                  className={`h-4 w-4 shrink-0 mt-0.5 transition-transform duration-200 ${
                    isSelected
                      ? "text-[#00E5FF] translate-x-0.5"
                      : "text-gray-600 group-hover:text-gray-400 group-hover:translate-x-0.5"
                  }`}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};