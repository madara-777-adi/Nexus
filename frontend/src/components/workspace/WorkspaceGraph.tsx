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
   * Stream relationship graph using the centralized api.defaults.baseURL
   * and attach the in-memory access token. Includes a one-shot 401 token refresh.
   */
  const streamGraph = useCallback(
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
            return streamGraph(signal, true);
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

        // 2. Stream relationship edges via authenticated NDJSON
        const response = await streamGraph(signal);

        if (signal.aborted) return;

        if (response.status === 401) {
          throw new Error("Your session has expired. Please log in again.");
        }
        if (!response.ok || !response.body) {
          throw new Error(
            `Failed to load workspace graph (HTTP ${response.status}).`,
          );
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        const initialNodes: ConceptNodeType[] = [];
        const initialEdges: Edge[] = [];
        const nodeSet = new Set<string>();

        let row = 0;
        let col = 0;

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete trailing line in buffer

          for (const line of lines) {
            if (!line.trim()) continue;

            try {
              const rel = JSON.parse(line);
              const sourceId = rel.sourceConcept?.conceptId;
              const targetId = rel.targetConcept?.conceptId;

              if (!sourceId || !targetId) continue;

              if (!nodeSet.has(sourceId)) {
                nodeSet.add(sourceId);
                const sourceProgress = progressMap.get(sourceId);
                initialNodes.push({
                  id: sourceId,
                  type: "conceptNode",
                  position: { x: col * 260, y: row * 140 },
                  data: {
                    conceptId: sourceId,
                    title: rel.sourceConcept.title || sourceId,
                    status: sourceProgress?.status || ConceptStatus.LOCKED,
                    masteryScore: sourceProgress?.masteryScore || 0,
                    onSelectNode: onSelectConcept,
                  },
                });
                col++;
                if (col > 3) {
                  col = 0;
                  row++;
                }
              }

              if (!nodeSet.has(targetId)) {
                nodeSet.add(targetId);
                const targetProgress = progressMap.get(targetId);
                initialNodes.push({
                  id: targetId,
                  type: "conceptNode",
                  position: { x: col * 260, y: row * 140 },
                  data: {
                    conceptId: targetId,
                    title: rel.targetConcept.title || targetId,
                    status: targetProgress?.status || ConceptStatus.LOCKED,
                    masteryScore: targetProgress?.masteryScore || 0,
                    onSelectNode: onSelectConcept,
                  },
                });
                col++;
                if (col > 3) {
                  col = 0;
                  row++;
                }
              }

              initialEdges.push({
                id: rel.relationshipId || `edge_${sourceId}_${targetId}`,
                source: sourceId,
                target: targetId,
                animated: rel.type === "DEPENDS_ON",
                style: { stroke: "#334155", strokeWidth: 2 },
              });
            } catch {
              // Ignore single malformed NDJSON lines
            }
          }
        }

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
    [workspaceId, onSelectConcept, setNodes, setEdges, streamGraph],
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
            No concepts yet — add relationships to start building this graph.
          </p>
        </div>
      )}
    </div>
  );
}
