import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Plus, Link2, Download, Trash2, 
  MoveVertical, MousePointer2, ChevronLeft, ChevronRight, 
  Loader2, Check
} from 'lucide-react';
import { useMindStore } from '../../store/useMindStore';
import { useGraphActions } from '../../hooks/useGraphActions';
import { cn } from '../../lib/utils';

export const MainToolbar = () => {
  const { 
    nodes,
    isToolbarCollapsed, setIsToolbarCollapsed,
    isScrollMode, setIsScrollMode,
    isSuggesting,
    addNode
  } = useMindStore();
  
  const { handleSuggestConnections, downloadGraph, clearBoard } = useGraphActions();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  return (
    <div className="flex flex-col gap-2 z-10 w-full max-w-fit">
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
                    MindGraph
                  </h1>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Actions */}
          <div className="flex flex-col gap-2 w-full">
            <ToolbarButton 
              icon={<Plus size={14} />} 
              label="添加节点" 
              onClick={() => addNode({})} 
              isCollapsed={isToolbarCollapsed} 
            />
            
            <ToolbarButton 
              icon={isSuggesting ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />} 
              label="智能建议" 
              onClick={handleSuggestConnections} 
              disabled={isSuggesting || nodes.length < 2}
              isCollapsed={isToolbarCollapsed}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-100/50"
            />

            <ToolbarButton 
              icon={<Download size={14} />} 
              label="导出 JSON" 
              onClick={downloadGraph} 
              isCollapsed={isToolbarCollapsed} 
            />

            <ToolbarButton 
              icon={isScrollMode ? <MoveVertical size={14} /> : <MousePointer2 size={14} />} 
              label={isScrollMode ? "滚动模式" : "缩放模式"}
              onClick={() => setIsScrollMode(!isScrollMode)} 
              isCollapsed={isToolbarCollapsed}
              className={isScrollMode ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-100/50" : ""}
            />

            <ToolbarButton 
              activeIcon={<Check size={14} />}
              icon={<Trash2 size={14} />} 
              label={showClearConfirm ? "确定清空？" : "清空画布"}
              onClick={() => {
                if (showClearConfirm) {
                  clearBoard();
                  setShowClearConfirm(false);
                } else {
                  setShowClearConfirm(true);
                }
              }} 
              onMouseLeave={() => setShowClearConfirm(false)}
              isCollapsed={isToolbarCollapsed}
              isActive={showClearConfirm}
              className={cn(
                "bg-red-50 hover:bg-red-100 text-red-600 border-red-100/50",
                showClearConfirm && "bg-red-600 hover:bg-red-700 text-white hover:text-white border-red-600 shadow-lg shadow-red-200 scale-[1.02]"
              )}
            />
          </div>
        </div>

        {/* Collapse Toggle */}
        <button 
          onClick={() => setIsToolbarCollapsed(!isToolbarCollapsed)}
          className="w-full h-7 mt-1 flex-shrink-0 flex items-center justify-center text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-lg transition-colors"
          title={isToolbarCollapsed ? "展开面板" : "收起面板"}
        >
          {isToolbarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </motion.div>
    </div>
  );
};

interface ToolbarButtonProps {
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  label: string;
  onClick: () => void;
  onMouseLeave?: () => void;
  disabled?: boolean;
  isCollapsed: boolean;
  isActive?: boolean;
  className?: string;
}

const ToolbarButton = ({ 
  icon, 
  activeIcon,
  label, 
  onClick, 
  onMouseLeave,
  disabled, 
  isCollapsed,
  isActive,
  className 
}: ToolbarButtonProps) => (
  <button 
    onClick={onClick}
    onMouseLeave={onMouseLeave}
    disabled={disabled}
    className={cn(
      "flex items-center justify-start bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium h-8 border border-slate-100 w-full overflow-hidden transition-all duration-200 group/btn",
      disabled && "opacity-50 pointer-events-none",
      className
    )}
  >
    <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
      {isActive && activeIcon ? activeIcon : icon}
    </div>
    <AnimatePresence initial={false}>
      {!isCollapsed && (
        <motion.span 
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -5 }}
          transition={{ duration: 0.2 }}
          className="whitespace-nowrap pr-3"
        >
          {label}
        </motion.span>
      )}
    </AnimatePresence>
  </button>
);
