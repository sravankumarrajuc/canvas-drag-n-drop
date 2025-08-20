import React, { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useWorkflowStore } from '@/stores/workflowStore';
import { TriggerNode } from './nodes/TriggerNode';
import { FunctionNode } from './nodes/FunctionNode';
import { ApiNode } from './nodes/ApiNode';
import { UtilityNode } from './nodes/UtilityNode';
import { LlmNode } from './nodes/LlmNode';
import { WorkflowToolbar } from './WorkflowToolbar';
import { NodeInspector } from './NodeInspector';

const nodeTypes = {
  trigger: TriggerNode,
  function: FunctionNode,
  api: ApiNode,
  utility: UtilityNode,
  llm: LlmNode,
};

export const WorkflowBuilder: React.FC = () => {
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    onConnect,
    setSelectedNode,
    deleteNode
  } = useWorkflowStore();

  const [reactFlowNodes, setReactFlowNodes, onNodesChange] = useNodesState(nodes);
  const [reactFlowEdges, setReactFlowEdges, onEdgesChange] = useEdgesState(edges);

  // Sync React Flow state with Zustand store
  React.useEffect(() => {
    setReactFlowNodes(nodes);
  }, [nodes, setReactFlowNodes]);

  React.useEffect(() => {
    setReactFlowEdges(edges);
  }, [edges, setReactFlowEdges]);

  // Sync changes back to Zustand store
  React.useEffect(() => {
    setNodes(reactFlowNodes);
  }, [reactFlowNodes, setNodes]);

  React.useEffect(() => {
    setEdges(reactFlowEdges);
  }, [reactFlowEdges, setEdges]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node as any);
  }, [setSelectedNode]);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  const handleConnect = useCallback((connection: Connection) => {
    onConnect(connection);
  }, [onConnect]);

  const onKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      const selectedElements = reactFlowNodes.filter(node => node.selected);
      selectedElements.forEach(node => deleteNode(node.id));
    }
  }, [reactFlowNodes, deleteNode]);

  return (
    <div className="h-screen w-full flex flex-col bg-background">
      <WorkflowToolbar />
      
      <div className="flex-1 flex">
        <div className="flex-1">
          <ReactFlow
            nodes={reactFlowNodes}
            edges={reactFlowEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={handleConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onKeyDown={onKeyDown}
            nodeTypes={nodeTypes}
            fitView
            className="bg-muted"
          >
            <Background color="hsl(var(--muted-foreground))" gap={20} />
            <Controls className="bg-card border-border" />
            <MiniMap 
              className="bg-card border-border"
              nodeColor="hsl(var(--primary))"
              maskColor="hsl(var(--muted) / 0.8)"
            />
          </ReactFlow>
        </div>
        
        <NodeInspector />
      </div>
    </div>
  );
};