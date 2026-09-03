import { useMemo } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  type Node,
  type Edge,
  Position,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Lock, CheckCircle2, Unlock } from "lucide-react";
import type { IConcept, IConceptTopic, ILessonNode } from "../../types/workspace.types";
import type { ILearningProgress, ILessonProgress } from "../../types/learning.types";
import { ConceptStatus } from "../../types/learning.types";

interface CurriculumGraphProps {
  concepts: IConcept[];
  progressMap: Map<string, ILearningProgress>;
  lessonProgressMap: Map<string, ILessonProgress>;
}

// Custom Node for Tier 2: Unit
const UnitNode = ({ data }: { data: any }) => {
  const isMastered = data.status === ConceptStatus.MASTERED;
  const isUnlocked =
    data.status === ConceptStatus.UNLOCKED ||
    data.status === ConceptStatus.IN_PROGRESS ||
    isMastered;

  return (
    <div
      className={`px-4 py-3 rounded-2xl border-2 shadow-xl backdrop-blur-md min-w-[200px] flex items-center justify-between gap-3 ${
        isMastered
          ? "bg-[#BCFF3C]/10 border-[#BCFF3C] text-white"
          : isUnlocked
            ? "bg-[#00E5FF]/10 border-[#00E5FF] text-white"
            : "bg-[#121620] border-[#1E2846] text-gray-500 opacity-60"
      }`}
    >
      <div className="flex flex-col">
        <span className="text-[10px] font-mono uppercase font-bold text-gray-400">Unit</span>
        <span className="text-sm font-bold truncate max-w-[150px]">{data.label}</span>
      </div>
      {isMastered ? (
        <CheckCircle2 className="w-5 h-5 text-[#BCFF3C]" />
      ) : isUnlocked ? (
        <Unlock className="w-5 h-5 text-[#00E5FF]" />
      ) : (
        <Lock className="w-5 h-5 text-gray-500" />
      )}
    </div>
  );
};

// Custom Node for Tier 3: Chapter
const ChapterNode = ({ data }: { data: any }) => {
  const isMastered = data.status === ConceptStatus.MASTERED;
  const isUnlocked =
    data.status === ConceptStatus.UNLOCKED ||
    data.status === ConceptStatus.IN_PROGRESS ||
    isMastered;

  return (
    <div
      className={`px-4 py-2 rounded-xl border-2 min-w-[180px] flex items-center justify-between gap-2 ${
        isMastered
          ? "bg-[#BCFF3C]/5 border-[#BCFF3C]/60 text-white"
          : isUnlocked
            ? "bg-[#00E5FF]/5 border-[#00E5FF]/60 text-white"
            : "bg-[#121620] border-[#1E2846] text-gray-600 opacity-60"
      }`}
    >
      <div className="flex flex-col">
        <span className="text-[9px] font-mono uppercase text-gray-500">Chapter</span>
        <span className="text-xs font-semibold truncate max-w-[130px]">{data.label}</span>
      </div>
      {isMastered ? (
        <CheckCircle2 className="w-4 h-4 text-[#BCFF3C]" />
      ) : isUnlocked ? (
        <Unlock className="w-4 h-4 text-[#00E5FF]" />
      ) : (
        <Lock className="w-4 h-4" />
      )}
    </div>
  );
};

// Custom Node for Tier 4: Lesson
const LessonNode = ({ data }: { data: any }) => {
  const isMastered = data.status === ConceptStatus.MASTERED;
  const isUnlocked =
    data.status === ConceptStatus.UNLOCKED ||
    data.status === ConceptStatus.IN_PROGRESS ||
    isMastered;

  return (
    <div
      className={`px-3 py-2 rounded-lg border min-w-[150px] flex items-center gap-2 ${
        isMastered
          ? "bg-[#BCFF3C]/5 border-[#BCFF3C]/40 text-white"
          : isUnlocked
            ? "bg-[#00E5FF]/5 border-[#00E5FF]/40 text-white"
            : "bg-[#0d1117] border-[#1E2846] text-gray-600 opacity-60"
      }`}
    >
      {isMastered ? (
        <CheckCircle2 className="w-3 h-3 text-[#BCFF3C] shrink-0" />
      ) : isUnlocked ? (
        <Unlock className="w-3 h-3 text-[#00E5FF] shrink-0" />
      ) : (
        <Lock className="w-3 h-3 shrink-0" />
      )}
      <span className="text-[10px] font-medium truncate max-w-[110px]">{data.label}</span>
    </div>
  );
};

const nodeTypes = {
  unit: UnitNode,
  chapter: ChapterNode,
  lesson: LessonNode,
};

