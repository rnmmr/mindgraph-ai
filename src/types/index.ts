import { Node, Edge, Connection, OnNodesChange, OnEdgesChange } from 'reactflow';

export type NodeType = 'text' | 'ai-response';

export interface NodeData {
  label: string;
  content: string;
  thought?: string; 
  type: NodeType;
  activeParagraphIndex?: number;
  // Methods injected by the store
  onSelection?: (text: string, nodeId: string, pos: SelectionPosition) => void;
  onChange?: (id: string, content: string) => void;
  onLabelChange?: (id: string, label: string) => void;
}

export interface SelectionPosition {
  x: number;
  y: number;
  paragraphHead?: { x: number, y: number } | null;
  paragraphIndex?: number;
  rects: { left: number; top: number; width: number; height: number }[];
}

export interface MindGraphSelection extends SelectionPosition {
  text: string;
  nodeId: string;
}

export type MindGraphNode = Node<NodeData>;
export type MindGraphEdge = Edge;

export type AIProtocol = 'google' | 'openai';

export interface AISettings {
  protocol: AIProtocol;
  apiKey: string;
  baseUrl: string;
  model: string;
  enableThinking?: boolean;
}

export interface AISuggestion {
  source: string;
  target: string;
  reason: string;
}

export interface MindGraphState {
  // Data
  nodes: MindGraphNode[];
  edges: MindGraphEdge[];
  aiSettings: AISettings;
  
  // UI State
  selection: MindGraphSelection | null;
  isAsking: boolean;
  isSuggesting: boolean;
  suggestions: AISuggestion[];
  isToolbarCollapsed: boolean;
  isScrollMode: boolean;
  showSettings: boolean;
  showHelp: boolean;
  
  // Actions
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  setNodes: (nodes: MindGraphNode[] | ((nds: MindGraphNode[]) => MindGraphNode[])) => void;
  setEdges: (edges: MindGraphEdge[] | ((eds: MindGraphEdge[]) => MindGraphEdge[])) => void;
  setSelection: (selection: MindGraphSelection | null) => void;
  setAiSettings: (settings: AISettings) => void;
  setIsAsking: (isAsking: boolean) => void;
  setIsSuggesting: (isSuggesting: boolean) => void;
  setSuggestions: (suggestions: AISuggestion[]) => void;
  setIsToolbarCollapsed: (collapsed: boolean) => void;
  setIsScrollMode: (scrollMode: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setShowHelp: (show: boolean) => void;
  
  // Logical Actions
  addNode: (node: Partial<MindGraphNode>) => void;
  removeSelection: () => void;
  updateNodeData: (id: string, data: Partial<NodeData>) => void;
  clearBoard: () => void;
}
