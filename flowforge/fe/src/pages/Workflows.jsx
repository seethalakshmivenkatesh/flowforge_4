import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Workflow as WorkflowIcon, Play, Trash2, History } from 'lucide-react';
import { workflowApi, projectApi } from '../api/endpoints';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Select from '../components/Select';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Workflows() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    projectApi.list().then((res) => {
      setProjects(res.data.data.projects);
      if (res.data.data.projects.length) setProjectId(res.data.data.projects[0]._id);
    });
  }, []);

  const load = (pid) => {
    if (!pid) return;
    setLoading(true);
    workflowApi.list({ project: pid }).then((res) => {
      setWorkflows(res.data.data.workflows);
      setLoading(false);
    });
  };

  useEffect(() => { load(projectId); }, [projectId]);

  const handleToggle = async (id) => {
    await workflowApi.toggle(id);
    load(projectId);
  };

  const handleTest = async (id) => {
    try {
      const res = await workflowApi.test(id);
      toast.success(`Test run: ${res.data.data.execution.status}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Test failed');
    }
  };

  const handleDelete = async () => {
    await workflowApi.remove(deleteTarget);
    toast.success('Workflow deleted');
    setDeleteTarget(null);
    load(projectId);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workflows</h1>
          <p className="text-sm text-slate-500 mt-1">Automate what happens across your projects</p>
        </div>
        <div className="flex gap-3">
          <Select className="w-52" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </Select>
          <Button onClick={() => navigate(`/workflows/new?project=${projectId}`)}><Plus size={16}/> New Workflow</Button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner full />
      ) : workflows.length === 0 ? (
        <EmptyState
          icon={WorkflowIcon}
          title="No workflows yet"
          description='Build a rule like "When a task is moved to Done, notify the team."'
          action={<Button onClick={() => navigate(`/workflows/new?project=${projectId}`)}><Plus size={16}/> New Workflow</Button>}
        />
      ) : (
        <div className="space-y-3">
          {workflows.map((w) => (
            <div key={w._id} className="card p-4 flex items-center justify-between">
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/workflows/${w._id}`)}>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-900">{w.name}</h3>
                  <Badge color={w.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}>
                    {w.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <p className="text-sm text-slate-500">
                  <span className="font-medium text-slate-600">{w.trigger.type}</span>
                  {w.conditions?.length > 0 && <> → {w.conditions.length} condition{w.conditions.length > 1 ? 's' : ''}</>}
                  {' → '}{w.actions?.length || 0} action{w.actions?.length === 1 ? '' : 's'}
                </p>
                <p className="text-xs text-slate-400 mt-1">Executed {w.executionCount} times{w.lastExecutedAt ? ` · last run ${new Date(w.lastExecutedAt).toLocaleString()}` : ''}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <button title="Test workflow" onClick={() => handleTest(w._id)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"><Play size={16}/></button>
                <button title="Execution history" onClick={() => navigate(`/workflows/${w._id}/executions`)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"><History size={16}/></button>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={w.enabled} onChange={() => handleToggle(w._id)} />
                  <div className="w-9 h-5 bg-slate-200 peer-checked:bg-brand-600 rounded-full transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                </label>
                <button title="Delete" onClick={() => setDeleteTarget(w._id)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete this workflow?"
        description="Its execution history will also be removed. This cannot be undone."
        confirmLabel="Delete Workflow"
      />
    </div>
  );
}
