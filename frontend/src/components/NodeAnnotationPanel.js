import React, { useState } from 'react';
import { FileText, Plus, X, Edit2, Trash2, MessageSquare, AlertTriangle, Info, Lightbulb } from 'lucide-react';

const NodeAnnotationPanel = ({ node, onUpdate, onClose }) => {
  const annotations = node?.data?.annotations || [];
  const [newAnnotation, setNewAnnotation] = useState('');
  const [annotationType, setAnnotationType] = useState('note');
  const [editingIndex, setEditingIndex] = useState(null);

  const annotationTypes = [
    { value: 'note', label: 'Note', icon: MessageSquare, color: 'blue' },
    { value: 'warning', label: 'Warning', icon: AlertTriangle, color: 'amber' },
    { value: 'info', label: 'Info', icon: Info, color: 'cyan' },
    { value: 'tip', label: 'Tip', icon: Lightbulb, color: 'yellow' }
  ];

  const handleAddAnnotation = () => {
    if (!newAnnotation.trim()) return;

    const annotation = {
      id: `ann-${Date.now()}`,
      type: annotationType,
      text: newAnnotation,
      createdAt: new Date().toISOString(),
      author: 'current-user' // TODO: Get from auth context
    };

    const updatedAnnotations = [...annotations, annotation];
    onUpdate(node.id, {
      ...node,
      data: {
        ...node.data,
        annotations: updatedAnnotations
      }
    });

    setNewAnnotation('');
    setAnnotationType('note');
  };

  const handleDeleteAnnotation = (index) => {
    const updatedAnnotations = annotations.filter((_, i) => i !== index);
    onUpdate(node.id, {
      ...node,
      data: {
        ...node.data,
        annotations: updatedAnnotations
      }
    });
  };

  const getTypeConfig = (type) => {
    return annotationTypes.find(t => t.value === type) || annotationTypes[0];
  };

  return (
    <div className="fixed right-4 top-20 z-50 bg-white rounded-xl shadow-2xl border-2 border-gray-200 w-96 max-h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-gray-900">Annotations</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/50 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Add notes and comments to {node?.data?.label || 'this node'}
        </p>
      </div>

      {/* Annotations List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {annotations.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No annotations yet</p>
            <p className="text-xs mt-1">Add notes to document this node</p>
          </div>
        ) : (
          annotations.map((annotation, index) => {
            const typeConfig = getTypeConfig(annotation.type);
            const Icon = typeConfig.icon;
            
            return (
              <div
                key={annotation.id || index}
                className={`border-2 rounded-lg p-3 bg-${typeConfig.color}-50 border-${typeConfig.color}-200`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 text-${typeConfig.color}-600`} />
                    <span className={`text-xs font-semibold text-${typeConfig.color}-900`}>
                      {typeConfig.label}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteAnnotation(index)}
                    className="p-1 hover:bg-white/50 rounded transition-colors"
                    title="Delete annotation"
                  >
                    <Trash2 className="w-3 h-3 text-red-600" />
                  </button>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {annotation.text}
                </p>
                <div className="text-xs text-gray-500 mt-2">
                  {new Date(annotation.createdAt).toLocaleString()}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Annotation Form */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="mb-2">
          <label className="text-xs font-semibold text-gray-700 mb-1 block">
            Type
          </label>
          <div className="flex gap-2">
            {annotationTypes.map(type => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  onClick={() => setAnnotationType(type.value)}
                  className={`flex-1 p-2 rounded-lg border-2 transition-all flex items-center justify-center gap-1 ${
                    annotationType === type.value
                      ? `bg-${type.color}-100 border-${type.color}-400`
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-3 h-3 ${annotationType === type.value ? `text-${type.color}-600` : 'text-gray-600'}`} />
                  <span className="text-xs font-medium">{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        
        <textarea
          value={newAnnotation}
          onChange={(e) => setNewAnnotation(e.target.value)}
          placeholder="Add your annotation here..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
          rows={3}
        />
        
        <button
          onClick={handleAddAnnotation}
          disabled={!newAnnotation.trim()}
          className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Add Annotation
        </button>
      </div>
    </div>
  );
};

export default NodeAnnotationPanel;
