import { useEffect, useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Edge,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { ConceptNode, type ConceptNodeData, type ConceptNodeType } from "./ConceptNode";
import { getWorkspaceProgress } from "../../api/learning.api";
import { ConceptStatus, type ILearningProgress } from "../../types/learning.types";

interface WorkspaceGraphProps {
  workspaceId: string;
  onSelectConcept: (conceptId: string, title: string, status: ConceptStatus) => void;
}

export function WorkspaceGraph({ workspaceId, onSelectConcept }: WorkspaceGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<ConceptNodeType>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Register custom node type with explicit NodeTypes annotation
  const nodeTypes: NodeTypes = useMemo(() => ({ conceptNode: ConceptNode }), []);

  const fetchGraphAndProgress = useCallback(async () => {
    try {
      // 1. Fetch live learning progress status for all concepts
      const progressData: ILearningProgress[] = await getWorkspaceProgress(workspaceId);

      // Map concept progress by conceptId string
      const progressMap = new Map<string, ILearningProgress>();
      progressData.forEach((item) => {
        if (item.concept?.conceptId) {
          progressMap.set(item.concept.conceptId, item);
        }
      });

      // 2. Stream workspace relationship edges via NDJSON
      const baseUrl = import.meta.env.VITE_API_URL || "https://api.nexusspace.tech";
      const response = await fetch(
        `${baseUrl}/api/v1/workspaces/${workspaceId}/relationships/stream`,
        { credentials: "include" }
      );

      if (!response.ok || !response.body) {
        throw new Error("Failed to stream workspace graph relationships");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      const initialNodes: ConceptNodeType[] = [];
      const initialEdges: Edge[] = [];
      const nodeSet = new Set<string>();

      // Layout grid offsets for rendering nodes without overlap
      let row = 0;
      let col = 0;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const rel = JSON.parse(line);
            const sourceId = rel.sourceConcept?.conceptId;
            const targetId = rel.targetConcept?.conceptId;

            if (!sourceId || !targetId) continue;

            // Add source node if not created
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

            // Add target node if not created
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

            // Create directed edge
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

      setNodes(initialNodes);
      setEdges(initialEdges);
    } catch (err) {
      console.error("Error loading graph:", err);
    }
  }, [workspaceId, onSelectConcept, setNodes, setEdges]);

  useEffect(() => {
    fetchGraphAndProgress();
  }, [fetchGraphAndProgress]);

  return (
    <div className="h-full w-full bg-[#080A0F]">
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
          nodeColor={(node) => {
            const data = node.data as ConceptNodeData;
            if (data?.status === ConceptStatus.MASTERED) return "#BCFF3C";
            if (data?.status === ConceptStatus.IN_PROGRESS) return "#F59E0B";
            if (data?.status === ConceptStatus.UNLOCKED) return "#38BDF8";
            return "#334155";
          }}
          className="!bg-[#0F131C] !border-slate-800"
        />
      </ReactFlow>
    </div>
  );
}