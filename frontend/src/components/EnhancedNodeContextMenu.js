import React, { useEffect, useRef, useState } from 'react';
import { 
  Copy, Trash2, Edit, Play, Pause, Eye, Code, Link, 
  MessageSquare, Tag, Bookmark, AlertTriangle, FileText,
  Layers, GitBranch, Shield, Zap, Settings, Info,
  RotateCw, CheckCircle, XCircle, Clock
} from 'lucide-react';

const EnhancedNodeContextMenu = ({ 
  node, 
  position, 
  onClose, 
  onEdit, 
  onDuplicate, 
  onDelete,
  onExecute,
  onAddAnnotation,
  onAssignToLane,
  onAddConnection,
  onViewDetails,
  onToggleBreakpoint,
  onSetTimeout,
  availableLanes = []
}) => {
  const menuRef = useRef(null);
  const [showLaneSubmenu, setShowLaneSubmenu] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const getStatusColor = () => {
    const status = node?.data?.executionState;
    switch (status) {
      case 'completed': return 'bg-green-50 border-green-300';
      case 'failed': return 'bg-red-50 border-red-300';
      case 'running': return 'bg-blue-50 border-blue-300';
      case 'waiting': return 'bg-amber-50 border-amber-300';
      default: return 'bg-white border-gray-200';
    }
  };

  const getStatusIcon = () => {
    const status = node?.data?.executionState;
    switch (status) {
      case 'completed': return <CheckCircle className=\"w-4 h-4 text-green-600\" />;
      case 'failed': return <XCircle className=\"w-4 h-4 text-red-600\" />;
      case 'running': return <RotateCw className=\"w-4 h-4 text-blue-600 animate-spin\" />;
      case 'waiting': return <Clock className=\"w-4 h-4 text-amber-600\" />;
      default: return null;
    }
  };

  const quickActions = [
    {
      section: 'Edit',
      items: [
        {
          icon: Edit,
          label: 'Edit Properties',
          shortcut: 'E',
          action: () => { onEdit(node); onClose(); },
          color: 'text-blue-600',
          show: true
        },
        {
          icon: Copy,
          label: 'Duplicate Node',
          shortcut: 'Ctrl+D',
          action: () => { onDuplicate(node.id); onClose(); },
          color: 'text-green-600',
          show: true
        },
        {
          icon: Code,
          label: 'Copy Node ID',
          action: () => { 
            navigator.clipboard.writeText(node.id);
            alert('Node ID copied!');
            onClose();
          },
          color: 'text-gray-600',
          show: true
        }
      ]
    },
    {
      section: 'Documentation',
      items: [
        {
          icon: FileText,
          label: 'Add Annotation',
          action: () => { onAddAnnotation?.(node); onClose(); },
          color: 'text-amber-600',
          show: !!onAddAnnotation
        },
        {
          icon: Eye,
          label: 'View Details',
          action: () => { onViewDetails?.(node); onClose(); },
          color: 'text-purple-600',
          show: !!onViewDetails
        },
        {
          icon: Info,
          label: 'Node Information',
          action: () => { 
            alert(`Node Type: ${node.type}\\nID: ${node.id}\\nLabel: ${node.data?.label || 'N/A'}`);
            onClose();
          },
          color: 'text-cyan-600',
          show: true
        }
      ]
    },
    {
      section: 'Organization',
      items: [
        {
          icon: Layers,
          label: 'Assign to Lane',
          submenu: true,
          action: () => setShowLaneSubmenu(!showLaneSubmenu),
          color: 'text-purple-600',
          show: availableLanes.length > 0
        },
        {
          icon: Tag,
          label: 'Add Tag',
          action: () => { 
            const tag = prompt('Enter tag:');
            if (tag) {
              // TODO: Implement tagging
            }
            onClose();
          },
          color: 'text-pink-600',
          show: true
        },
        {
          icon: Bookmark,
          label: 'Mark as Important',
          action: () => { 
            // TODO: Implement importance marking
            onClose();
          },
          color: 'text-yellow-600',
          show: true
        }
      ]
    },
    {
      section: 'Execution',
      items: [
        {
          icon: Play,
          label: 'Test Execute',
          action: () => { onExecute?.(node); onClose(); },
          color: 'text-indigo-600',
          show: !!onExecute
        },
        {
          icon: Shield,
          label: 'Toggle Breakpoint',
          action: () => { onToggleBreakpoint?.(node); onClose(); },
          color: 'text-red-600',
          show: !!onToggleBreakpoint
        },
        {
          icon: Clock,
          label: 'Set Timeout',
          action: () => { onSetTimeout?.(node); onClose(); },
          color: 'text-orange-600',
          show: !!onSetTimeout
        }
      ]
    },
    {
      section: 'Connections',
      items: [
        {
          icon: Link,
          label: 'Add Connection',
          action: () => { onAddConnection?.(node); onClose(); },
          color: 'text-teal-600',
          show: !!onAddConnection
        },
        {
          icon: GitBranch,
          label: 'View Connections',
          action: () => { 
            // TODO: Show connections panel
            onClose();
          },
          color: 'text-blue-600',
          show: true
        }
      ]
    },
    {
      section: 'Danger Zone',
      items: [
        {
          icon: Trash2,
          label: 'Delete Node',
          shortcut: 'Del',
          action: () => { 
            if (window.confirm('Delete this node?')) {
              onDelete(node.id); 
              onClose();
            }
          },
          color: 'text-red-600',
          show: true,
          danger: true
        }
      ]
    }
  ];

  return (
    <div
      ref={menuRef}
      className=\"fixed z-50 animate-fadeIn\"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div className={`bg-white rounded-xl shadow-2xl border-2 ${getStatusColor()} min-w-[240px] overflow-hidden`}>
        {/* Node Header */}
        <div className=\"p-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50\">
          <div className=\"flex items-center gap-2\">
            {getStatusIcon()}
            <div className=\"flex-1 min-w-0\">
              <div className=\"font-semibold text-sm text-gray-900 truncate\">
                {node?.data?.label || 'Node'}
              </div>
              <div className=\"text-xs text-gray-600 truncate\">
                {node?.type}
              </div>
            </div>
            <Settings className=\"w-4 h-4 text-gray-400\" />
          </div>
        </div>

        {/* Menu Sections */}
        <div className=\"max-h-[500px] overflow-y-auto\">
          {quickActions.map((section, sectionIdx) => {
            const visibleItems = section.items.filter(item => item.show);
            if (visibleItems.length === 0) return null;

            return (
              <div key={sectionIdx} className=\"py-1\">
                {section.section && (
                  <div className=\"px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider\">
                    {section.section}
                  </div>
                )}
                {visibleItems.map((item, itemIdx) => {
                  const Icon = item.icon;
                  return (
                    <div key={itemIdx} className=\"relative\">
                      <button
                        onClick={item.action}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center justify-between group ${
                          item.danger ? 'hover:bg-red-50' : ''
                        }`}
                      >
                        <div className=\"flex items-center gap-3\">
                          <Icon className={`w-4 h-4 ${item.color}`} />
                          <span className={`text-sm font-medium ${item.danger ? 'text-red-600' : 'text-gray-700'}`}>
                            {item.label}
                          </span>
                        </div>
                        {item.shortcut && (
                          <span className=\"text-xs text-gray-400 font-mono\">
                            {item.shortcut}
                          </span>
                        )}
                        {item.submenu && (
                          <span className=\"text-xs text-gray-400\">▶</span>
                        )}
                      </button>

                      {/* Lane Submenu */}
                      {item.submenu && showLaneSubmenu && (
                        <div className=\"absolute left-full top-0 ml-1 bg-white rounded-lg shadow-xl border-2 border-gray-200 min-w-[180px] z-50\">
                          <div className=\"p-2\">
                            <div className=\"text-xs font-semibold text-gray-600 mb-2 px-2\">
                              Select Lane
                            </div>
                            {availableLanes.map((lane, laneIdx) => (
                              <button
                                key={laneIdx}
                                onClick={() => {
                                  onAssignToLane?.(node.id, lane.id);
                                  onClose();
                                }}
                                className=\"w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2\"
                              >
                                <div 
                                  className=\"w-3 h-3 rounded-full\" 
                                  style={{ backgroundColor: lane.color }}
                                />
                                <span className=\"text-sm text-gray-700\">{lane.name}</span>
                              </button>
                            ))}
                            <button
                              onClick={() => {
                                onAssignToLane?.(node.id, null);
                                onClose();
                              }}
                              className=\"w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-500 mt-1 border-t border-gray-100\"
                            >
                              Remove from lane
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className=\"px-3 py-2 border-t border-gray-200 bg-gray-50\">
          <div className=\"text-xs text-gray-500 text-center\">
            Right-click for more options
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedNodeContextMenu;
