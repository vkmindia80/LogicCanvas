import React, { useState, useEffect } from 'react';
import { Clock, Webhook, Zap, Trash2 } from 'lucide-react';

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
      case 'scheduled': return <Clock className="w-5 h-5 text-green-500" />;
      case 'webhook': return <Webhook className="w-5 h-5 text-gold-500" />;
      default: return <Zap className="w-5 h-5 text-green-500" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Workflow Triggers</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 text-sm"
          data-testid="add-trigger-button"
        >
          + Add Trigger
        </button>
      </div>

      {showForm && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trigger Type
              </label>
              <select
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                data-testid="trigger-type-select"
              >
                <option value="manual">Manual</option>
                <option value="scheduled">Scheduled (Cron)</option>
                <option value="webhook">Webhook</option>
              </select>
            </div>

            {triggerType === 'scheduled' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cron Expression
                </label>
                <input
                  type="text"
                  value={cronExpression}
                  onChange={(e) => setCronExpression(e.target.value)}
                  placeholder="0 0 * * * (Daily at midnight)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  data-testid="cron-expression-input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: minute hour day month weekday
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleCreateTrigger}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                data-testid="create-trigger-button"
              >
                Create
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading triggers...</div>
      ) : triggers.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Zap className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No triggers configured</p>
        </div>
      ) : (
        <div className="space-y-3">
          {triggers.map((trigger) => (
            <div
              key={trigger.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              data-testid={`trigger-${trigger.id}`}
            >
              <div className="flex items-center gap-3">
                {getTriggerIcon(trigger.trigger_type)}
                <div>
                  <div className="font-medium text-gray-800">
                    {trigger.trigger_type.charAt(0).toUpperCase() + trigger.trigger_type.slice(1)} Trigger
                  </div>
                  {trigger.trigger_type === 'scheduled' && (
                    <div className="text-sm text-gray-600">Cron: {trigger.config.cron}</div>
                  )}
                  {trigger.trigger_type === 'webhook' && trigger.config.webhook_url && (
                    <div className="text-xs text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded mt-1">
                      {trigger.config.webhook_url}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDeleteTrigger(trigger.id)}
                className="text-red-500 hover:text-red-700 p-2"
                data-testid={`delete-trigger-${trigger.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TriggerConfig;