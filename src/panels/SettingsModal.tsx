import React from 'react';
import { Settings2, X } from 'lucide-react';
import { useMindStore } from '../store/useMindStore';
import { DEFAULT_GEMINI_MODEL, DEFAULT_OPENAI_MODEL } from '../services/ai';

export const SettingsModal = () => {
  const { aiSettings, setAiSettings, showSettings, setShowSettings } = useMindStore();

  if (!showSettings) return null;

  return (
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
  );
};
