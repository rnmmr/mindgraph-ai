import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, X, Loader2 } from 'lucide-react';
import { useMindStore } from '../store/useMindStore';
import { useAIAction } from '../hooks/useAIAction';

export const AIQuestionPanel = () => {
  const { selection, setSelection, isAsking } = useMindStore();
  const { handleAskAI } = useAIAction();
  const [aiQuery, setAiQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Global escape key and tab shortcut listeners
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (!selection) return;

      if (e.key === 'Escape') {
        setSelection(null);
      }
      
      if (e.key === 'Tab') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    
    const handleMouseDown = (e: MouseEvent) => {
      if (!selection) return;
      if (panelRef.current && panelRef.current.contains(e.target as Node)) {
        return;
      }
      setSelection(null);
      window.getSelection()?.removeAllRanges();
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('mousedown', handleMouseDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, [selection, setSelection]);

  const onAsk = async () => {
    if (!aiQuery.trim() || isAsking) return;
    await handleAskAI(aiQuery);
    setAiQuery('');
  };

  if (!selection) return null;

  return (
    <AnimatePresence>
      <motion.div 
        ref={panelRef}
        key="ai-box"
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        style={{ 
          left: selection.x, 
          top: selection.y + 10,
          transformOrigin: 'top left'
        }}
        className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 p-1.5 flex flex-col gap-1 w-[320px] overflow-hidden"
      >
        <div className="flex flex-col gap-3 p-2">
          {/* Highlight Indicator */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-2 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">选中的文本</span>
              <button 
                onClick={() => setSelection(null)}
                className="text-indigo-300 hover:text-indigo-500 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-xs text-indigo-700 font-medium italic line-clamp-2">"{selection.text}"</p>
          </div>

          <div className="relative flex items-center gap-2">
            <input 
              ref={inputRef}
              type="text"
              placeholder="按 Tab 键聚焦开始提问..."
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onAsk()}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            <button 
              onClick={onAsk}
              disabled={isAsking || !aiQuery.trim()}
              className="absolute right-[5px] top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:bg-slate-300 transition-all shadow-md shadow-indigo-100"
            >
              {isAsking ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
        </div>

        {/* Floating active selection highlight in flow (optional, but keep simple) */}
      </motion.div>
    </AnimatePresence>
  );
};
