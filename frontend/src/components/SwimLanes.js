import React, { useState, useCallback } from 'react';
import { Plus, X, Edit2, Trash2, Users, Building, Layers } from 'lucide-react';

const SwimLanes = ({ lanes, onUpdateLanes, nodes, onUpdateNodeLane }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingLane, setEditingLane] = useState(null);
  const [newLaneName, setNewLaneName] = useState('');
  const [showLaneForm, setShowLaneForm] = useState(false);

  const handleAddLane = () => {
    if (!newLaneName.trim()) return;
    
    const newLane = {
      id: `lane-${Date.now()}`,
      name: newLaneName,
      color: getRandomColor(),
      order: lanes.length
    };
    
    onUpdateLanes([...lanes, newLane]);
    setNewLaneName('');
    setShowLaneForm(false);
  };

  const handleDeleteLane = (laneId) => {
    if (window.confirm('Delete this swim lane? Nodes in this lane will be moved to "Unassigned".')) {
      onUpdateLanes(lanes.filter(l => l.id !== laneId));
      
      // Update nodes in this lane
      nodes
        .filter(n => n.data?.laneId === laneId)
        .forEach(node => {
          onUpdateNodeLane(node.id, null);
        });
    }
  };

  const handleEditLane = (lane) => {
    setEditingLane(lane);
    setNewLaneName(lane.name);
    setShowLaneForm(true);
  };

  const handleSaveEdit = () => {
    if (!newLaneName.trim() || !editingLane) return;
    
    const updatedLanes = lanes.map(l =>
      l.id === editingLane.id ? { ...l, name: newLaneName } : l
    );
    
    onUpdateLanes(updatedLanes);
    setEditingLane(null);
    setNewLaneName('');
    setShowLaneForm(false);
  };

  const getRandomColor = () => {
    const colors = [
      '#eff6ff', '#f0fdf4', '#fef3c7', '#fce7f3', '#f3e8ff',
      '#e0f2fe', '#d1fae5', '#fed7aa', '#fbcfe8', '#ddd6fe'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const getNodesInLane = (laneId) => {
    return nodes.filter(n => n.data?.laneId === laneId).length;
  };

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="fixed right-4 top-20 z-40 bg-white border-2 border-gray-200 rounded-lg px-4 py-2 shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-sm font-medium text-gray-700 hover:border-blue-400"
      >
        <Layers className="w-4 h-4" />
        Swim Lanes
      </button>
    );
  }

  return (
    <div className="fixed right-4 top-20 z-40 bg-white border-2 border-gray-200 rounded-xl shadow-2xl w-80 max-h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-gray-900">Swim Lanes</h3>
          </div>
          <button
            onClick={() => setIsEditing(false)}
            className="p-1 hover:bg-white/50 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Organize workflow by roles or departments
        </p>
      </div>

      {/* Lanes List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {lanes.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Layers className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No swim lanes yet</p>
            <p className="text-xs mt-1">Create lanes to organize your workflow</p>
          </div>
        ) : (
          lanes.map(lane => (
            <div
              key={lane.id}
              className="border-2 border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-all"
              style={{ backgroundColor: lane.color }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">
                    {lane.name}
                  </div>
                  <div className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {getNodesInLane(lane.id)} nodes
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEditLane(lane)}
                    className="p-1 hover:bg-white/50 rounded transition-colors"
                    title="Edit lane"
                  >
                    <Edit2 className="w-3 h-3 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDeleteLane(lane.id)}
                    className="p-1 hover:bg-red-50 rounded transition-colors"
                    title="Delete lane"
                  >
                    <Trash2 className="w-3 h-3 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Lane Form */}
      {showLaneForm && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <input
            type="text"
            value={newLaneName}
            onChange={(e) => setNewLaneName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (editingLane ? handleSaveEdit() : handleAddLane())}
            placeholder="Lane name (e.g., Sales, Engineering)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={editingLane ? handleSaveEdit : handleAddLane}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              {editingLane ? 'Save' : 'Add Lane'}
            </button>
            <button
              onClick={() => {
                setShowLaneForm(false);
                setEditingLane(null);
                setNewLaneName('');
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add Button */}
      {!showLaneForm && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => setShowLaneForm(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Swim Lane
          </button>
        </div>
      )}

      {/* Info Footer */}
      <div className="p-3 border-t border-gray-200 bg-blue-50">
        <p className="text-xs text-gray-600">
          💡 <strong>Tip:</strong> Assign nodes to lanes from the node editor to organize your workflow visually
        </p>
      </div>
    </div>
  );
};

export default SwimLanes;
