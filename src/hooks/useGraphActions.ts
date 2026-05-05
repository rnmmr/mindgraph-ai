import { useCallback } from 'react';
import { useMindStore } from '../store/useMindStore';
import { suggestConnections as suggestAI } from '../services/ai';
import { MindGraphEdge, AISuggestion } from '../types';
import { MarkerType } from 'reactflow';

export const useGraphActions = () => {
  const { 
    nodes, setNodes, 
    edges, setEdges, 
    aiSettings,
    setIsSuggesting,
    setSuggestions,
    clearBoard: clearAll
  } = useMindStore();

  const handleSuggestConnections = useCallback(async () => {
    setIsSuggesting(true);
    const suggested = await suggestAI(nodes, aiSettings);
    setSuggestions(suggested);
    setIsSuggesting(false);
  }, [nodes, aiSettings, setIsSuggesting, setSuggestions]);

  const applySuggestion = useCallback((suggestion: AISuggestion) => {
    const sourceNode = nodes.find(n => n.id === suggestion.source);
    const targetNode = nodes.find(n => n.id === suggestion.target);
    const isTargetOnLeft = targetNode && sourceNode ? targetNode.position.x < sourceNode.position.x : false;
    
    const newEdge: MindGraphEdge = {
      id: `suggested-${Date.now()}`,
      source: suggestion.source,
      sourceHandle: isTargetOnLeft ? 'handle-p-left-0' : 'handle-p-right-0',
      target: suggestion.target,
      targetHandle: 'handle-top',
      label: suggestion.reason,
      animated: true,
      style: { stroke: '#6366f1', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
    };
    setEdges((eds) => eds.concat(newEdge));
    setSuggestions(getSuggestions().filter(s => s !== suggestion));
  }, [nodes, setEdges, setSuggestions]);

  const downloadGraph = useCallback(() => {
    const data = { nodes, edges };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mindgraph-export.json';
    a.click();
  }, [nodes, edges]);

  return { 
    handleSuggestConnections, 
    applySuggestion, 
    downloadGraph,
    clearBoard: clearAll
  };
};

// Helper for store getter access if needed outside React
function getSuggestions() {
  return useMindStore.getState().suggestions;
}
