import React from 'react';
import { ReactFlowProvider } from 'reactflow';
import { FlowCanvas } from './components/Flow/FlowCanvas';
import { MainToolbar } from './components/Layout/MainToolbar';
import { AIQuestionPanel } from './panels/AIQuestionPanel';
import { HelpModal } from './panels/HelpModal';
import { SettingsModal } from './panels/SettingsModal';

export default function App() {
  return (
    <ReactFlowProvider>
      <div className="fixed inset-0 bg-slate-50 font-sans overflow-hidden">
        {/* Main Canvas */}
        <FlowCanvas />

        {/* Global UI Overlays */}
        <div className="fixed top-2 left-2 z-50">
          <MainToolbar />
        </div>

        <AIQuestionPanel />
        <HelpModal />
        <SettingsModal />

        {/* Suggestions Overlay (Optional implementation detail) */}
      </div>
    </ReactFlowProvider>
  );
}
