import React, { useCallback, useEffect, useRef, memo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  ConnectionMode,
  Panel,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useMindStore } from '../../store/useMindStore';
import { TextNode } from '../Nodes/TextNode';
import { CustomEdge } from '../Edge/CustomEdge';
import { HelpCircle, Settings2 } from 'lucide-react';

const nodeTypes = {
  text: TextNode,
  'ai-response': TextNode,
};

const edgeTypes = {
  default: CustomEdge,
};

export const FlowCanvas = () => {
  const {
    nodes, onNodesChange, setNodes,
    edges, onEdgesChange, setEdges,
    onConnect,
    isScrollMode,
    setShowHelp, setShowSettings,
    setSelection,
    updateNodeData
  } = useMindStore();

  const { setViewport } = useReactFlow();

  // Handle automatic handle switching logic
  const updateEdgeHandles = useCallback(() => {
    setEdges((eds) => 
      eds.map((edge) => {
        const sourceNode = nodes.find((n) => n.id === edge.source);
        const targetNode = nodes.find((n) => n.id === edge.target);
        
        if (!sourceNode || !targetNode) return edge;
        
        const isTargetOnLeft = targetNode.position.x < sourceNode.position.x;
        
        let newSourceHandle = edge.sourceHandle;
        let newTargetHandle = edge.targetHandle;

        if (edge.sourceHandle?.startsWith('handle-p-')) {
          const parts = edge.sourceHandle.split('-');
          const paragraphIndex = parts[parts.length - 1];
          newSourceHandle = isTargetOnLeft ? `handle-p-left-${paragraphIndex}` : `handle-p-right-${paragraphIndex}`;
        }

        if (edge.targetHandle?.startsWith('handle-p-')) {
          const parts = edge.targetHandle.split('-');
          const paragraphIndex = parts[parts.length - 1];
          newTargetHandle = isTargetOnLeft ? `handle-p-right-${paragraphIndex}` : `handle-p-left-${paragraphIndex}`;
        }
        
        if (edge.sourceHandle !== newSourceHandle || edge.targetHandle !== newTargetHandle) {
          return { ...edge, sourceHandle: newSourceHandle, targetHandle: newTargetHandle };
        }

        return edge;
      })
    );
  }, [nodes, setEdges]);

  const onNodeDragStop = useCallback(() => {
    updateEdgeHandles();
  }, [updateEdgeHandles]);

  const handleTextSelection = useCallback((text: string, nodeId: string, pos: any) => {
    setSelection({ text, nodeId, ...pos });
  }, [setSelection]);

  const handleNodeContentChange = useCallback((id: string, content: string) => {
    updateNodeData(id, { content });
  }, [updateNodeData]);

  const handleNodeLabelChange = useCallback((id: string, label: string) => {
    updateNodeData(id, { label });
  }, [updateNodeData]);

  // Inject handlers into nodes
  useEffect(() => {
    setNodes((nds) => 
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onSelection: handleTextSelection,
          onChange: handleNodeContentChange,
          onLabelChange: handleNodeLabelChange,
        },
      }))
    );
  }, [handleTextSelection, handleNodeContentChange, handleNodeLabelChange, setNodes]);

  const onConnectStart = useCallback(() => {
    document.body.classList.add('connecting-active');
    window.getSelection()?.removeAllRanges();
  }, []);

  const onConnectEnd = useCallback(() => {
    document.body.classList.remove('connecting-active');
    window.getSelection()?.removeAllRanges();
  }, []);

  const onKeyDown = useCallback((event: React.KeyboardEvent) => {
    const activeElem = document.activeElement;
    if (activeElem?.tagName === 'INPUT' || activeElem?.tagName === 'TEXTAREA' || (activeElem as HTMLElement)?.isContentEditable) return;

    if (event.key === 'Delete' || event.key === 'Backspace') {
      setNodes((nds) => nds.filter((node) => !node.selected));
      setEdges((eds) => eds.filter((edge) => !edge.selected));
    }
  }, [setNodes, setEdges]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onKeyDown={onKeyDown}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        zoomOnScroll={!isScrollMode}
        panOnScroll={isScrollMode}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#cbd5e1" gap={20} />
        <Controls className="custom-controls !m-0 !left-2 !bottom-2" />
        
        <Panel position="top-right" className="z-10 !m-0 !top-2 !right-2">
          <div className="bg-white/80 backdrop-blur-md border border-slate-200 shadow-xl rounded-xl p-2.5 w-[54px] flex flex-col items-center gap-2 overflow-hidden">
            <IconButton onClick={() => setShowHelp(true)} icon={<HelpCircle size={14} />} title="帮助" />
            <IconButton onClick={() => setShowSettings(true)} icon={<Settings2 size={14} />} title="AI 设置" />
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

const IconButton = ({ onClick, icon, title }: { onClick: () => void, icon: React.ReactNode, title: string }) => (
  <button 
    onClick={onClick}
    className="flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg h-8 w-full border border-slate-100 transition-all duration-200 p-0 m-0 cursor-pointer flex-shrink-0"
    title={title}
  >
    {icon}
  </button>
);
