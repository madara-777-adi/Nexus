import {
  ArrowLeft,
  ChevronRight,
  Clock,
  Layers,
  Sparkles,
} from "lucide-react";
import type { IConcept, IConceptTopic } from "../../types/workspace.types";

interface ChapterListProps {
  unit: IConcept;
  chapters: IConceptTopic[];
  isGenerating: boolean;
  onSelectChapter: (chapter: IConceptTopic) => void;
  onBackToUnits: () => void;
  onGenerateChapters: () => void;
}

/**
 * Renders the chapters (topics) of the currently selected Unit.
 * Purely presentational — WorkspacePage owns the data + JIT generation.
 */
export function ChapterList({
  unit,
  chapters,
  isGenerating,
  onSelectChapter,
  onBackToUnits,
  onGenerateChapters,
}: ChapterListProps) {
  return (
    <div className="h-full w-full overflow-y-auto bg-[#080A0F] p-6 md:p-10">
      <div className="max-w-3xl mx-auto flex flex-col gap-6 pt-16">
        <div className="border-b border-gray-800/80 pb-4">
          <button
            onClick={onBackToUnits}
            className="mb-3 flex items-center gap-1.5 rounded-lg border border-gray-800 bg-[#181B22] px-3 py-1.5 text-xs font-medium text-gray-300 transition-all hover:border-gray-700 hover:text-white cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Units
          </button>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#00E5FF]">
            2nd Pillars · Chapters
          </span>
          <h2 className="text-lg font-medium tracking-tight text-white mt-0.5">
            {unit.title}
          </h2>
        </div>

        {isGenerating ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 font-mono text-xs text-gray-500">
            <Sparkles className="h-5 w-5 animate-spin text-[#00E5FF]" />
            <span>Generating chapters...</span>
          </div>
        ) : chapters.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center text-xs text-gray-500">
            <span>No chapters found for this unit yet.</span>
            <button
              onClick={onGenerateChapters}
              className="flex items-center gap-2 rounded-xl border border-[#00E5FF]/40 bg-[#00E5FF]/10 px-4 py-2 text-xs font-semibold text-[#00E5FF] transition-colors hover:bg-[#00E5FF]/20 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" /> Generate Chapters
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {chapters.map((chapter) => {
              const lessonCount = chapter.lessons?.length ?? 0;
              return (
                <div
                  key={chapter.id}
                  onClick={() => onSelectChapter(chapter)}
                  className="group relative flex items-center justify-between rounded-xl border border-gray-800 bg-[#12141A] p-5 text-gray-200 transition-all duration-200 hover:border-[#00E5FF]/60 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#00E5FF]/10 font-mono text-xs font-semibold text-[#00E5FF]">
                      {chapter.order}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <h3 className="text-sm font-medium text-white transition-colors group-hover:text-[#00E5FF]">
                        {chapter.title}
                      </h3>
                      {chapter.description && (
                        <p className="line-clamp-1 text-xs font-normal text-gray-400">
                          {chapter.description}
                        </p>
                      )}
                      <div className="mt-0.5 flex items-center gap-3 font-mono text-[10px] text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {chapter.estimatedMinutes}{" "}
                          min
                        </span>
                        <span className="flex items-center gap-1">
                          <Layers className="h-3 w-3" /> {lessonCount} lesson
                          {lessonCount === 1 ? "" : "s"}
                        </span>
                        {chapter.generationStatus && (
                          <span
                            className={`rounded border px-1.5 py-0.5 uppercase tracking-wider ${
                              chapter.generationStatus === "COMPLETED"
                                ? "border-gray-700 bg-gray-800/60 text-gray-300"
                                : chapter.generationStatus === "FAILED"
                                ? "border-red-500/30 bg-red-500/10 text-red-400"
                                : "border-gray-800 bg-gray-800/60 text-gray-500"
                            }`}
                          >
                            {chapter.generationStatus === "COMPLETED"
                              ? "Ready"
                              : chapter.generationStatus}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-gray-500 transition-colors group-hover:text-white">
                    <ChevronRight className="h-4 w-4 text-[#00E5FF] transition-transform duration-200 group-hover:translate-x-0.5" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
