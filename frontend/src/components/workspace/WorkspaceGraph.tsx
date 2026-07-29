import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import api, { getAccessToken, setAccessToken } from "../../api/axios";
import {
  ConceptStatus,
  type ILearningProgress,
} from "../../types/learning.types";

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

  // Memoize custom node types to prevent React Flow re-mount loops
  const nodeTypes: NodeTypes = useMemo(
    () => ({ conceptNode: ConceptNode }),
    [],
  );

  /**
   * Fetch graph data via structured REST JSON using the centralized api.defaults.baseURL.
   * Includes a one-shot 401 token refresh mechanism.
   */
  const fetchGraphPayload = useCallback(
    async (signal: AbortSignal, isRetry = false): Promise<Response> => {
      const token = getAccessToken();
      const response = await fetch(
        `${api.defaults.baseURL}/workspaces/${workspaceId}/relationships/stream`,
        {
          credentials: "include",
          signal,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      if (response.status === 401 && !isRetry) {
        try {
          const refreshRes = await api.post("/auth/refresh-token");
          const newToken = refreshRes.data?.data?.accessToken;
          if (newToken) {
            setAccessToken(newToken);
            return fetchGraphPayload(signal, true);
          }
        } catch {
          // Refresh failed — fall through and let caller handle 401
        }
      }

      return response;
    },
    [workspaceId],
  );

  const fetchGraphAndProgress = useCallback(
    async (signal: AbortSignal) => {
      setLoadState("loading");
      setErrorMessage("");

      try {
        // 1. Fetch user learning progress status for concepts
        const progressData: ILearningProgress[] =
          await getWorkspaceProgress(workspaceId);

        const progressMap = new Map<string, ILearningProgress>();
        progressData.forEach((item) => {
          if (item.concept?.conceptId) {
            progressMap.set(item.concept.conceptId, item);
          }
        });

        // 2. Fetch structured REST JSON graph payload
        const response = await fetchGraphPayload(signal);

        if (signal.aborted) return;

        if (response.status === 401) {
          throw new Error("Your session has expired. Please log in again.");
        }
        if (!response.ok) {
          throw new Error(
            `Failed to load workspace graph (HTTP ${response.status}).`,
          );
        }

        const json = await response.json();
        const { concepts = [], relationships = [] } = json.data || {};

        const initialNodes: ConceptNodeType[] = [];
        const initialEdges: Edge[] = [];

        // 3. Map all concept nodes to grid positions
        concepts.forEach((concept: any, index: number) => {
          const conceptId = concept.conceptId;
          const progress = progressMap.get(conceptId);

          const col = index % 4;
          const row = Math.floor(index / 4);

          initialNodes.push({
            id: conceptId,
            type: "conceptNode",
            position: { x: col * 260, y: row * 140 },
            data: {
              conceptId,
              title: concept.title || conceptId,
              status: progress?.status || ConceptStatus.LOCKED,
              masteryScore: progress?.masteryScore || 0,
              onSelectNode: onSelectConcept,
            },
          });
        });

        // 4. Map all relationship edges
        relationships.forEach((rel: any) => {
          const sourceId = rel.sourceConcept?.conceptId || rel.sourceConcept;
          const targetId = rel.targetConcept?.conceptId || rel.targetConcept;

          if (sourceId && targetId) {
            initialEdges.push({
              id: rel.relationshipId || `edge_${sourceId}_${targetId}`,
              source: sourceId,
              target: targetId,
              animated: rel.type === "DEPENDS_ON",
              style: { stroke: "#334155", strokeWidth: 2 },
            });
          }
        });

        if (signal.aborted) return;

        setNodes(initialNodes);
        setEdges(initialEdges);
        setLoadState(initialNodes.length > 0 ? "ready" : "empty");
      } catch (err) {
        if (signal.aborted) return;
        console.error("Error loading graph:", err);
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading the graph.",
        );
        setLoadState("error");
      }
    },
    [workspaceId, onSelectConcept, setNodes, setEdges, fetchGraphPayload],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchGraphAndProgress(controller.signal);
    return () => controller.abort();
  }, [fetchGraphAndProgress, retryToken]);

  if (loadState === "loading") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#080A0F]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-[#BCFF3C]" />
        <p className="text-xs text-slate-500">Loading knowledge graph…</p>
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[#080A0F] px-6 text-center">
        <p className="text-sm font-semibold text-red-400">
          Couldn't load this workspace graph
        </p>
        <p className="max-w-sm text-xs text-slate-500">{errorMessage}</p>
        <button
          onClick={() => setRetryToken((n) => n + 1)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-[#BCFF3C]/50 hover:text-[#BCFF3C]"
        >
          Retry
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
        <Background color="#1E293B" gap={20} size={1} />
        <Controls className="!bg-[#0F131C] !border-slate-800 !text-slate-300" />
        <MiniMap
          nodeColor={(node: Node) => {
            const data = node.data as ConceptNodeData;
            if (data?.status === ConceptStatus.MASTERED) return "#BCFF3C";
            if (data?.status === ConceptStatus.IN_PROGRESS) return "#F59E0B";
            if (data?.status === ConceptStatus.UNLOCKED) return "#38BDF8";
            return "#334155";
          }}
          className="!bg-[#0F131C] !border-slate-800"
        />
      </ReactFlow>

      {loadState === "empty" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="text-xs text-slate-600">
            No concepts found in this workspace blueprint.
          </p>
        </div>
      )}
    </div>
  );
}