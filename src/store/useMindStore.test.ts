import { describe, it, expect, beforeEach } from 'vitest';
import { useMindStore } from './useMindStore';

describe('useMindStore', () => {
  beforeEach(() => {
    // Reset store or clear board
    useMindStore.getState().clearBoard();
  });

  it('should add a node', () => {
    const { addNode, nodes } = useMindStore.getState();
    expect(nodes.length).toBe(0);
    
    addNode({ id: 'test-node', data: { label: 'Test', content: 'Content', type: 'text' } });
    
    expect(useMindStore.getState().nodes.length).toBe(1);
    expect(useMindStore.getState().nodes[0].data.label).toBe('Test');
  });

  it('should handle clearing the board', () => {
    const { addNode, clearBoard } = useMindStore.getState();
    addNode({ id: '1' });
    clearBoard();
    expect(useMindStore.getState().nodes.length).toBe(0);
    expect(useMindStore.getState().selection).toBeNull();
  });

  it('should update node data', () => {
    const { addNode, updateNodeData } = useMindStore.getState();
    const id = 'node-1';
    addNode({ id });
    
    updateNodeData(id, { label: 'Updated Label' });
    
    expect(useMindStore.getState().nodes[0].data.label).toBe('Updated Label');
  });
});
