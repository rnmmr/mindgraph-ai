import { Node, Edge } from 'reactflow';

export type NodeType = 'text' | 'ai-response';

export interface NodeData {
  label: string;
  content: string;
  thought?: string; // AI的思考过程
  type: NodeType;
  searchTerm?: string;
  onSelection?: (text: string, nodeId: string, position: { 
    x: number, 
    y: number, 
    paragraphHead?: { x: number, y: number } | null,
    paragraphIndex?: number,
    rects: { left: number; top: number; width: number; height: number }[]
  }) => void;
  onChange?: (id: string, content: string) => void;
  onLabelChange?: (id: string, label: string) => void;
  activeParagraphIndex?: number;
}

export type MindNode = Node<NodeData>;
export type MindEdge = Edge;

export type AIProtocol = 'google' | 'openai';

export interface AISettings {
  protocol: AIProtocol;
  apiKey: string;
  baseUrl: string;
  model: string;
  enableThinking?: boolean; // 是否启用思考模式
}
