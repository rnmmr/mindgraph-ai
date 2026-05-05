import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import ReactFlow, { 
  addEdge, 
  Background, 
  Controls, 
  Connection, 
  Edge, 
  Node, 
  useNodesState, 
  useEdgesState,
  Panel,
  MarkerType,
  ReactFlowProvider,
  useReactFlow,
  ConnectionMode,
  getBezierPath,
  BaseEdge,
  EdgeLabelRenderer
} from 'reactflow';
import 'reactflow/dist/style.css';

import { TextNode } from './components/TextNode';
import { askAI, suggestConnections, DEFAULT_GEMINI_MODEL, DEFAULT_OPENAI_MODEL } from './services/ai';
import { MindNode, MindEdge, NodeData, AISettings } from './types';
import { Sparkles, Plus, Send, X, Check, Loader2, Link2, Trash2, Download, HelpCircle, Settings2, Brain, ChevronLeft, ChevronRight, MousePointer2, MoveVertical } from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const nodeTypes = {
  text: TextNode,
  'ai-response': TextNode,
};

const CustomEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  label,
  labelStyle,
}: any) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetPosition,
    targetX,
    targetY,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: selected ? '#f43f5e' : style?.stroke || '#6366f1',
          strokeWidth: 2,
          transition: 'stroke 0.2s ease',
        }}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 10,
              fontWeight: 700,
              pointerEvents: 'all',
              ...labelStyle,
            }}
            className="nodrag nopan bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm text-slate-600"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

CustomEdge.displayName = 'CustomEdge';

const edgeTypes = {
  default: CustomEdge,
};

const initialNodes: MindNode[] = [
  {
    id: '1',
    type: 'text',
    position: { x: 250, y: 100 },
    width: 450,
    data: { 
      label: '🚀 快速上手指南', 
      content: '# 欢迎使用 MindGraph\n\n这是一个由 **AI 驱动** 的非线性思维工具，帮助你从碎片信息中构建知识网络。\n\n### 💡 核心操作\n\n1. **划选提问**：选中这段话中的任何文字，在弹出的对话框中输入问题。AI 会结合上下文生成回答，并**自动连线**到你选中的段落。\n2. **基础操作**：点击左侧工具栏的“+”**新建**节点；悬停在节点边缘并拖拽紫色圆点即可**手动连线**；选中节点或连线后按 **Delete** 键即可**删除**。\n3. **调整大小**：拖拽卡片右上角的蓝色 L 型图标来调整宽度。\n4. **编辑模式**：点击卡片右上角的“编辑”按钮，可以直接使用 Markdown 修改内容。\n5. **智能建议**：点击顶部工具栏的“智能建议”，让 AI 帮你发现节点间隐藏的逻辑关系。\n\n--- \n*尝试选中“非线性思维”并问问 AI 它的含义吧！*',
      type: 'text'
    },
  },
];

const initialEdges: MindEdge[] = [];

export default function App() {
  return (
    <ReactFlowProvider>
      <MindGraphApp />
    </ReactFlowProvider>
  );
}

