import React, { useState, useEffect } from 'react';
import { Plus, Search, FileText, Edit, Trash2, Copy, Tag, ClipboardList } from 'lucide-react';
import { useRole } from '../../contexts/RoleContext';
import EmptyState from '../EmptyState';
import Tooltip from '../Tooltip';
import { SkeletonCard } from '../Skeleton';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const FormList = ({ onSelectForm, onCreateNew, onNotify }) => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  const { can } = useRole();

  const fetchForms = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/forms`);
      const data = await response.json();
      setForms(data.forms || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch forms:', error);
      onNotify?.('Failed to fetch forms', 'error');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const handleDelete = async (formId, e) => {
    e.stopPropagation();
    if (!can('deleteForms')) {
      onNotify?.('You do not have permission to delete forms.', 'error');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this form?')) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/forms/${formId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        onNotify?.(body.detail || 'Failed to delete form', 'error');
        return;
      }
      onNotify?.('Form deleted', 'success');
      fetchForms();
    } catch (error) {
      console.error('Failed to delete form:', error);
      onNotify?.('Failed to delete form', 'error');
    }
  };

  const handleDuplicate = async (form, e) => {
    e.stopPropagation();
    if (!can('duplicateForms')) {
      onNotify?.('You do not have permission to duplicate forms.', 'error');
      return;
    }

    const duplicatedForm = {
      ...form,
      id: null,
      name: `${form.name} (Copy)`,
      created_at: null,
      updated_at: null,
    };

    try {
      const response = await fetch(`${BACKEND_URL}/api/forms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicatedForm),
      });

      if (response.ok) {
        onNotify?.('Form duplicated', 'success');
        fetchForms();
      } else {
        const body = await response.json().catch(() => ({}));
        onNotify?.(body.detail || 'Failed to duplicate form', 'error');
      }
    } catch (error) {
      console.error('Failed to duplicate form:', error);
      onNotify?.('Failed to duplicate form', 'error');
    }
  };

  const filteredForms = forms.filter(form => {
    const matchesSearch = form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         form.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || (form.tags && form.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  const allTags = [...new Set(forms.flatMap(f => f.tags || []))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="mb-2 bg-gradient-to-r from-primary-900 to-primary-700 bg-clip-text text-4xl font-bold text-transparent">Form Library</h2>
              <p className="text-lg text-primary-600">Create and manage reusable forms</p>
            </div>
            {can('manageForms') && (
              <button
                onClick={onCreateNew}
                className="group flex items-center space-x-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-3 text-white shadow-lg shadow-primary-500/30 transition-all hover:shadow-xl hover:shadow-primary-500/40"
                data-testid="create-new-form-btn"
              >
                <Plus className="w-5 h-5" />
                <span className="font-semibold">Create New Form</span>
              </button>
            )}
          </div>

          {/* Search and Filter */}
          <div className="rounded-2xl border border-green-200 bg-white p-6 shadow-xl shadow-green-200/50">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search forms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-green-200 bg-green-50 rounded-xl text-sm font-medium placeholder:text-green-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  data-testid="search-forms-input"
                />
              </div>
              {allTags.length > 0 && (
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="px-4 py-3 border-2 border-green-200 bg-green-50 rounded-xl text-sm font-medium focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  data-testid="filter-by-tag-select"
                >
                  <option value="">All Tags</option>
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Forms Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredForms.length === 0 ? (
        <EmptyState
          icon={searchTerm || selectedTag ? Search : ClipboardList}
          title={searchTerm || selectedTag ? 'No forms found' : 'No forms yet'}
          description={
            searchTerm || selectedTag
              ? 'No forms match your current filters. Try adjusting your search term or tag filter.'
              : 'Forms allow you to collect structured data in your workflows. Create your first form to get started.'
          }
          action={
            !searchTerm && !selectedTag && can('manageForms') ? (
              <button
                onClick={onCreateNew}
                className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-3 text-white font-semibold shadow-lg shadow-primary-500/30 transition-all hover:shadow-xl hover:shadow-primary-500/40"
              >
                <Plus className="w-5 h-5" />
                <span>Create Your First Form</span>
              </button>
            ) : null
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredForms.map((form) => (
            <div
              key={form.id}
              onClick={() => {
                if (can('manageForms')) {
                  onSelectForm(form);
                }
              }}
              className="bg-white border-2 border-green-200 rounded-2xl p-6 hover:border-primary-300 hover:shadow-2xl hover:shadow-primary-500/20 shadow-lg shadow-green-200/50 transition-all cursor-pointer group"
              data-testid={`form-card-${form.id}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-primary-900 group-hover:text-primary-600 transition-colors">
                      {form.name}
                    </h3>
                    <p className="text-sm text-green-500">v{form.version}</p>
                  </div>
                </div>
              </div>

              {form.description && (
                <p className="text-primary-600 text-sm mb-4 line-clamp-2">{form.description}</p>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-green-500">
                  {form.fields?.length || 0} fields
                </span>
                <div className="flex space-x-2">
                  {can('duplicateForms') && (
                    <button
                      onClick={(e) => handleDuplicate(form, e)}
                      className="p-2 text-green-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                      title="Duplicate"
                      data-testid={`duplicate-form-${form.id}`}
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                  {can('manageForms') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectForm(form);
                      }}
                      className="p-2 text-green-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                      title="Edit"
                      data-testid={`edit-form-${form.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  {can('deleteForms') && (
                    <button
                      onClick={(e) => handleDelete(form.id, e)}
                      className="p-2 text-green-400 hover:text-gold-600 hover:bg-gold-50 rounded transition-colors"
                      title="Delete"
                      data-testid={`delete-form-${form.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {form.tags && form.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-green-100">
                  {form.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center space-x-1 px-2 py-1 bg-green-100 text-primary-600 text-xs rounded-full"
                    >
                      <Tag className="w-3 h-3" />
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FormList;
