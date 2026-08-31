import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { workflowApi } from '../api/endpoints';
import Badge from '../components/Badge';
import Table from '../components/Table';
import LoadingSpinner from '../components/LoadingSpinner';

const FILTERS = ['All', 'Success', 'Failed'];

export default function WorkflowExecutions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [executions, setExecutions] = useState([]);
  const [workflow, setWorkflow] = useState(null);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([workflowApi.get(id), workflowApi.executions(id, { status: filter })]).then(([w, e]) => {
      setWorkflow(w.data.data.workflow);
      setExecutions(e.data.data.executions);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [id, filter]);

  return (
    <div className="space-y-5">
      <button onClick={() => navigate('/workflows')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} /> Back to Workflows
      </button>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">{workflow?.name || 'Execution History'}</h1>
        <p className="text-sm text-slate-500 mt-1">Recent runs of this workflow</p>
      </div>

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === f ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner full />
      ) : (
        <div className="card p-2">
          <Table
            emptyMessage="No executions recorded yet"
            columns={[
              { key: 'triggerEvent', header: 'Trigger Event' },
              { key: 'status', header: 'Status', render: (r) => <Badge>{r.status}</Badge> },
              { key: 'startedAt', header: 'Execution Time', render: (r) => new Date(r.startedAt).toLocaleString() },
              { key: 'durationMs', header: 'Duration', render: (r) => (r.durationMs != null ? `${r.durationMs}ms` : '—') },
              { key: 'actionsExecuted', header: 'Actions Executed', render: (r) => r.actionsExecuted?.join(', ') || '—' },
              { key: 'errorMessage', header: 'Error', render: (r) => r.errorMessage ? <span className="text-red-600 text-xs">{r.errorMessage}</span> : '—' },
            ]}
            data={executions}
          />
        </div>
      )}
    </div>
  );
}
