import { useCallback } from 'react';
import { useReactFlow, MarkerType } from 'reactflow';
import { useMindStore } from '../store/useMindStore';
import { askAI } from '../services/ai';
import { MindGraphNode, MindGraphEdge, SelectionPosition } from '../types';

export const useAIAction = () => {
  const { 
    nodes, setNodes, 
    setEdges, 
    aiSettings, 
    selection, setSelection,
    setIsAsking 
  } = useMindStore();
  const { screenToFlowPosition } = useReactFlow();

  const handleAskAI = useCallback(async (query: string) => {
    if (!selection || !query.trim()) return;

    setIsAsking(true);
    const sourceNode = nodes.find(n => n.id === selection.nodeId);
    
    const fullContext = sourceNode 
      ? `用户选中的文字: "${selection.text}"\n所在文本块的完整内容:\n${sourceNode.data.content}`
      : selection.text;

    const { content: answer, thought } = await askAI(fullContext, query, aiSettings);
    
    const newNodeId = `ai-${Date.now()}`;
    const flowPos = screenToFlowPosition({ x: selection.x, y: selection.y });
    const isScreenLeft = selection.x < window.innerWidth / 2;
    
    const newNode: MindGraphNode = {
      id: newNodeId,
      type: 'ai-response',
      position: { 
        x: flowPos.x + (isScreenLeft ? 100 : -450),
        y: flowPos.y - 50 
      },
      data: {
        label: query,
        content: answer,
        thought,
        type: 'ai-response',
      },
    };

    const isTargetOnLeft = newNode.position.x < (sourceNode?.position.x || 0);
    const sourceHandleId = isTargetOnLeft ? `handle-p-left-${selection.paragraphIndex ?? 0}` : `handle-p-right-${selection.paragraphIndex ?? 0}`;
    const targetHandleId = 'handle-top';

    const edgeParams: MindGraphEdge = {
      id: `e-${selection.nodeId}-${newNodeId}-${Date.now()}`,
      source: selection.nodeId,
      sourceHandle: sourceHandleId,
      target: newNodeId,
      targetHandle: targetHandleId,
      animated: true,
      style: { stroke: '#6366f1', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
    };

    setNodes((nds) => [...nds, newNode]);
    setEdges((eds) => [...eds, edgeParams]);
    
    setIsAsking(false);
    setSelection(null);
  }, [selection, nodes, aiSettings, setIsAsking, screenToFlowPosition, setNodes, setEdges, setSelection]);

  return { handleAskAI };
};
