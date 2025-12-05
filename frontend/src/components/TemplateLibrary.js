import React, { useState } from 'react';
import { X, Sparkles, FileText, Users, ShoppingCart, Briefcase, CheckCircle, Clock, TrendingUp } from 'lucide-react';

const TEMPLATES = [
  {
    id: 'approval',
    name: 'Simple Approval Workflow',
    description: 'Basic approval workflow with single approver',
    category: 'Approval',
    icon: CheckCircle,
    color: 'from-purple-500 to-purple-600',
    nodes: [
      { type: 'start', label: 'Start', position: { x: 250, y: 50 } },
      { type: 'task', label: 'Submit Request', position: { x: 250, y: 150 } },
      { type: 'approval', label: 'Manager Approval', position: { x: 250, y: 250 }, data: { approvalType: 'single' } },
      { type: 'decision', label: 'Approved?', position: { x: 250, y: 350 } },
      { type: 'task', label: 'Process Request', position: { x: 100, y: 450 } },
      { type: 'task', label: 'Send Rejection', position: { x: 400, y: 450 } },
      { type: 'end', label: 'End', position: { x: 250, y: 550 } }
    ],
    popularity: 95
  },
  {
    id: 'onboarding',
    name: 'Employee Onboarding',
    description: 'Complete employee onboarding with tasks and forms',
    category: 'HR',
    icon: Users,
    color: 'from-blue-500 to-blue-600',
    nodes: [
      { type: 'start', label: 'Start Onboarding', position: { x: 250, y: 50 } },
      { type: 'form', label: 'Employee Details', position: { x: 250, y: 150 } },
      { type: 'parallel', label: 'Parallel Setup', position: { x: 250, y: 250 } },
      { type: 'task', label: 'IT Setup', position: { x: 100, y: 350 } },
      { type: 'task', label: 'HR Orientation', position: { x: 400, y: 350 } },
      { type: 'merge', label: 'Merge', position: { x: 250, y: 450 } },
      { type: 'end', label: 'Onboarding Complete', position: { x: 250, y: 550 } }
    ],
    popularity: 88
  },
  {
    id: 'purchase',
    name: 'Purchase Order',
    description: 'Multi-level purchase approval with budget checks',
    category: 'Finance',
    icon: ShoppingCart,
    color: 'from-emerald-500 to-emerald-600',
    nodes: [
      { type: 'start', label: 'Start', position: { x: 250, y: 50 } },
      { type: 'form', label: 'Purchase Request Form', position: { x: 250, y: 150 } },
      { type: 'decision', label: 'Amount > $5000?', position: { x: 250, y: 250 } },
      { type: 'approval', label: 'Manager Approval', position: { x: 100, y: 350 } },
      { type: 'approval', label: 'Director Approval', position: { x: 400, y: 350 } },
      { type: 'task', label: 'Process Order', position: { x: 250, y: 450 } },
      { type: 'end', label: 'End', position: { x: 250, y: 550 } }
    ],
    popularity: 82
  },
  {
    id: 'timeoff',
    name: 'Time Off Request',
    description: 'Simple time off approval workflow',
    category: 'HR',
    icon: Clock,
    color: 'from-amber-500 to-amber-600',
    nodes: [
      { type: 'start', label: 'Start', position: { x: 250, y: 50 } },
      { type: 'form', label: 'Time Off Request', position: { x: 250, y: 150 } },
      { type: 'approval', label: 'Manager Approval', position: { x: 250, y: 250 } },
      { type: 'action', label: 'Update Calendar', position: { x: 250, y: 350 }, data: { actionType: 'http' } },
      { type: 'end', label: 'End', position: { x: 250, y: 450 } }
    ],
    popularity: 90
  },
  {
    id: 'contract',
    name: 'Contract Review',
    description: 'Legal contract review and approval',
    category: 'Legal',
    icon: FileText,
    color: 'from-indigo-500 to-indigo-600',
    nodes: [
      { type: 'start', label: 'Start', position: { x: 250, y: 50 } },
      { type: 'task', label: 'Initial Review', position: { x: 250, y: 150 } },
      { type: 'approval', label: 'Legal Approval', position: { x: 250, y: 250 }, data: { approvalType: 'sequential' } },
      { type: 'decision', label: 'Changes Required?', position: { x: 250, y: 350 } },
      { type: 'task', label: 'Make Changes', position: { x: 400, y: 250 } },
      { type: 'task', label: 'Finalize Contract', position: { x: 250, y: 450 } },
      { type: 'end', label: 'End', position: { x: 250, y: 550 } }
    ],
    popularity: 75
  },
  {
    id: 'sales',
    name: 'Sales Lead Processing',
    description: 'Automated sales lead qualification and assignment',
    category: 'Sales',
    icon: TrendingUp,
    color: 'from-rose-500 to-rose-600',
    nodes: [
      { type: 'start', label: 'New Lead', position: { x: 250, y: 50 } },
      { type: 'form', label: 'Lead Information', position: { x: 250, y: 150 } },
      { type: 'decision', label: 'Qualified?', position: { x: 250, y: 250 } },
      { type: 'task', label: 'Assign to Sales Rep', position: { x: 100, y: 350 } },
      { type: 'task', label: 'Send Nurture Email', position: { x: 400, y: 350 } },
      { type: 'end', label: 'End', position: { x: 250, y: 450 } }
    ],
    popularity: 78
  }
];

