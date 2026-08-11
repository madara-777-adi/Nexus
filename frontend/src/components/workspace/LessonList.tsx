import {
  ArrowLeft,
  ChevronRight,
  Clock,
  Lock,
  Sparkles,
} from "lucide-react";
import type {
  IConcept,
  IConceptTopic,
  ILessonNode,
} from "../../types/workspace.types";
import type { ILessonProgress } from "../../types/learning.types";

interface LessonListProps {
  unit: IConcept;
  chapter: IConceptTopic;
  lessons: ILessonNode[];
  isGenerating: boolean;
  lessonProgressMap: Map<string, ILessonProgress>;
  onSelectLesson: (lesson: ILessonNode) => void;
  onBackToChapters: () => void;
  onGenerateLessons: () => void;
}

/**
 * Renders the lesson nodes of the currently selected Chapter.
 * Purely presentational — WorkspacePage owns the data + JIT generation.
 */
export function LessonList({
  unit,
  chapter,
  lessons,
  isGenerating,
  lessonProgressMap,
  onSelectLesson,
  onBackToChapters,
  onGenerateLessons,
}: LessonListProps) {
  /**
   * Derive lesson accessibility from LessonProgress.
   * Missing progress record = LOCKED.
   * UNLOCKED / IN_PROGRESS / MASTERED = accessible.
   */
  const isLessonAccessible = (lesson: ILessonNode): boolean => {
    const key = `${unit.conceptId}:${chapter.id}:${lesson.id}`;
    const progress = lessonProgressMap.get(key);
    if (!progress) return false;
    return (
      progress.status === "UNLOCKED" ||
      progress.status === "IN_PROGRESS" ||
      progress.status === "MASTERED"
    );
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-[#080A0F] p-4 sm:p-6 md:p-10">
      <div className="max-w-3xl mx-auto flex flex-col gap-4 sm:gap-6 pt-28 sm:pt-16">
        <div className="border-b border-gray-800/80 pb-4">
          <button
            onClick={onBackToChapters}
            className="mb-3 flex items-center gap-1.5 rounded-lg border border-gray-800 bg-[#181B22] px-3 py-1.5 text-xs font-medium text-gray-300 transition-all hover:border-gray-700 hover:text-white cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Chapters
          </button>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#00E5FF]">
            3rd Pillars · {unit.title}
          </span>
          <h2 className="text-lg font-medium tracking-tight text-white mt-0.5">
            {chapter.title}
          </h2>
        </div>

        {isGenerating ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 font-mono text-xs text-gray-500">
            <Sparkles className="h-5 w-5 animate-spin text-[#00E5FF]" />
            <span>Generating lesson nodes...</span>
          </div>
        ) : lessons.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center text-xs text-gray-500">
            <span>No lesson nodes found for this chapter yet.</span>
            <button
              onClick={onGenerateLessons}
              className="flex items-center gap-2 rounded-xl border border-[#00E5FF]/40 bg-[#00E5FF]/10 px-4 py-2 text-xs font-semibold text-[#00E5FF] transition-colors hover:bg-[#00E5FF]/20 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" /> Generate Lessons
            </button>
          </div>
        ) : (
                    <div className="flex flex-col gap-3">
            {lessons.map((lesson) => {
              const accessible = isLessonAccessible(lesson);
              return (
                <div
                  key={lesson.id}
                  onClick={
                    accessible ? () => onSelectLesson(lesson) : undefined
                  }
                  className={`group relative flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border p-4 sm:p-5 transition-all duration-200 gap-4 sm:gap-0 ${
                    accessible
                      ? "border-gray-800 bg-[#12141A] text-gray-200 hover:border-[#00E5FF]/60 cursor-pointer"
                      : "border-gray-800/60 bg-[#0D0F14] text-gray-500 cursor-not-allowed opacity-60"
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-semibold ${
                        accessible
                          ? "bg-[#00E5FF]/10 text-[#00E5FF]"
                          : "bg-gray-800/60 text-gray-500"
                      }`}
                    >
                      {accessible ? (
                        lesson.order
                      ) : (
                        <Lock className="h-3.5 w-3.5" />
                      )}
                    </div>
                                    <div className="flex flex-col gap-1 sm:gap-0.5">
                    <h3
                      className={`text-sm font-medium transition-colors ${
                        accessible
                          ? "text-white group-hover:text-[#00E5FF]"
                          : "text-gray-500"
                      }`}
                    >
                      {lesson.title}
                    </h3>
                    {lesson.description && (
                      <p className="line-clamp-2 sm:line-clamp-1 text-xs font-normal text-gray-400 break-words whitespace-normal">
                        {lesson.description}
                      </p>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-3 font-mono text-[10px] text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {lesson.estimatedMinutes}{" "}
                        min
                      </span>
                      <span
                        className={`rounded border px-1.5 py-0.5 uppercase tracking-wider ${
                          lesson.generationStatus === "COMPLETED"
                            ? "border-gray-700 bg-gray-800/60 text-gray-300"
                            : lesson.generationStatus === "FAILED"
                              ? "border-red-500/30 bg-red-500/10 text-red-400"
                              : "border-gray-800 bg-gray-800/60 text-gray-500"
                        }`}
                      >
                        {lesson.generationStatus === "COMPLETED"
                          ? "Ready"
                          : lesson.generationStatus}
                      </span>
                    </div>
                  </div>
                </div>
                                  <div className="flex justify-end w-full sm:w-auto text-gray-500 transition-colors group-hover:text-white pl-12 sm:pl-4">
                    {accessible ? (
                      <ChevronRight className="h-4 w-4 text-[#00E5FF] transition-transform duration-200 group-hover:translate-x-0.5" />
                    ) : (
                      <Lock className="h-4 w-4 text-gray-600" />
                    )}
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
