import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, Clock, CheckCircle, AlertTriangle, X, Activity,
  Users, Zap, Target, FileText, AlertCircle, Award, Workflow
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
  indigo: '#6366f1',
  teal: '#14b8a6'
};

const PIE_COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b'];

const AnalyticsDashboard = ({ onClose }) => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [throughput, setThroughput] = useState([]);
  const [executionTime, setExecutionTime] = useState([]);
  const [successRate, setSuccessRate] = useState([]);
  const [popularity, setPopularity] = useState([]);
  const [slaCompliance, setSlaCompliance] = useState(null);
  const [slaTrends, setSlaTrends] = useState([]);
  const [nodePerformance, setNodePerformance] = useState([]);
  const [bottlenecks, setBottlenecks] = useState(null);
  const [userProductivity, setUserProductivity] = useState([]);
  const [userWorkload, setUserWorkload] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // overview, workflows, sla, nodes, users

  useEffect(() => {
    loadAllAnalytics();
    const interval = setInterval(loadAllAnalytics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadAllAnalytics = async () => {
    try {
      setLoading(true);
      
      // Load all analytics data in parallel
      const [
        overviewRes,
        throughputRes,
        execTimeRes,
        successRateRes,
        popularityRes,
        slaComplianceRes,
        slaTrendsRes,
        nodePerfRes,
        bottlenecksRes,
        userProdRes,
        workloadRes
      ] = await Promise.all([
        fetch(`${BACKEND_URL}/api/analytics/overview`),
        fetch(`${BACKEND_URL}/api/analytics/workflows/throughput?days=30`),
        fetch(`${BACKEND_URL}/api/analytics/workflows/execution-time`),
        fetch(`${BACKEND_URL}/api/analytics/workflows/success-rate`),
        fetch(`${BACKEND_URL}/api/analytics/workflows/popularity`),
        fetch(`${BACKEND_URL}/api/analytics/sla/compliance`),
        fetch(`${BACKEND_URL}/api/analytics/sla/trends?days=30`),
        fetch(`${BACKEND_URL}/api/analytics/nodes/performance`),
        fetch(`${BACKEND_URL}/api/analytics/nodes/bottlenecks?limit=5`),
        fetch(`${BACKEND_URL}/api/analytics/users/productivity`),
        fetch(`${BACKEND_URL}/api/analytics/users/workload`)
      ]);

      setOverview(await overviewRes.json());
      setThroughput((await throughputRes.json()).data || []);
      setExecutionTime((await execTimeRes.json()).data || []);
      
      const successData = await successRateRes.json();
      setSuccessRate(successData.data || []);
      
      setPopularity((await popularityRes.json()).data || []);
      setSlaCompliance(await slaComplianceRes.json());
      setSlaTrends((await slaTrendsRes.json()).data || []);
      setNodePerformance((await nodePerfRes.json()).data || []);
      setBottlenecks(await bottlenecksRes.json());
      setUserProductivity((await userProdRes.json()).data || []);
      setUserWorkload((await workloadRes.json()).data || []);
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setLoading(false);
    }
  };

  if (loading && !overview) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-700">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-50 overflow-auto z-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-sm text-gray-500">Real-time insights and performance metrics</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mt-4 border-b border-gray-200">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'workflows', label: 'Workflows', icon: Workflow },
              { id: 'sla', label: 'SLA Performance', icon: Target },
              { id: 'nodes', label: 'Node Analysis', icon: Zap },
              { id: 'users', label: 'Team Productivity', icon: Users }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <OverviewTab overview={overview} throughput={throughput} successRate={successRate} />
        )}
        {activeTab === 'workflows' && (
          <WorkflowsTab 
            executionTime={executionTime} 
            popularity={popularity} 
            throughput={throughput}
            successRate={successRate}
          />
        )}
        {activeTab === 'sla' && (
          <SLATab slaCompliance={slaCompliance} slaTrends={slaTrends} />
        )}
        {activeTab === 'nodes' && (
          <NodesTab nodePerformance={nodePerformance} bottlenecks={bottlenecks} />
        )}
        {activeTab === 'users' && (
          <UsersTab userProductivity={userProductivity} userWorkload={userWorkload} />
        )}
      </div>
    </div>
  );
};