function MindGraphApp() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { screenToFlowPosition } = useReactFlow();

  const [aiSettings, setAiSettings] = useState<AISettings>(() => {
    const saved = localStorage.getItem('mindgraph-ai-settings');
    if (saved) return JSON.parse(saved);
    return {
      protocol: 'google',
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      model: ''
    };
  });

  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    localStorage.setItem('mindgraph-ai-settings', JSON.stringify(aiSettings));
  }, [aiSettings]);
  
  const [selection, setSelection] = useState<{ 
    text: string; 
    nodeId: string; 
    x: number; 
    y: number;
    paragraphHead?: { x: number; y: number } | null;
    paragraphIndex?: number;
    rects: { left: number; top: number; width: number; height: number }[];
  } | null>(null);
  const aiBoxRef = useRef<HTMLDivElement>(null);
  const [aiQuery, setAiQuery] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);
  const [isScrollMode, setIsScrollMode] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcuts when selection is active
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (!selection) return;

      if (e.key === 'Escape') {
        setSelection(null);
      }
      
      // Allow user to quickly focus input with Tab key
      if (e.key === 'Tab') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [selection]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ 
        ...params, 
        animated: true, 
        markerEnd: { type: MarkerType.ArrowClosed } 
      }, eds));
      document.body.classList.remove('connecting-active');
    },
    [setEdges]
  );

  const onConnectStart = useCallback(() => {
    document.body.classList.add('connecting-active');
  }, []);

  const onConnectEnd = useCallback(() => {
    document.body.classList.remove('connecting-active');
  }, []);

  const handleTextSelection = useCallback((text: string, nodeId: string, pos: { 
    x: number, 
    y: number, 
    paragraphHead?: { x: number, y: number } | null,
    paragraphIndex?: number,
    rects: { left: number; top: number; width: number; height: number }[]
  }) => {
    setSelection({ 
      text, 
      nodeId, 
      x: pos.x, 
      y: pos.y, 
      rects: pos.rects,
      paragraphHead: pos.paragraphHead,
      paragraphIndex: pos.paragraphIndex
    });
  }, []);

  const handleNodeChange = useCallback((id: string, content: string) => {
    setNodes((nds) => 
      nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, content } };
        }
        return node;
      })
    );
  }, [setNodes]);

  const handleLabelChange = useCallback((id: string, label: string) => {
    setNodes((nds) => 
      nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, label } };
        }
        return node;
      })
    );
  }, [setNodes]);

  // Inject the handlers and selection context into nodes more efficiently
  useEffect(() => {
    setNodes((nds) => 
      nds.map((node) => {
        const isActive = selection?.nodeId === node.id;
        const activeParagraphIndex = isActive ? selection.paragraphIndex : undefined;
        
        // Only update if data properties actually changed
        if (
          node.data.onSelection === handleTextSelection &&
          node.data.onChange === handleNodeChange &&
          node.data.onLabelChange === handleLabelChange &&
          node.data.activeParagraphIndex === activeParagraphIndex
        ) {
          return node;
        }

        return {
          ...node,
          data: {
            ...node.data,
            onSelection: handleTextSelection,
            onChange: handleNodeChange,
            onLabelChange: handleLabelChange,
            activeParagraphIndex,
          },
        };
      })
    );
  }, [handleTextSelection, handleNodeChange, handleLabelChange, setNodes, selection]);

  // Handle automatic handle switching only when drag ends or nodes are initialized
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

  // Use a ref to track if we need to update handles after node changes (but not on every pixel)
  const lastNodePositions = useRef<string>('');
  
  useEffect(() => {
    const currentPositions = nodes.map(n => `${n.id}:${n.position.x},${n.position.y}`).join('|');
    if (currentPositions !== lastNodePositions.current) {
      // Don't update during active dragging to keep UI responsive
      // The update will happen in onNodeDragStop
      lastNodePositions.current = currentPositions;
    }
  }, [nodes]);

  const onNodeDragStop = useCallback(() => {
    updateEdgeHandles();
  }, [updateEdgeHandles]);


  const handleAskAI = async () => {
    if (!selection || !aiQuery.trim()) return;

    setIsAsking(true);
    const sourceNode = nodes.find(n => n.id === selection.nodeId);
    
    // Construct a richer context including the full node content
    const fullContext = sourceNode 
      ? `用户选中的文字: "${selection.text}"\n所在文本块的完整内容:\n${sourceNode.data.content}`
      : selection.text;

    const { content: answer, thought } = await askAI(fullContext, aiQuery, aiSettings);
    
    const newNodeId = `ai-${Date.now()}`;
    
    // Calculate position near the selection using flow coordinates
    const flowPos = screenToFlowPosition({ x: selection.x, y: selection.y });
    const isScreenLeft = selection.x < window.innerWidth / 2;
    
    const newNode: MindNode = {
      id: newNodeId,
      type: 'ai-response',
      position: { 
        x: flowPos.x + (isScreenLeft ? 100 : -450), // Offset based on screen side
        y: flowPos.y - 50 
      },
      data: {
        label: aiQuery, // Set the question as the title
        content: answer,
        thought,
        type: 'ai-response',
        onSelection: handleTextSelection,
        onChange: handleNodeChange,
        onLabelChange: handleLabelChange,
      },
    };

    const isTargetOnLeft = newNode.position.x < (sourceNode?.position.x || 0);
    const sourceHandleId = isTargetOnLeft ? `handle-p-left-${selection.paragraphIndex ?? 0}` : `handle-p-right-${selection.paragraphIndex ?? 0}`;
    const targetHandleId = 'handle-top';

    const edgeParams: MindEdge = {
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
    setAiQuery('');
  };

  const handleSuggestConnections = async () => {
    setIsSuggesting(true);
    const suggested = await suggestConnections(nodes, aiSettings);
    setSuggestions(suggested);
    setIsSuggesting(false);
  };

  const applySuggestion = (suggestion: any) => {
    const sourceNode = nodes.find(n => n.id === suggestion.source);
    const targetNode = nodes.find(n => n.id === suggestion.target);
    const isTargetOnLeft = targetNode && sourceNode ? targetNode.position.x < sourceNode.position.x : false;
    
    const newEdge: MindEdge = {
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
    setSuggestions((prev) => prev.filter(s => s !== suggestion));
  };

  const addEmptyNode = () => {
    const id = `node-${Date.now()}`;
    const newNode: MindNode = {
      id,
      type: 'text',
      position: { x: 100, y: 100 },
      data: {
        label: '', // Removed default label
        content: '在此输入内容...',
        type: 'text',
        onSelection: handleTextSelection,
        onChange: handleNodeChange,
        onLabelChange: handleLabelChange,
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const clearBoard = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelection(null);
    setAiQuery('');
  }, [setNodes, setEdges]);

  const downloadGraph = () => {
    const data = { nodes, edges };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mindgraph-export.json';
    a.click();
  };

  const onKeyDown = useCallback((event: React.KeyboardEvent) => {
    // Strictly disable deletion if any input or textarea is focused
    const activeElem = document.activeElement;
    const isEditing = 
      activeElem?.tagName === 'INPUT' || 
      activeElem?.tagName === 'TEXTAREA' ||
      (activeElem as HTMLElement)?.isContentEditable;
    
    if (isEditing) return;

    if (event.key === 'Delete' || event.key === 'Backspace') {
      const selectedNodes = nodes.filter((n) => n.selected);
      const selectedEdges = edges.filter((e) => e.selected);

      if (selectedNodes.length > 0) {
        setNodes((nds) => nds.filter((node) => !node.selected));
      }
      if (selectedEdges.length > 0) {
        setEdges((eds) => eds.filter((edge) => !edge.selected));
      }
    }
  }, [nodes, edges, setNodes, setEdges]);

  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="fixed inset-0 bg-slate-50 font-sans overflow-hidden">
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
        defaultEdgeOptions={{
          style: { stroke: '#6366f1', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
        }}
      >
        <Background color="#cbd5e1" gap={20} />
        <Controls 
          className="custom-controls"
        />
        
        <Panel position="top-right" className="z-10 flex flex-col gap-3 mr-1 mt-1">
          <button 
            onClick={() => setShowHelp(true)}
            className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-xl shadow-xl border border-slate-200 text-slate-400 hover:text-indigo-600 transition-all hover:scale-105 active:scale-95 flex items-center justify-center group"
            title="帮助"
          >
            <HelpCircle size={20} />
          </button>
          <button 
            onClick={() => setShowSettings(true)}
            className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-xl shadow-xl border border-slate-200 text-slate-400 hover:text-indigo-600 transition-all hover:scale-105 active:scale-95 flex items-center justify-center group"
            title="AI 设置"
          >
            <Settings2 size={20} />
          </button>
        </Panel>

        {showHelp && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in zoom-in-95">
              <button 
                onClick={() => setShowHelp(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                    <Sparkles className="text-white w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 tracking-tight">欢迎使用 MindGraph</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex-shrink-0 flex items-center justify-center font-bold text-xs">1</div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">划选 AI 提问</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        在节点内选中文字即可触发。弹出面板后按 <kbd className="bg-slate-100 px-1 rounded border border-slate-300 font-sans shadow-sm text-slate-700">Tab</kbd> 可快速聚焦输入框。
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex-shrink-0 flex items-center justify-center font-bold text-xs">2</div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">画布模式切换</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        左侧工具栏可切换<strong>缩放模式</strong>（滚轮缩放）或<strong>滚动模式</strong>（滚轮上下滚动），方便不同操作习惯。
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex-shrink-0 flex items-center justify-center font-bold text-xs">3</div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">高效编辑与删除</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        按 <kbd className="bg-slate-100 px-1 rounded border border-slate-300 font-sans shadow-sm text-slate-700">Delete</kbd> 或 <kbd className="bg-slate-100 px-1 rounded border border-slate-300 font-sans shadow-sm text-slate-700">Backspace</kbd> 快速删除选中的节点或连线。
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex-shrink-0 flex items-center justify-center font-bold text-xs">4</div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">手动控制</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        点击左侧 <strong className="text-indigo-600">+</strong> 新建节点。悬停节点边缘拖拽紫色圆点即可手动连线。
                      </p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setShowHelp(false)}
                  className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                  明白了，开始探索
                </button>
              </div>
            </div>
          </div>
        )}

        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in zoom-in-95">
              <button 
                onClick={() => setShowSettings(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
              
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                    <Settings2 className="text-white w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 tracking-tight">AI 模型设置</h2>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">协议类型</label>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                      <button 
                        onClick={() => setAiSettings({...aiSettings, protocol: 'google'})}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${aiSettings.protocol === 'google' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Google Gemini
                      </button>
                      <button 
                        onClick={() => setAiSettings({...aiSettings, protocol: 'openai'})}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${aiSettings.protocol === 'openai' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        OpenAI (通用)
                      </button>
                    </div>
                  </div>

                  {aiSettings.protocol === 'openai' && (
                    <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">接口地址 (Base URL)</label>
                      <input 
                        type="text"
                        value={aiSettings.baseUrl}
                        onChange={(e) => setAiSettings({...aiSettings, baseUrl: e.target.value})}
                        placeholder="https://api.openai.com/v1"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">API Key</label>
                    <input 
                      type="password"
                      value={aiSettings.apiKey}
                      onChange={(e) => setAiSettings({...aiSettings, apiKey: e.target.value})}
                      placeholder={aiSettings.protocol === 'google' ? "默认使用环境变量" : "输入您的 API Key"}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    {aiSettings.protocol === 'google' && !aiSettings.apiKey && (
                      <p className="text-[10px] text-slate-400 italic">当前正在使用内置的 Gemini API Key</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">模型名称 (可选)</label>
                    <input 
                      type="text"
                      value={aiSettings.model}
                      onChange={(e) => setAiSettings({...aiSettings, model: e.target.value})}
                      placeholder={aiSettings.protocol === 'google' ? DEFAULT_GEMINI_MODEL : DEFAULT_OPENAI_MODEL}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700">启发式思考</span>
                      <span className="text-[10px] text-slate-400">显式查看 AI 的推理过程</span>
                    </div>
                    <button 
                      onClick={() => setAiSettings({...aiSettings, enableThinking: !aiSettings.enableThinking})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${aiSettings.enableThinking ? 'bg-indigo-600' : 'bg-slate-200'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${aiSettings.enableThinking ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>

                <button 
                  onClick={() => setShowSettings(false)}
                  className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                  保存并关闭
                </button>
              </div>
            </div>
          </div>
        )}
        
        <Panel position="top-left" className="flex flex-col gap-2 z-10">
          <motion.div 
            initial={false}
            animate={{ 
              width: isToolbarCollapsed ? 54 : 160,
            }}
            transition={{ type: "tween", ease: "circOut", duration: 0.3 }}
            style={{ originX: 0 }}
            className="bg-white/80 backdrop-blur-md p-2.5 rounded-xl shadow-xl border border-slate-200 flex flex-col gap-3 relative overflow-hidden"
          >
            {/* Content Container */}
            <div className="w-full flex flex-col gap-3 flex-shrink-0">
              {/* Header */}
              <div className="flex items-center justify-start w-full h-8 overflow-hidden">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex-shrink-0 flex items-center justify-center shadow-indigo-100 shadow-lg">
                  <Sparkles className="text-white w-4 h-4" />
                </div>
                <AnimatePresence initial={false}>
                  {!isToolbarCollapsed && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-between flex-1 pl-2"
                    >
                      <h1 className="font-bold text-slate-800 tracking-tight whitespace-nowrap text-sm">
                        MindGraph AI
                      </h1>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Actions */}
              <div className="flex flex-col gap-2 w-full">
                <button 
                  onClick={addEmptyNode}
                  className="flex items-center justify-start bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium h-8 border border-slate-100 w-full overflow-hidden transition-colors group/btn"
                >
                  <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                    <Plus size={14} />
                  </div>
                  <AnimatePresence initial={false}>
                    {!isToolbarCollapsed && (
                      <motion.span 
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -5 }}
                        transition={{ duration: 0.2 }}
                        className="whitespace-nowrap pr-3"
                      >
                        添加文本块
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
                
                <button 
                  onClick={handleSuggestConnections}
                  disabled={isSuggesting || nodes.length < 2}
                  className="flex items-center justify-start bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium disabled:opacity-50 h-8 border border-indigo-100/50 w-full overflow-hidden transition-colors group/btn"
                >
                  <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                    {isSuggesting ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
                  </div>
                  <AnimatePresence initial={false}>
                    {!isToolbarCollapsed && (
                      <motion.span 
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -5 }}
                        transition={{ duration: 0.2 }}
                        className="whitespace-nowrap pr-3"
                      >
                        建议连接
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>

                <button 
                  onClick={downloadGraph}
                  className="flex items-center justify-start bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium h-8 border border-slate-100 w-full overflow-hidden transition-colors group/btn"
                >
                  <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                    <Download size={14} />
                  </div>
                  <AnimatePresence initial={false}>
                    {!isToolbarCollapsed && (
                      <motion.span 
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -5 }}
                        transition={{ duration: 0.2 }}
                        className="whitespace-nowrap pr-3"
                      >
                        导出 JSON
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>

                <button 
                  onClick={() => setIsScrollMode(!isScrollMode)}
                  className={cn(
                    "flex items-center justify-start rounded-lg text-xs font-medium h-8 border w-full overflow-hidden transition-colors group/btn",
                    isScrollMode 
                      ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-100/50" 
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-100"
                  )}
                  title={isScrollMode ? "当前：滚动模式 (鼠标滚轮 = 上下滚动)" : "当前：缩放模式 (鼠标滚轮 = 缩放画布)"}
                >
                  <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                    {isScrollMode ? <MoveVertical size={14} /> : <MousePointer2 size={14} />}
                  </div>
                  <AnimatePresence initial={false}>
                    {!isToolbarCollapsed && (
                      <motion.span 
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -5 }}
                        transition={{ duration: 0.2 }}
                        className="whitespace-nowrap pr-3"
                      >
                        {isScrollMode ? "滚动模式" : "缩放模式"}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>

                <button 
                  onClick={() => {
                    if (showClearConfirm) {
                      clearBoard();
                      setShowClearConfirm(false);
                    } else {
                      setShowClearConfirm(true);
                    }
                  }}
                  onMouseLeave={() => setShowClearConfirm(false)}
                  className={cn(
                    "flex items-center justify-start rounded-lg text-xs font-medium h-8 border w-full overflow-hidden transition-all duration-200",
                    showClearConfirm 
                      ? "bg-red-600 text-white border-red-600 shadow-lg shadow-red-200 scale-[1.02]" 
                      : "bg-red-50 hover:bg-red-100 text-red-600 border-red-100/50"
                  )}
                >
                  <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                    {showClearConfirm ? <Check size={14} /> : <Trash2 size={14} />}
                  </div>
                  <AnimatePresence initial={false}>
                    {!isToolbarCollapsed && (
                      <motion.span 
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -5 }}
                        transition={{ duration: 0.2 }}
                        className="whitespace-nowrap pr-3"
                      >
                        {showClearConfirm ? "确定清空？" : "清空画布"}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>

                <button 
                  onClick={() => setIsToolbarCollapsed(!isToolbarCollapsed)}
                  className="mt-auto flex items-center justify-start bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-medium h-8 border border-slate-100 w-full overflow-hidden transition-colors"
                >
                  <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: isToolbarCollapsed ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronLeft size={14} />
                    </motion.div>
                  </div>
                  <AnimatePresence initial={false}>
                    {!isToolbarCollapsed && (
                      <motion.span 
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -5 }}
                        transition={{ duration: 0.2 }}
                        className="whitespace-nowrap pr-3"
                      >
                        {isToolbarCollapsed ? "展开" : "收起"}侧栏
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            </div>
          </motion.div>

          {suggestions.length > 0 && (
            <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-xl border border-indigo-100 flex flex-col gap-3 max-w-[300px] animate-in fade-in slide-in-from-left-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-500">AI 建议</h3>
                <button onClick={() => setSuggestions([])} className="text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              </div>
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2">
                {suggestions.map((s, i) => (
                  <div key={i} className="p-2 bg-indigo-50 rounded-lg border border-indigo-100 text-xs flex flex-col gap-1">
                    <p className="text-slate-700 italic">"{s.reason}"</p>
                    <button 
                      onClick={() => applySuggestion(s)}
                      className="mt-1 text-indigo-600 font-bold hover:underline self-end"
                    >
                      连接
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>

        {selection && (
          <>
            {/* Selection Highlights removed as per request */}
            {selection.rects.length > 0 && (
              <div className="fixed inset-0 pointer-events-none z-[50]">
                {/* We keep the container but don't render the yellow boxes */}
              </div>
            )}

            <div 
              ref={aiBoxRef}
              className="fixed z-[60] bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-2xl border border-indigo-200 w-[300px] animate-in zoom-in-95"
              style={{ 
                left: Math.min(window.innerWidth - 320, Math.max(20, selection.x - 150)), 
                top: Math.max(20, selection.y - 180) 
              }}
            >
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">选定上下文</span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setAiSettings({...aiSettings, enableThinking: !aiSettings.enableThinking})}
                  className={cn(
                    "flex items-center gap-1 px-1.5 py-0.5 rounded border transition-colors",
                    aiSettings.enableThinking 
                      ? "bg-indigo-600 border-indigo-600 text-white" 
                      : "bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600"
                  )}
                  title="切换思考模式"
                >
                  <Brain size={10} />
                  <span className="text-[9px] font-bold">思考</span>
                </button>
                <button onClick={() => setSelection(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500 line-clamp-2 italic mb-3 bg-slate-50 p-2 rounded border border-slate-100">
              "{selection.text}"
            </p>
            <div className="relative">
              <input 
                ref={inputRef}
                type="text"
                placeholder="按 Tab 键聚焦开始提问..."
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                className="w-full pl-3 pr-10 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button 
                onClick={handleAskAI}
                disabled={isAsking || !aiQuery.trim()}
                className="absolute right-1 top-1 p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {isAsking ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        </>
      )}
    </ReactFlow>
    </div>
  );
}
