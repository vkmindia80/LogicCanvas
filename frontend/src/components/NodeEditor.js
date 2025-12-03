import React, { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { NODE_CONFIGS } from '../utils/nodeTypes';
import ExpressionEditor from './ExpressionEditor';

const NodeEditor = ({ node, onUpdate, onDelete, onClose }) => {
  const [label, setLabel] = useState(node?.data?.label || '');
  const [description, setDescription] = useState(node?.data?.description || '');
  const [condition, setCondition] = useState(node?.data?.condition || '');
  const [actionType, setActionType] = useState(node?.data?.actionType || 'http');
  const [actionUrl, setActionUrl] = useState(node?.data?.url || '');
  const [actionMethod, setActionMethod] = useState(node?.data?.method || 'GET');

  useEffect(() => {
    if (node) {
      setLabel(node.data?.label || '');
      setDescription(node.data?.description || '');
    }
  }, [node]);

  if (!node) return null;

  const config = NODE_CONFIGS[node.data.type];

  const handleSave = () => {
    onUpdate(node.id, {
      data: {
        ...node.data,
        label,
        description
      }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className={`${config.color} ${config.borderColor} border-b-2 p-4 text-white`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Edit {config.label} Node</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            data-testid="node-editor-close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Label */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Label *
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter node label"
            data-testid="node-editor-label"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter node description"
            data-testid="node-editor-description"
          />
        </div>

        {/* Node ID */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Node ID
          </label>
          <div className="text-xs text-slate-500 font-mono bg-slate-50 p-2 rounded">
            {node.id}
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2 pt-2">
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
            data-testid="node-editor-save"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
          <button
            onClick={() => onDelete(node.id)}
            className="flex items-center justify-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            data-testid="node-editor-delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NodeEditor;
