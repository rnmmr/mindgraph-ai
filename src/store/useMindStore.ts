import { create } from 'zustand';
import { 
  applyNodeChanges, 
  applyEdgeChanges, 
  addEdge, 
  MarkerType
} from 'reactflow';
import { 
  MindGraphState, 
  MindGraphNode, 
  MindGraphEdge, 
  AISettings,
  NodeData
} from '../types';

const initialNodes: MindGraphNode[] = [
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

const DEFAULT_AI_SETTINGS: AISettings = {
  protocol: 'google',
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: '',
  enableThinking: false
};

const getSavedAiSettings = (): AISettings => {
  try {
    const saved = localStorage.getItem('mindgraph-ai-settings');
    return saved ? { ...DEFAULT_AI_SETTINGS, ...JSON.parse(saved) } : DEFAULT_AI_SETTINGS;
  } catch {
    return DEFAULT_AI_SETTINGS;
  }
};

export const useMindStore = create<MindGraphState>((set, get) => ({
  nodes: initialNodes,
  edges: [],
  aiSettings: getSavedAiSettings(),
  selection: null,
  isAsking: false,
  isSuggesting: false,
  suggestions: [],
  isToolbarCollapsed: false,
  isScrollMode: false,
  showSettings: false,
  showHelp: false,

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection) => {
    set({
      edges: addEdge({ 
        ...connection, 
        animated: true, 
        markerEnd: { type: MarkerType.ArrowClosed } 
      }, get().edges),
    });
  },

  setNodes: (nodes) => {
    set({ nodes: typeof nodes === 'function' ? nodes(get().nodes) : nodes });
  },

  setEdges: (edges) => {
    set({ edges: typeof edges === 'function' ? edges(get().edges) : edges });
  },

  setSelection: (selection) => set({ selection }),
  
  setAiSettings: (aiSettings) => {
    set({ aiSettings });
    localStorage.setItem('mindgraph-ai-settings', JSON.stringify(aiSettings));
  },

  setIsAsking: (isAsking) => set({ isAsking }),
  setIsSuggesting: (isSuggesting) => set({ isSuggesting }),
  setSuggestions: (suggestions) => set({ suggestions }),
  setIsToolbarCollapsed: (isToolbarCollapsed) => set({ isToolbarCollapsed }),
  setIsScrollMode: (isScrollMode) => set({ isScrollMode }),
  setShowSettings: (showSettings) => set({ showSettings }),
  setShowHelp: (showHelp) => set({ showHelp }),

  addNode: (node) => {
    const defaultNode: MindGraphNode = {
      id: `node-${Date.now()}`,
      type: 'text',
      position: { x: 100, y: 100 },
      data: {
        label: '',
        content: '在此输入内容...',
        type: 'text',
      },
      ...node
    };
    set({ nodes: [...get().nodes, defaultNode] });
  },

  removeSelection: () => set({ selection: null }),

  updateNodeData: (id, data) => {
    set({
      nodes: get().nodes.map(node => 
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node
      )
    });
  },

  clearBoard: () => {
    set({ nodes: [], edges: [], selection: null });
  }
}));
