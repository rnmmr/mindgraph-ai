import { GoogleGenAI } from "@google/genai";
import { AISettings, AISuggestion, MindGraphNode } from "../types";

export const DEFAULT_GEMINI_MODEL = "gemini-3-flash-preview";
export const DEFAULT_OPENAI_MODEL = "gpt-4o";

interface AIResponse {
  content: string;
  thought?: string;
}

/**
 * Prompt Template Engine - Basic Structure
 */
const SYSTEM_PROMPTS = {
  KNOWLEDGE_ASSISTANT: `你是一个专业的知识图谱助手。你的任务是根据上下文回答用户的问题，并生成适合作为知识点节点的内容。`,
  CONNECTOR: `你是一个逻辑分析专家。你的任务是发现知识图谱节点之间潜在的语义联系。`
};

async function callOpenAI(prompt: string, settings: AISettings, json: boolean = false) {
  const url = `${settings.baseUrl}/chat/completions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.apiKey}`
    },
    body: JSON.stringify({
      model: settings.model || DEFAULT_OPENAI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      ...(json ? { response_format: { type: 'json_object' } } : {})
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function askAI(context: string, question: string, settings: AISettings): Promise<AIResponse> {
  const structure = settings.enableThinking ? `
    返回格式必须为 JSON，包含以下字段：
    - "thought": 你的思考过程、分析逻辑和对上下文的理解
    - "content": 最终给用户的简洁、核心回答
  ` : "";

  const prompt = `
    ${SYSTEM_PROMPTS.KNOWLEDGE_ASSISTANT}
    
    上下文信息 (包含用户选中的文本及其所在的完整段落):
    ---
    ${context}
    ---
    
    用户的问题: "${question}"
    
    回答要求:
    1. 重点突出，结构清晰，适合直观展示。
    2. 尽量保持在 120 字以内。
    3. 直接补充、扩展或解释现有的知识点。
    ${structure}
  `;

  try {
    if (settings.protocol === 'google') {
      const ai = new GoogleGenAI({ apiKey: settings.apiKey || process.env.GEMINI_API_KEY || "" });
      const config = settings.enableThinking ? { responseMimeType: "application/json" } : undefined;
      
      const response = await ai.models.generateContent({
        model: settings.model || DEFAULT_GEMINI_MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config
      });
      
      const text = response.text || "";
      
      if (settings.enableThinking) {
        try {
          const parsed = JSON.parse(text);
          return { content: parsed.content || text, thought: parsed.thought };
        } catch (e) {
          return { content: text };
        }
      }
      return { content: text };
    } else {
      const res = await callOpenAI(prompt, settings, !!settings.enableThinking);
      if (settings.enableThinking) {
        try {
          const parsed = JSON.parse(res || "{}");
          return { content: parsed.content || res, thought: parsed.thought };
        } catch (e) {
          return { content: res || "" };
        }
      }
      return { content: res || "" };
    }
  } catch (error) {
    console.error("AI Error:", error);
    return { content: "AI 暂时无法回答，请检查配置或稍后再试。" };
  }
}

export async function suggestConnections(nodes: MindGraphNode[], settings: AISettings): Promise<AISuggestion[]> {
  const nodesSummary = nodes.map(n => `ID: ${n.id}, 标题: ${n.data.label}, 内容: ${n.data.content.substring(0, 50)}...`).join('\n');
  
  const prompt = `
    ${SYSTEM_PROMPTS.CONNECTOR}
    
    分析以下节点：
    ${nodesSummary}
    
    任务：
    识别节点之间潜在的语义联系（尤其是当前未建立连接的节点）。
    
    输出要求：
    返回一个 JSON 数组，每个对象包含：
    - "source": 源节点 ID
    - "target": 目标节点 ID
    - "reason": 连线原因（中文，简洁有力）
    
    仅返回 JSON。
  `;

  try {
    if (settings.protocol === 'google') {
      const ai = new GoogleGenAI({ apiKey: settings.apiKey || process.env.GEMINI_API_KEY || "" });
      const response = await ai.models.generateContent({
        model: settings.model || DEFAULT_GEMINI_MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "[]");
    } else {
      const res = await callOpenAI(prompt, settings, true);
      return JSON.parse(res || "[]");
    }
  } catch (error) {
    console.error("AI Suggestion Error:", error);
    return [];
  }
}

