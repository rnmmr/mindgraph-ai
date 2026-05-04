import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { NodeData } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronDown, ChevronRight, Brain } from 'lucide-react';
import { cn } from '../lib/utils';

export const TextNode = memo(({ data, id, selected }: NodeProps<NodeData>) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showThought, setShowThought] = useState(false);
  const [width, setWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);
  const { getViewport } = useReactFlow();

  const handleMouseUp = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    if (selectedText && data.onSelection && contentRef.current) {
      const range = selection?.getRangeAt(0);
      const rects = range?.getClientRects();
      const mainRect = range?.getBoundingClientRect();
      
      if (mainRect && rects) {
        // Find the "paragraph head" (top-left of the block ancestor)
        let blockAncestor = range?.startContainer.parentElement;
        
        // If the startContainer itself is an element, use it
        if (range?.startContainer.nodeType === Node.ELEMENT_NODE) {
          blockAncestor = range.startContainer as HTMLElement;
        }

        while (blockAncestor && 
               blockAncestor !== contentRef.current && 
               !blockAncestor.classList.contains('paragraph-container') &&
               window.getComputedStyle(blockAncestor).display === 'inline') {
          blockAncestor = blockAncestor.parentElement;
        }
        
        // Ensure we find the .paragraph-container if it's a child of contentRef
        if (blockAncestor && !blockAncestor.classList.contains('paragraph-container')) {
          const closestContainer = blockAncestor.closest('.paragraph-container');
          if (closestContainer && contentRef.current?.contains(closestContainer)) {
            blockAncestor = closestContainer as HTMLElement;
          }
        }

        const blockRect = blockAncestor?.getBoundingClientRect();

        // Calculate paragraph index
        let paragraphIndex = 0;
        if (blockAncestor && blockAncestor.hasAttribute('data-paragraph-index')) {
          paragraphIndex = parseInt(blockAncestor.getAttribute('data-paragraph-index') || '0', 10);
        } else if (blockAncestor && contentRef.current) {
          const containers = Array.from(contentRef.current.querySelectorAll('.paragraph-container'));
          paragraphIndex = containers.indexOf(blockAncestor);
          if (paragraphIndex === -1) {
            paragraphIndex = Array.from(contentRef.current.children).indexOf(blockAncestor);
          }
        }

        data.onSelection(selectedText, id, {
          x: mainRect.left + mainRect.width / 2,
          y: mainRect.top,
          paragraphHead: blockRect ? { x: blockRect.left, y: blockRect.top } : null,
          paragraphIndex: paragraphIndex >= 0 ? paragraphIndex : 0,
          rects: Array.from(rects).map(r => ({
            left: r.left,
            top: r.top,
            width: r.width,
            height: r.height
          }))
        });
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    range.deleteContents();
    
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  // Custom Resize Logic (Top-Right)
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const onMouseMove = (e: MouseEvent) => {
      if (!nodeRef.current) return;
      const { zoom } = getViewport();
      const rect = nodeRef.current.getBoundingClientRect();
      
      // Calculate new width based on mouse position relative to left edge
      const newWidth = (e.clientX - rect.left) / zoom;
      setWidth(Math.max(200, Math.min(1200, newWidth)));
    };

    const onMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isResizing, getViewport]);

  const paragraphCounter = useRef(0);
  paragraphCounter.current = 0;

  const markdownComponents = React.useMemo(() => ({
    p: ({ children, ...props }: any) => {
      const idx = paragraphCounter.current++;
      return (
        <div className="paragraph-container relative group/p px-2 my-1" data-paragraph-index={idx}>
          <Handle 
            type="source" 
            position={Position.Left} 
            id={`handle-p-left-${idx}`}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="opacity-0 group-hover/p:opacity-100 transition-all duration-200"
            style={{ 
              left: -35, 
              top: '50%', 
              transform: 'translateY(-50%)',
              background: 'transparent',
              width: '32px',
              height: '32px',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
              pointerEvents: 'all'
            }}
          >
            <div className="w-2 h-2 bg-indigo-600 rounded-full border-2 border-white shadow-sm hover:scale-150 transition-transform pointer-events-none" />
          </Handle>
          <Handle 
            type="source" 
            position={Position.Right} 
            id={`handle-p-right-${idx}`}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="opacity-0 group-hover/p:opacity-100 transition-all duration-200"
            style={{ 
              right: -35, 
              top: '50%', 
              transform: 'translateY(-50%)',
              background: 'transparent',
              width: '32px',
              height: '32px',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
              pointerEvents: 'all'
            }}
          >
            <div className="w-2 h-2 bg-indigo-600 rounded-full border-2 border-white shadow-sm hover:scale-150 transition-transform pointer-events-none" />
          </Handle>
          <p {...props} className="m-0 whitespace-pre-wrap">{children}</p>
        </div>
      );
    },
    h1: ({ children, ...props }: any) => {
      const idx = paragraphCounter.current++;
      return (
        <div className="paragraph-container relative group/p px-2 my-2" data-paragraph-index={idx}>
          <Handle type="source" position={Position.Left} id={`handle-p-left-${idx}`} onMouseDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} className="opacity-0 group-hover/p:opacity-100 transition-all duration-200" style={{ left: -35, top: '50%', transform: 'translateY(-50%)', background: 'transparent', width: '32px', height: '32px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, pointerEvents: 'all' }}><div className="w-2 h-2 bg-indigo-600 rounded-full border-2 border-white shadow-sm hover:scale-150 transition-transform pointer-events-none" /></Handle>
          <Handle type="source" position={Position.Right} id={`handle-p-right-${idx}`} onMouseDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} className="opacity-0 group-hover/p:opacity-100 transition-all duration-200" style={{ right: -35, top: '50%', transform: 'translateY(-50%)', background: 'transparent', width: '32px', height: '32px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, pointerEvents: 'all' }}><div className="w-2 h-2 bg-indigo-600 rounded-full border-2 border-white shadow-sm hover:scale-150 transition-transform pointer-events-none" /></Handle>
          <h1 {...props} className="m-0 whitespace-pre-wrap">{children}</h1>
        </div>
      );
    },
    h2: ({ children, ...props }: any) => {
      const idx = paragraphCounter.current++;
      return (
        <div className="paragraph-container relative group/p px-2 my-1.5" data-paragraph-index={idx}>
          <Handle type="source" position={Position.Left} id={`handle-p-left-${idx}`} onMouseDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} className="opacity-0 group-hover/p:opacity-100 transition-all duration-200" style={{ left: -35, top: '50%', transform: 'translateY(-50%)', background: 'transparent', width: '32px', height: '32px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, pointerEvents: 'all' }}><div className="w-2 h-2 bg-indigo-600 rounded-full border-2 border-white shadow-sm hover:scale-150 transition-transform pointer-events-none" /></Handle>
          <Handle type="source" position={Position.Right} id={`handle-p-right-${idx}`} onMouseDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} className="opacity-0 group-hover/p:opacity-100 transition-all duration-200" style={{ right: -35, top: '50%', transform: 'translateY(-50%)', background: 'transparent', width: '32px', height: '32px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, pointerEvents: 'all' }}><div className="w-2 h-2 bg-indigo-600 rounded-full border-2 border-white shadow-sm hover:scale-150 transition-transform pointer-events-none" /></Handle>
          <h2 {...props} className="m-0 whitespace-pre-wrap">{children}</h2>
        </div>
      );
    },
    h3: ({ children, ...props }: any) => {
      const idx = paragraphCounter.current++;
      return (
        <div className="paragraph-container relative group/p px-2 my-1" data-paragraph-index={idx}>
          <Handle type="source" position={Position.Left} id={`handle-p-left-${idx}`} onMouseDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} className="opacity-0 group-hover/p:opacity-100 transition-all duration-200" style={{ left: -35, top: '50%', transform: 'translateY(-50%)', background: 'transparent', width: '32px', height: '32px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, pointerEvents: 'all' }}><div className="w-2 h-2 bg-indigo-600 rounded-full border-2 border-white shadow-sm hover:scale-150 transition-transform pointer-events-none" /></Handle>
          <Handle type="source" position={Position.Right} id={`handle-p-right-${idx}`} onMouseDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} className="opacity-0 group-hover/p:opacity-100 transition-all duration-200" style={{ right: -35, top: '50%', transform: 'translateY(-50%)', background: 'transparent', width: '32px', height: '32px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, pointerEvents: 'all' }}><div className="w-2 h-2 bg-indigo-600 rounded-full border-2 border-white shadow-sm hover:scale-150 transition-transform pointer-events-none" /></Handle>
          <h3 {...props} className="m-0 whitespace-pre-wrap">{children}</h3>
        </div>
      );
    },
    ul: ({ children }: any) => <ul className="pl-0 m-0 !my-1 list-disc">{children}</ul>,
    ol: ({ children }: any) => <ol className="pl-0 m-0 !my-1 list-decimal">{children}</ol>,
    hr: () => <div className="border-t border-slate-200 my-4 h-0 w-full" />,
    li: ({ children, ...props }: any) => {
      const idx = paragraphCounter.current++;
      return (
        <div className="paragraph-container relative group/p px-2 my-0.5" data-paragraph-index={idx}>
          <Handle 
            type="source" 
            position={Position.Left} 
            id={`handle-p-left-${idx}`}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="opacity-0 group-hover/p:opacity-100 transition-all duration-200"
            style={{ 
              left: -35, 
              top: '50%', 
              transform: 'translateY(-50%)',
              background: 'transparent',
              width: '32px',
              height: '32px',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
              pointerEvents: 'all'
            }}
          >
            <div className="w-2 h-2 bg-indigo-600 rounded-full border-2 border-white shadow-sm hover:scale-150 transition-transform pointer-events-none" />
          </Handle>
          <Handle 
            type="source" 
            position={Position.Right} 
            id={`handle-p-right-${idx}`}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="opacity-0 group-hover/p:opacity-100 transition-all duration-200"
            style={{ 
              right: -35, 
              top: '50%', 
              transform: 'translateY(-50%)',
              background: 'transparent',
              width: '32px',
              height: '32px',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
              pointerEvents: 'all'
            }}
          >
            <div className="w-2 h-2 bg-indigo-600 rounded-full border-2 border-white shadow-sm hover:scale-150 transition-transform pointer-events-none" />
          </Handle>
          <li {...props} className="ml-6 m-0 whitespace-pre-wrap">{children}</li>
        </div>
      );
    },
  }), []);

  return (
    <div 
      ref={nodeRef}
      style={{ width: `${width}px` }}
      className={cn(
        "px-4 py-3 shadow-lg rounded-lg border-2 bg-white transition-all relative group",
        selected ? "border-indigo-500 ring-2 ring-indigo-200" : "border-slate-200",
        data.type === 'ai-response' ? "bg-indigo-50 border-indigo-200" : "bg-white"
      )}
    >
      {/* Global Target Handle for auto-connections */}
      <Handle 
        type="target" 
        position={Position.Top} 
        id="handle-top"
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ top: -4, background: '#6366f1', width: '12px', height: '6px', borderRadius: '4px', border: 'none', pointerEvents: 'all' }}
      />
      
      {/* Top-Right Resize Handle */}
      <div 
        onMouseDown={startResizing}
        className="nodrag absolute -top-4 -right-4 w-8 h-8 cursor-ne-resize z-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <div className="w-4 h-4 border-t-2 border-r-2 border-indigo-500 rounded-tr-xl shadow-[2px_-2px_0_rgba(255,255,255,0.9)]" />
      </div>
      
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center min-h-[24px] gap-2">
          {isEditing ? (
            <input 
              type="text"
              value={data.label}
              onChange={(e) => data.onLabelChange?.(id, e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              placeholder="标题..."
              className="nodrag text-[10px] font-bold uppercase tracking-wider text-indigo-600 font-mono bg-transparent border-b border-indigo-200 outline-none flex-1 min-w-0"
            />
          ) : data.label ? (
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono flex-1 truncate">
              {data.label}
            </div>
          ) : <div className="flex-1" />}
          <button 
            onClick={() => setIsEditing(!isEditing)}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="text-[10px] text-indigo-500 font-bold hover:underline nodrag px-2 py-1 bg-slate-100 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          >
            {isEditing ? '预览' : '编辑'}
          </button>
        </div>

        {data.thought && !isEditing && (
          <div className="nodrag bg-indigo-50/50 border border-indigo-100 rounded-lg p-2 flex flex-col gap-1 transition-all">
            <button 
              onClick={() => setShowThought(!showThought)}
              onMouseDown={(e) => e.stopPropagation()}
              className="flex items-center gap-2 text-indigo-600/70 hover:text-indigo-600 transition-colors w-full text-left"
            >
              {showThought ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <div className="flex items-center gap-1.5 overflow-hidden">
                <Brain size={12} className="shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider truncate">查看 AI 思考过程</span>
              </div>
            </button>
            
            {showThought && (
              <div className="text-[11px] text-indigo-500/80 italic leading-relaxed pl-5 border-l border-indigo-200 mt-1 animate-in fade-in slide-in-from-top-1">
                {data.thought}
              </div>
            )}
          </div>
        )}

        {isEditing ? (
          <div 
            ref={contentRef}
            onMouseUp={handleMouseUp}
            onPaste={handlePaste}
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => {
              if (data.onChange) {
                data.onChange(id, e.currentTarget.innerText.trim() || '');
              }
            }}
            className="nodrag text-sm text-slate-700 leading-relaxed whitespace-pre-wrap outline-none focus:bg-slate-50 p-1 rounded transition-colors min-h-[1em] cursor-text select-text"
          >
            {data.content}
          </div>
        ) : (
          <div 
            ref={contentRef}
            onMouseUp={handleMouseUp}
            className="nodrag text-sm text-slate-700 leading-relaxed prose prose-slate prose-sm max-w-none cursor-text select-text"
          >
            {/* Reset counter before markdown render */}
            {(() => { paragraphCounter.current = 0; return null; })()}
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {data.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
});

TextNode.displayName = 'TextNode';
