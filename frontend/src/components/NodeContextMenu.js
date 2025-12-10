import React, { useEffect, useRef } from 'react';
import { 
  Copy, Trash2, Edit, Play, Pause, Eye, Code, Link, 
  MessageSquare, Tag, Bookmark, AlertTriangle 
} from 'lucide-react';

const NodeContextMenu = ({ 
  node, 
  position, 
  onClose, 
  onEdit, 
  onDuplicate, 
  onDelete,
  onExecute,
  onAddComment,
  onViewDetails
}) => {
  const menuRef = useRef(null);

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

  const menuItems = [
    {
      icon: Edit,
      label: 'Edit Properties',
      action: () => { onEdit(node); onClose(); },
      color: 'text-blue-600',
      show: true
    },
    {
      icon: Copy,
      label: 'Duplicate',
      action: () => { onDuplicate(node.id); onClose(); },
      color: 'text-green-600',
      show: true
    },
    {
      icon: Eye,
      label: 'View Details',
      action: () => { onViewDetails?.(node); onClose(); },
      color: 'text-purple-600',
      show: !!onViewDetails
    },
    {
      icon: Play,
      label: 'Test Execute',
      action: () => { onExecute?.(node); onClose(); },
      color: 'text-indigo-600',
      show: !!onExecute
    },
    {
      icon: MessageSquare,
      label: 'Add Comment',
      action: () => { onAddComment?.(node); onClose(); },
      color: 'text-amber-600',
      show: !!onAddComment
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
    },
    {
      icon: Trash2,
      label: 'Delete',
      action: () => { onDelete(node.id); onClose(); },
      color: 'text-red-600',
      show: true,
      separator: true
    }
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] bg-white rounded-lg shadow-2xl border-2 border-gray-200 py-2 min-w-[200px] animate-scale-in"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {/* Header */}
      <div className="px-4 py-2 border-b border-gray-200">
        <div className="font-semibold text-sm text-gray-900 truncate">
          {node.data?.label || 'Node'}
        </div>
        <div className="text-xs text-gray-500">
          {node.data?.type || node.type}
        </div>
      </div>

      {/* Menu Items */}
      <div className="py-1">
        {menuItems
          .filter(item => item.show)
          .map((item, index) => (
            <React.Fragment key={index}>
              {item.separator && <div className="my-1 border-t border-gray-200" />}
              <button
                onClick={item.action}
                className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors"
              >
                <item.icon className={`w-4 h-4 ${item.color}`} />
                <span className="text-sm text-gray-700">{item.label}</span>
              </button>
            </React.Fragment>
          ))}
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.15s ease-out;
        }
      `}</style>
    </div>
  );
};

export default NodeContextMenu;