// ==================== OVERVIEW TAB ====================
const OverviewTab = ({ overview, throughput, successRate }) => {
  if (!overview) return null;

  const metrics = [
    {
      label: 'Total Workflows',
      value: overview.workflows.total,
      change: '+12%',
      icon: FileText,
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600'
    },
    {
      label: 'Total Executions',
      value: overview.workflows.total_executions,
      change: `${overview.workflows.success_rate}% success`,
      icon: Activity,
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600'
    },
    {
      label: 'Pending Tasks',
      value: overview.tasks.pending,
      change: `${overview.tasks.overdue} overdue`,
      icon: Clock,
      color: 'orange',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-600'
    },
    {
      label: 'SLA Compliance',
      value: `${overview.sla.compliance_rate}%`,
      change: 'Last 30 days',
      icon: Target,
      color: 'purple',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, idx) => (
          <MetricCard key={idx} {...metric} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Throughput Chart */}
        <ChartCard title="Workflow Throughput (Last 30 Days)" icon={TrendingUp}>
          {throughput.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={throughput}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{fontSize: 12}} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="total" stroke={COLORS.primary} fillOpacity={1} fill="url(#colorTotal)" name="Total" />
                <Area type="monotone" dataKey="completed" stroke={COLORS.success} fill={COLORS.success} fillOpacity={0.3} name="Completed" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No throughput data available" />
          )}
        </ChartCard>

        {/* Success Rate Pie Chart */}
        <ChartCard title="Execution Status Distribution" icon={CheckCircle}>
          {successRate.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={successRate}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, percentage}) => `${name}: ${percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {successRate.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No execution data available" />
          )}
        </ChartCard>
      </div>

      {/* Recent Activity Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity (Last 7 Days)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">{overview.recent_activity.last_7_days}</div>
            <div className="text-sm text-gray-600 mt-1">Workflow Executions</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600">{overview.workflows.completed}</div>
            <div className="text-sm text-gray-600 mt-1">Completed</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-3xl font-bold text-red-600">{overview.workflows.failed}</div>
            <div className="text-sm text-gray-600 mt-1">Failed</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-3xl font-bold text-purple-600">{overview.approvals.pending}</div>
            <div className="text-sm text-gray-600 mt-1">Pending Approvals</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== WORKFLOWS TAB ====================
const WorkflowsTab = ({ executionTime, popularity, throughput, successRate }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Execution Time Chart */}
        <ChartCard title="Average Execution Time by Workflow" icon={Clock}>
          {executionTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={executionTime.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" label={{ value: 'Seconds', position: 'insideBottom', offset: -5 }} />
                <YAxis type="category" dataKey="workflow_name" width={150} tick={{fontSize: 11}} />
                <Tooltip />
                <Bar dataKey="avg_execution_time" fill={COLORS.primary} name="Avg Time (s)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No execution time data available" />
          )}
        </ChartCard>

        {/* Popularity Chart */}
        <ChartCard title="Most Executed Workflows (Top 10)" icon={TrendingUp}>
          {popularity.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={popularity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="workflow_name" angle={-45} textAnchor="end" height={100} tick={{fontSize: 10}} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="executions" fill={COLORS.success} name="Executions" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No popularity data available" />
          )}
        </ChartCard>
      </div>

      {/* Execution Time Details Table */}
      {executionTime.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Workflow Performance Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Workflow</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Executions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {executionTime.slice(0, 10).map((wf, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{wf.workflow_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{wf.executions}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{wf.avg_execution_time}s</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{wf.min_time}s</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{wf.max_time}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== SLA TAB ====================
const SLATab = ({ slaCompliance, slaTrends }) => {
  if (!slaCompliance) return null;

  return (
    <div className="space-y-6">
      {/* SLA Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="SLA Compliance"
          value={`${slaCompliance.compliance_rate}%`}
          icon={Target}
          color="green"
          bgColor="bg-green-100"
          textColor="text-green-600"
        />
        <MetricCard
          label="Completed On Time"
          value={slaCompliance.completed_on_time}
          icon={CheckCircle}
          color="blue"
          bgColor="bg-blue-100"
          textColor="text-blue-600"
        />
        <MetricCard
          label="Overdue Tasks"
          value={slaCompliance.overdue}
          icon={AlertTriangle}
          color="red"
          bgColor="bg-red-100"
          textColor="text-red-600"
        />
        <MetricCard
          label="At Risk (24h)"
          value={slaCompliance.at_risk}
          icon={AlertCircle}
          color="orange"
          bgColor="bg-orange-100"
          textColor="text-orange-600"
        />
      </div>

      {/* SLA Trends Chart */}
      <ChartCard title="SLA Compliance Trend (Last 30 Days)" icon={TrendingUp}>
        {slaTrends.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={slaTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{fontSize: 12}} />
              <YAxis label={{ value: 'Compliance %', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="compliance" stroke={COLORS.success} strokeWidth={2} name="Compliance %" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState message="No SLA trend data available" />
        )}
      </ChartCard>

      {/* On-time vs Late Details */}
      {slaTrends.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="On-Time vs Late Tasks" icon={Clock}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={slaTrends.slice(-14)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} tick={{fontSize: 10}} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="on_time" fill={COLORS.success} name="On Time" stackId="a" />
                <Bar dataKey="late" fill={COLORS.danger} name="Late" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* SLA Summary */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-gray-600" />
              SLA Summary
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-gray-700">Total Tasks with SLA</span>
                <span className="font-semibold text-gray-900">{slaCompliance.tasks_with_sla}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                <span className="text-gray-700">Completed On Time</span>
                <span className="font-semibold text-green-600">{slaCompliance.completed_on_time}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                <span className="text-gray-700">Completed Late</span>
                <span className="font-semibold text-red-600">{slaCompliance.completed_late}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
                <span className="text-gray-700">Currently At Risk</span>
                <span className="font-semibold text-orange-600">{slaCompliance.at_risk}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== NODES TAB ====================
const NodesTab = ({ nodePerformance, bottlenecks }) => {
  return (
    <div className="space-y-6">
      {/* Bottleneck Summary Cards */}
      {bottlenecks && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Slowest Nodes */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-orange-600" />
              Slowest Nodes (Bottlenecks)
            </h3>
            {bottlenecks.slowest_nodes.length > 0 ? (
              <div className="space-y-3">
                {bottlenecks.slowest_nodes.map((node, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{node.node_type}</div>
                      <div className="text-sm text-gray-600">ID: {node.node_id.substring(0, 8)}...</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-orange-600">{node.avg_execution_time}s</div>
                      <div className="text-xs text-gray-500">{node.executions} executions</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No bottleneck data available" />
            )}
          </div>

          {/* Highest Failure Nodes */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
              Highest Failure Rate Nodes
            </h3>
            {bottlenecks.highest_failure_nodes.length > 0 ? (
              <div className="space-y-3">
                {bottlenecks.highest_failure_nodes.map((node, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{node.node_type}</div>
                      <div className="text-sm text-gray-600">ID: {node.node_id.substring(0, 8)}...</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-600">{node.failure_rate}%</div>
                      <div className="text-xs text-gray-500">{node.failures}/{node.executions} failed</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No failure data available" />
            )}
          </div>
        </div>
      )}

      {/* Node Performance Table */}
      {nodePerformance.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Node Performance Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Node ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Executions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Success</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Failures</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Failure Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {nodePerformance.map((node, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">{node.node_id.substring(0, 12)}...</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {node.node_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{node.executions}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{node.avg_execution_time}s</td>
                    <td className="px-6 py-4 text-sm text-green-600">{node.successes}</td>
                    <td className="px-6 py-4 text-sm text-red-600">{node.failures}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        node.failure_rate > 20 ? 'bg-red-100 text-red-800' :
                        node.failure_rate > 10 ? 'bg-orange-100 text-orange-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {node.failure_rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {nodePerformance.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12">
          <EmptyState message="No node performance data available. Execute some workflows to see analytics." />
        </div>
      )}
    </div>
  );
};

// ==================== USERS TAB ====================
const UsersTab = ({ userProductivity, userWorkload }) => {
  return (
    <div className="space-y-6">
      {/* User Productivity Chart */}
      <ChartCard title="Tasks Completed by User" icon={Award}>
        {userProductivity.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userProductivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} tick={{fontSize: 11}} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" fill={COLORS.success} name="Completed Tasks" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState message="No user productivity data available" />
        )}
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workload Distribution */}
        <ChartCard title="Current Workload Distribution" icon={Users}>
          {userWorkload.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={userWorkload}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, pending_tasks}) => `${name}: ${pending_tasks}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="pending_tasks"
                >
                  {userWorkload.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No workload data available" />
          )}
        </ChartCard>

        {/* Leaderboard */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2 text-yellow-600" />
            Top Performers
          </h3>
          {userProductivity.length > 0 ? (
            <div className="space-y-3">
              {userProductivity.slice(0, 5).map((user, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      idx === 0 ? 'bg-yellow-500' :
                      idx === 1 ? 'bg-gray-400' :
                      idx === 2 ? 'bg-orange-500' :
                      'bg-blue-500'
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">{user.completed}</div>
                    <div className="text-xs text-gray-500">tasks completed</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No user data available" />
          )}
        </div>
      </div>

      {/* User Productivity Table */}
      {userProductivity.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Team Productivity Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Tasks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completion Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Time (hrs)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {userProductivity.map((user, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{user.total_tasks}</td>
                    <td className="px-6 py-4 text-sm text-green-600">{user.completed}</td>
                    <td className="px-6 py-4 text-sm text-orange-600">{user.pending}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.completion_rate >= 80 ? 'bg-green-100 text-green-800' :
                        user.completion_rate >= 50 ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {user.completion_rate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.avg_completion_hours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== REUSABLE COMPONENTS ====================
const MetricCard = ({ label, value, change, icon: Icon, bgColor, textColor }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className="text-sm text-gray-500 mt-1">{change}</p>
          )}
        </div>
        <div className={`${bgColor} p-3 rounded-lg`}>
          <Icon className={`w-6 h-6 ${textColor}`} />
        </div>
      </div>
    </div>
  );
};

const ChartCard = ({ title, icon: Icon, children }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        {Icon && <Icon className="w-5 h-5 text-gray-600" />}
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );
};

const EmptyState = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
      <FileText className="w-12 h-12 mb-3 text-gray-300" />
      <p className="text-sm">{message}</p>
    </div>
  );
};

export default AnalyticsDashboard;