const TemplateLibrary = ({ isOpen, onClose, onSelectTemplate }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  if (!isOpen) return null;

  const categories = ['all', ...new Set(TEMPLATES.map(t => t.category))];

  const filteredTemplates = TEMPLATES.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleUseTemplate = (template) => {
    const workflowData = {
      id: null,
      name: template.name,
      description: template.description,
      nodes: template.nodes.map((node, idx) => ({
        id: `node-${idx + 1}`,
        type: node.type,
        position: node.position,
        data: {
          label: node.label,
          type: node.type,
          description: '',
          ...node.data
        }
      })),
      edges: [],
      status: 'draft',
      version: 1,
      tags: [template.category]
    };
    onSelectTemplate(workflowData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-bold">Workflow Templates</h2>
                <p className="text-primary-100 text-sm">Start with a pre-built workflow</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              data-testid="close-template-library"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              data-testid="search-templates"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              data-testid="filter-category"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => {
              const IconComponent = template.icon;
              return (
                <div
                  key={template.id}
                  className="group relative bg-white border-2 border-slate-200 rounded-xl p-4 cursor-pointer transition-all hover:border-primary-300 hover:shadow-xl hover:shadow-primary-500/20"
                  onClick={() => setSelectedTemplate(template)}
                  data-testid={`template-${template.id}`}
                >
                  {/* Popularity Badge */}
                  <div className="absolute top-2 right-2 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full flex items-center space-x-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>{template.popularity}%</span>
                  </div>

                  {/* Icon */}
                  <div className={`w-12 h-12 bg-gradient-to-br ${template.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-primary-600 transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                    {template.description}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full font-medium">
                      {template.category}
                    </span>
                    <span className="text-slate-500">
                      {template.nodes.length} nodes
                    </span>
                  </div>

                  {/* Hover Action */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/90 to-primary-600/90 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUseTemplate(template);
                      }}
                      className="bg-white text-primary-600 px-6 py-2 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
                      data-testid={`use-template-${template.id}`}
                    >
                      Use Template
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <Sparkles className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No templates found</h3>
              <p className="text-slate-500">Try adjusting your search or filters</p>
            </div>
          )}
        </div>

        {/* Preview Modal */}
        {selectedTemplate && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {React.createElement(selectedTemplate.icon, { className: 'w-8 h-8 text-primary-600' })}
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedTemplate.name}</h3>
                  <p className="text-slate-600">{selectedTemplate.description}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="text-slate-500 hover:text-slate-700 p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 bg-slate-50 rounded-xl p-4 overflow-auto mb-4">
              <h4 className="font-semibold text-slate-900 mb-3">Workflow Steps:</h4>
              <div className="space-y-2">
                {selectedTemplate.nodes.map((node, idx) => (
                  <div key={idx} className="flex items-center space-x-3 bg-white rounded-lg p-3 border border-slate-200">
                    <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center font-semibold text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{node.label}</div>
                      <div className="text-xs text-slate-500 capitalize">{node.type}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedTemplate(null)}
                className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => handleUseTemplate(selectedTemplate)}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-primary-500/40 transition-all"
                data-testid="confirm-use-template"
              >
                Use This Template
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateLibrary;