export function CurriculumGraph({
  concepts,
  progressMap,
  lessonProgressMap,
}: CurriculumGraphProps) {
  const { nodes, edges } = useMemo(() => {
    const flowNodes: Node[] = [];
    const flowEdges: Edge[] = [];

    // Simple layout coordinates
    const X_OFFSET_UNIT = 50;
    const X_OFFSET_CHAPTER = 350;
    const X_OFFSET_LESSON = 650;
    const Y_SPACING_UNIT = 400;
    const Y_SPACING_CHAPTER = 150;
    const Y_SPACING_LESSON = 60;

    let currentYUnit = 50;

    const sortedConcepts = [...concepts].sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );

    sortedConcepts.forEach((unit, uIdx) => {
      const unitProg = progressMap.get(unit.conceptId);
      const unitStatus =
        unitProg?.status || (uIdx === 0 ? ConceptStatus.UNLOCKED : ConceptStatus.LOCKED);
      
      const unitNodeId = `unit-${unit.conceptId}`;
      flowNodes.push({
        id: unitNodeId,
        type: "unit",
        position: { x: X_OFFSET_UNIT, y: currentYUnit },
        data: { label: unit.title, status: unitStatus },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });

      const chapters = unit.topics || [];
      let currentYChapter = currentYUnit - ((chapters.length - 1) * Y_SPACING_CHAPTER) / 2;

      chapters.forEach((chapter, cIdx) => {
        // Evaluate chapter status based on unit status (simplified for UI visualization)
        const chapterStatus = unitStatus;
        const chapterNodeId = `chapter-${chapter.id}`;
        
        flowNodes.push({
          id: chapterNodeId,
          type: "chapter",
          position: { x: X_OFFSET_CHAPTER, y: currentYChapter },
          data: { label: chapter.title, status: chapterStatus },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });

        flowEdges.push({
          id: `e-${unitNodeId}-${chapterNodeId}`,
          source: unitNodeId,
          target: chapterNodeId,
          type: "smoothstep",
          animated: chapterStatus === ConceptStatus.IN_PROGRESS || chapterStatus === ConceptStatus.UNLOCKED,
          style: { stroke: chapterStatus === ConceptStatus.MASTERED ? "#BCFF3C" : chapterStatus !== ConceptStatus.LOCKED ? "#00E5FF" : "#1E2846" },
          markerEnd: { type: MarkerType.ArrowClosed, color: chapterStatus === ConceptStatus.MASTERED ? "#BCFF3C" : chapterStatus !== ConceptStatus.LOCKED ? "#00E5FF" : "#1E2846" },
        });

        const lessons = chapter.lessons || [];
        let currentYLesson = currentYChapter - ((lessons.length - 1) * Y_SPACING_LESSON) / 2;

        lessons.forEach((lesson, lIdx) => {
          const lessonProgKey = `${unit.conceptId}:${chapter.id}:${lesson.id}`;
          const lessonProg = lessonProgressMap.get(lessonProgKey);
          let lessonStatus = lessonProg?.status || ConceptStatus.LOCKED;
          
          if (unitStatus === ConceptStatus.MASTERED) lessonStatus = ConceptStatus.MASTERED;
          else if (chapterStatus === ConceptStatus.UNLOCKED && !lessonProg) lessonStatus = ConceptStatus.UNLOCKED;

          const lessonNodeId = `lesson-${lesson.id}`;
          
          flowNodes.push({
            id: lessonNodeId,
            type: "lesson",
            position: { x: X_OFFSET_LESSON, y: currentYLesson },
            data: { label: lesson.title, status: lessonStatus },
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
          });

          flowEdges.push({
            id: `e-${chapterNodeId}-${lessonNodeId}`,
            source: chapterNodeId,
            target: lessonNodeId,
            type: "smoothstep",
            animated: lessonStatus === ConceptStatus.IN_PROGRESS || lessonStatus === ConceptStatus.UNLOCKED,
            style: { stroke: lessonStatus === ConceptStatus.MASTERED ? "#BCFF3C" : lessonStatus !== ConceptStatus.LOCKED ? "#00E5FF" : "#1E2846" },
          });

          currentYLesson += Y_SPACING_LESSON;
        });

        currentYChapter += Math.max(Y_SPACING_CHAPTER, lessons.length * Y_SPACING_LESSON + 20);
      });

      currentYUnit += Math.max(Y_SPACING_UNIT, chapters.length * Y_SPACING_CHAPTER + 100);
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [concepts, progressMap, lessonProgressMap]);

  return (
    <div className="w-full h-full bg-[#080A0F]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.5}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1E2846" gap={16} />
        <Controls
          className="bg-[#121620] border-[#1E2846] fill-white"
          showInteractive={false}
        />
      </ReactFlow>
    </div>
  );
}
