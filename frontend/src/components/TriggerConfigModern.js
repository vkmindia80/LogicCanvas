import React, { useState, useEffect } from 'react';
import { Clock, Webhook, Zap, Trash2, Plus, X } from 'lucide-react';
import { modernButtonStyles, modernInputStyles, modernCardStyles } from '../utils/modernDesignSystem';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const TriggerConfig = ({ workflowId }) => {
  const [triggers, setTriggers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [triggerType, setTriggerType] = useState('manual');
  const [cronExpression, setCronExpression] = useState('0 0 * * *');
  const [loading, setLoading] = useState(true);

  const loadTriggers = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/triggers?workflow_id=${workflowId}`);
      const data = await response.json();
      setTriggers(data.triggers || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load triggers:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTriggers();
  }, [workflowId]);

  const handleCreateTrigger = async () => {
    const config = {};
    if (triggerType === 'scheduled') {
      config.cron = cronExpression;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/triggers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_id: workflowId,
          trigger_type: triggerType,
          config
        })
      });
      const data = await response.json();
      alert('Trigger created successfully');
      setShowForm(false);
      loadTriggers();
    } catch (error) {
      alert('Failed to create trigger: ' + error.message);
    }
  };

  const handleDeleteTrigger = async (triggerId) => {
    if (!window.confirm('Delete this trigger?')) return;

    try {
      await fetch(`${BACKEND_URL}/api/triggers/${triggerId}`, {
        method: 'DELETE'
      });
      loadTriggers();
    } catch (error) {
      alert('Failed to delete trigger: ' + error.message);
    }
  };

  const getTriggerIcon = (type) => {
    switch (type) {
      case 'scheduled': return <Clock className="w-5 h-5 text-indigo-600" />;
      case 'webhook': return <Webhook className="w-5 h-5 text-purple-600" />;
      default: return <Zap className="w-5 h-5 text-cyan-600" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Workflow Triggers</h3>
            <p className="text-sm text-slate-600 mt-0.5">Configure when this workflow should run</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className={modernButtonStyles.primary}
            data-testid="add-trigger-button"
          >
            <Plus className="w-4 h-4" />
            <span>Add Trigger</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {showForm && (
          <div className="mb-6 p-5 bg-indigo-50 rounded-xl border border-indigo-200">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Trigger Type
                </label>
                <select
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value)}
                  className={modernInputStyles.base}
                  data-testid="trigger-type-select"
                >
                  <option value="manual">⚡ Manual</option>
                  <option value="scheduled">🕐 Scheduled (Cron)</option>
                  <option value="webhook">🔗 Webhook</option>
                </select>
              </div>

              {triggerType === 'scheduled' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Cron Expression
                  </label>
                  <input
                    type="text"
                    value={cronExpression}
                    onChange={(e) => setCronExpression(e.target.value)}
                    placeholder="0 0 * * * (Daily at midnight)"
                    className={modernInputStyles.base}
                    data-testid="cron-expression-input"
                  />
                  <p className="text-xs text-slate-600 mt-2">
                    Format: minute hour day month weekday
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleCreateTrigger}
                  className={modernButtonStyles.primary}
                  data-testid="create-trigger-button"
                >
                  Create Trigger
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className={modernButtonStyles.secondary}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm text-slate-600">Loading triggers...</p>
          </div>
        ) : triggers.length === 0 ? (
          <div className="text-center py-12">
            <Zap className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-600 font-medium">No triggers configured</p>
            <p className="text-sm text-slate-500 mt-1">Add a trigger to automate workflow execution</p>
          </div>
        ) : (
          <div className="space-y-3">
            {triggers.map((trigger) => (
              <div
                key={trigger.id}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-slate-50 transition-all"
                data-testid={`trigger-${trigger.id}`}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 rounded-lg">
                    {getTriggerIcon(trigger.trigger_type)}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">
                      {trigger.trigger_type.charAt(0).toUpperCase() + trigger.trigger_type.slice(1)} Trigger
                    </div>
                    {trigger.trigger_type === 'scheduled' && (
                      <div className="text-sm text-slate-600 mt-0.5">Cron: <code className="bg-slate-100 px-2 py-0.5 rounded font-mono text-xs">{trigger.config.cron}</code></div>
                    )}
                    {trigger.trigger_type === 'webhook' && trigger.config.webhook_url && (
                      <div className="text-xs text-slate-600 font-mono bg-slate-100 px-2 py-1 rounded mt-1 max-w-md truncate">
                        {trigger.config.webhook_url}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteTrigger(trigger.id)}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                  data-testid={`delete-trigger-${trigger.id}`}
                  title="Delete trigger"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TriggerConfig;
