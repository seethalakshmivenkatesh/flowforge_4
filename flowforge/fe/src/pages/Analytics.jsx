import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardApi } from '../api/endpoints';
import LoadingSpinner from '../components/LoadingSpinner';

function StatBlock({ label, value, suffix = '' }) {
  return (
    <div className="card p-5">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-slate-900">{value}{suffix}</p>
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    dashboardApi.analytics().then((res) => setData(res.data.data));
  }, []);

  if (!data) return <LoadingSpinner full label="Loading analytics..." />;

  const workflowPie = [
    { name: 'Successful', value: data.successfulWorkflowPercentage, color: '#10b981' },
    { name: 'Failed', value: data.failedWorkflowPercentage, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Reports and productivity insights</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatBlock label="Project Completion Rate" value={data.projectCompletionRate} suffix="%" />
        <StatBlock label="Task Completion Rate" value={data.taskCompletionRate} suffix="%" />
        <StatBlock label="Overdue Tasks" value={data.overdueTasks} />
        <StatBlock label="Workflow Executions" value={data.workflowExecutionCount} />
        <StatBlock label="Successful Workflows" value={data.successfulWorkflowPercentage} suffix="%" />
        <StatBlock label="Failed Workflows" value={data.failedWorkflowPercentage} suffix="%" />
      </div>

      {data.workflowExecutionCount > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-sm mb-4">Workflow Success vs Failure</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={workflowPie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                {workflowPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
