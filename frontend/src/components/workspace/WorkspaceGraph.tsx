import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import {
  ConceptNode,
  type ConceptNodeData,
  type ConceptNodeType,
} from "./ConceptNode";
import { getWorkspaceProgress } from "../../api/learning.api";
import api from "../../api/axios";
import {
  ConceptStatus,
  type ILearningProgress,
} from "../../types/learning.types";
import { Sparkles, RefreshCw } from "lucide-react";

interface WorkspaceGraphProps {
  workspaceId: string;
  onSelectConcept: (
    conceptId: string,
    title: string,
    status: ConceptStatus,
  ) => void;
}

type GraphLoadState = "loading" | "ready" | "empty" | "error";

export function WorkspaceGraph({
  workspaceId,
  onSelectConcept,
}: WorkspaceGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<ConceptNodeType>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loadState, setLoadState] = useState<GraphLoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [retryToken, setRetryToken] = useState(0);

  const nodeTypes: NodeTypes = useMemo(
    () => ({ conceptNode: ConceptNode }),
    [],
  );

  const fetchGraphAndProgress = useCallback(
    async (signal: AbortSignal) => {
      setLoadState("loading");
      setErrorMessage("");

      try {
        // Concurrently fetch user progression and workspace relationships
        const [progressData, graphRes] = await Promise.all([
          getWorkspaceProgress(workspaceId),
          api.get(`/workspaces/${workspaceId}/relationships/stream`, {
            signal,
          }),
        ]);

        if (signal.aborted) return;

        const progressMap = new Map<string, ILearningProgress>();
        (progressData || []).forEach((item) => {
          if (item.concept?.conceptId) {
            progressMap.set(item.concept.conceptId, item);
          }
        });

        const { concepts = [], relationships = [] } = graphRes.data?.data || {};

        const initialNodes: ConceptNodeType[] = [];
        const initialEdges: Edge[] = [];

        concepts.forEach((concept: any, index: number) => {
          const conceptId = concept.conceptId;
          const progress = progressMap.get(conceptId);

          const col = index % 4;
          const row = Math.floor(index / 4);

          initialNodes.push({
            id: conceptId,
            type: "conceptNode",
            position: { x: col * 280, y: row * 150 },
            data: {
              conceptId,
              title: concept.title || conceptId,
              status: progress?.status || ConceptStatus.LOCKED,
              masteryScore: progress?.masteryScore || 0,
              onSelectNode: onSelectConcept,
            },
          });
        });

        relationships.forEach((rel: any) => {
          const sourceId = rel.sourceConcept?.conceptId || rel.sourceConcept;
          const targetId = rel.targetConcept?.conceptId || rel.targetConcept;

          if (sourceId && targetId) {
            initialEdges.push({
              id: rel.relationshipId || `edge_${sourceId}_${targetId}`,
              source: sourceId,
              target: targetId,
              animated: rel.type === "DEPENDS_ON",
              style: { stroke: "#262933", strokeWidth: 1.5 },
            });
          }
        });

        if (signal.aborted) return;

        setNodes(initialNodes);
        setEdges(initialEdges);
        setLoadState(initialNodes.length > 0 ? "ready" : "empty");
      } catch (err: any) {
        if (signal.aborted) return;
        console.error("Error loading graph:", err);
        setErrorMessage(
          err.response?.data?.message ||
            err.message ||
            "Something went wrong while loading the graph.",
        );
        setLoadState("error");
      }
    },
    [workspaceId, onSelectConcept, setNodes, setEdges],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchGraphAndProgress(controller.signal);
    return () => controller.abort();
  }, [fetchGraphAndProgress, retryToken]);

  if (loadState === "loading") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#080A0F] text-gray-500 font-mono text-xs">
        <Sparkles className="h-5 w-5 animate-spin text-[#00E5FF]" />
        <span>Loading knowledge graph...</span>
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[#080A0F] px-6 text-center">
        <p className="text-sm font-medium text-red-400">
          Couldn't load workspace graph
        </p>
        <p className="max-w-sm text-xs text-gray-500">{errorMessage}</p>
        <button
          onClick={() => setRetryToken((n) => n + 1)}
          className="flex items-center gap-2 rounded-xl border border-gray-800 bg-[#12141A] px-4 py-2 text-xs font-medium text-gray-200 transition-colors hover:border-[#00E5FF]/60 hover:text-white cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-[#080A0F]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background color="#1F222C" gap={24} size={1} />
        <Controls className="!bg-[#12141A] !border-gray-800 !text-gray-300" />
        <MiniMap
          nodeColor={(node: Node) => {
            const data = node.data as ConceptNodeData;
            if (data?.status === ConceptStatus.MASTERED) return "#BCFF3C";
            if (data?.status === ConceptStatus.IN_PROGRESS) return "#F59E0B";
            if (data?.status === ConceptStatus.UNLOCKED) return "#00E5FF";
            return "#262933";
          }}
          className="!bg-[#12141A] !border-gray-800"
        />
      </ReactFlow>

      {loadState === "empty" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="text-xs font-mono text-gray-500">
            No concepts found in this workspace blueprint.
          </p>
        </div>
      )}
    </div>
  );
}
