import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { Kbd } from '../components/UI/Kbd';
import { useMindStore } from '../store/useMindStore';

export const HelpModal = () => {
  const showHelp = useMindStore(state => state.showHelp);
  const setShowHelp = useMindStore(state => state.setShowHelp);

  if (!showHelp) return null;

  return (
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
            <HelpItem number={1} title="划选 AI 提问">
              在节点内选中文字即可触发。弹出面板后按 <Kbd>Tab</Kbd> 可快速聚焦输入框。
            </HelpItem>
            <HelpItem number={2} title="画布模式切换">
              左侧工具栏可切换缩放模式或滚动模式，方便不同操作习惯。
            </HelpItem>
            <HelpItem number={3} title="高效编辑与删除">
              按 <Kbd>Delete</Kbd> 或 <Kbd>Backspace</Kbd> 快速删除选中的节点或连线。
            </HelpItem>
            <HelpItem number={4} title="手动控制">
              点击左侧 <strong className="text-indigo-600">+</strong> 新建节点。悬停节点边缘拖拽紫色圆点即可手动连线。
            </HelpItem>
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
  );
};

const HelpItem = ({ number, title, children }: { number: number, title: string, children: React.ReactNode }) => (
  <div className="flex gap-4">
    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex-shrink-0 flex items-center justify-center font-bold text-xs">{number}</div>
    <div>
      <h4 className="font-bold text-slate-800 text-sm">{title}</h4>
      <p className="text-xs text-slate-500 leading-relaxed">{children}</p>
    </div>
  </div>
);
