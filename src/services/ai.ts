import { GoogleGenAI } from "@google/genai";
import { AISettings } from "../types";

export const DEFAULT_GEMINI_MODEL = "gemini-3-flash-preview";
export const DEFAULT_OPENAI_MODEL = "gpt-4o";

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

export async function askAI(context: string, question: string, settings: AISettings): Promise<{ content: string; thought?: string }> {
  let prompt = `
    你是一个知识图谱助手。
    
    上下文信息 (包含用户选中的文本及其所在的完整段落):
    ${context}
    
    用户的问题:
    "${question}"
    
    请根据提供的上下文，给出一个简洁、深刻的中文回答。
    这个回答将作为知识图谱中的一个新节点，因此请确保它：
    1. 重点突出，结构清晰。
    2. 能够直接补充或扩展现有的知识点。
    3. 尽量保持在 100 字以内。
  `;

  if (settings.enableThinking) {
    prompt += `
    请在回答之前展示你的思考过程（Thinking Process）。
    返回格式必须为 JSON，包含两个字段：
    - "thought": 你的思考过程和分析逻辑
    - "content": 最终给用户的简洁回答
    `;
  }

  try {
    if (settings.protocol === 'google') {
      const ai = new GoogleGenAI({ apiKey: settings.apiKey || process.env.GEMINI_API_KEY || "" });
      const config = settings.enableThinking ? { responseMimeType: "application/json" } : undefined;
      const model = ai.models.generateContent({
        model: settings.model || DEFAULT_GEMINI_MODEL,
        contents: [{ parts: [{ text: prompt }] }],
        config
      });
      const response = await model;
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
      const res = await callOpenAI(prompt, settings, settings.enableThinking);
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
    return { content: "Error generating AI response." };
  }
}

export async function suggestConnections(nodes: any[], settings: AISettings) {
  const nodesSummary = nodes.map(n => `ID: ${n.id}, Content: ${n.data.content}`).join('\n');
  
  const prompt = `
    Given the following nodes in a research graph:
    ${nodesSummary}
    
    Identify potential semantic connections between nodes that are not currently connected.
    Return a JSON array of objects with 'source', 'target', and 'reason'.
    The 'reason' should be in Chinese.
    Example: [{"source": "node1", "target": "node2", "reason": "两者都讨论了市场趋势"}]
    
    Return ONLY valid JSON.
  `;

  try {
    if (settings.protocol === 'google') {
      const ai = new GoogleGenAI({ apiKey: settings.apiKey || process.env.GEMINI_API_KEY || "" });
      const response = await ai.models.generateContent({
        model: settings.model || DEFAULT_GEMINI_MODEL,
        contents: [{ parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "[]");
    } else {
      const res = await callOpenAI(prompt, settings, true);
      // OpenAI often wraps JSON in code blocks or might just be raw if format is set.
      // But gpt-4o with response_format json_object is reliable.
      return JSON.parse(res || "[]");
    }
  } catch (error) {
    console.error("AI Suggestion Error:", error);
    return [];
  }
}
