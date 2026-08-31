import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ReactFlow, { Background, Controls, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, Save, Play } from 'lucide-react';
import { workflowApi, userApi, projectApi } from '../api/endpoints';
import { TRIGGER_OPTIONS, CONDITION_FIELDS, CONDITION_OPERATORS, ACTION_TYPES, ACTION_LABELS } from '../features/workflow-builder/nodeConfig';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import LoadingSpinner from '../components/LoadingSpinner';

const emptyWorkflow = (project) => ({
  name: '',
  description: '',
  project,
  trigger: { type: 'Task Status Changed' },
  conditions: [],
  actions: [],
  enabled: true,
});

export default function WorkflowBuilder() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isNew = id === 'new' || !id;

  const [workflow, setWorkflow] = useState(emptyWorkflow(searchParams.get('project') || ''));
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    projectApi.list().then((res) => setProjects(res.data.data.projects));
    userApi.list().then((res) => setUsers(res.data.data.users));
  }, []);

  useEffect(() => {
    if (!isNew) {
      workflowApi.get(id).then((res) => {
        setWorkflow(res.data.data.workflow);
        setLoading(false);
      });
    }
  }, [id, isNew]);

  const updateField = (field, value) => setWorkflow((w) => ({ ...w, [field]: value }));

  const addCondition = () =>
    setWorkflow((w) => ({ ...w, conditions: [...w.conditions, { field: 'priority', operator: 'equals', value: '' }] }));
  const updateCondition = (i, patch) =>
    setWorkflow((w) => ({ ...w, conditions: w.conditions.map((c, idx) => (idx === i ? { ...c, ...patch } : c)) }));
  const removeCondition = (i) => setWorkflow((w) => ({ ...w, conditions: w.conditions.filter((_, idx) => idx !== i) }));

  const addAction = () => setWorkflow((w) => ({ ...w, actions: [...w.actions, { type: 'sendNotification', params: {} }] }));
  const updateAction = (i, patch) =>
    setWorkflow((w) => ({ ...w, actions: w.actions.map((a, idx) => (idx === i ? { ...a, ...patch } : a)) }));
  const updateActionParam = (i, key, value) =>
    setWorkflow((w) => ({
      ...w,
      actions: w.actions.map((a, idx) => (idx === i ? { ...a, params: { ...a.params, [key]: value } } : a)),
    }));
  const removeAction = (i) => setWorkflow((w) => ({ ...w, actions: w.actions.filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    if (!workflow.name || !workflow.project) {
      toast.error('Workflow name and project are required');
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        const res = await workflowApi.create(workflow);
        toast.success('Workflow created');
        navigate(`/workflows/${res.data.data.workflow._id}`);
      } else {
        await workflowApi.update(id, workflow);
        toast.success('Workflow saved');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save workflow');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (isNew) {
      toast.error('Save the workflow before testing it');
      return;
    }
    try {
      const res = await workflowApi.test(id);
      toast.success(`Test run: ${res.data.data.execution.status}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Test failed');
    }
  };

  // Build a simple vertical flow diagram: Trigger -> Conditions -> Actions
  const { nodes, edges } = useMemo(() => {
    const n = [];
    const e = [];
    let y = 0;
    const step = 110;

    n.push({
      id: 'trigger',
      position: { x: 0, y },
      data: { label: `⚡ Trigger\n${workflow.trigger.type}` },
      style: { background: '#eef2ff', border: '1px solid #6366f1', borderRadius: 10, padding: 10, fontSize: 12, whiteSpace: 'pre-line', width: 220 },
    });
    y += step;

    if (workflow.conditions.length > 0) {
      const label = `🔍 Condition${workflow.conditions.length > 1 ? 's' : ''} (AND)\n` + workflow.conditions.map((c) => `${c.field} ${c.operator} ${c.value}`).join('\n');
      n.push({
        id: 'conditions',
        position: { x: 0, y },
        data: { label },
        style: { background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: 10, padding: 10, fontSize: 12, whiteSpace: 'pre-line', width: 220 },
      });
      e.push({ id: 'e1', source: 'trigger', target: 'conditions', markerEnd: { type: MarkerType.ArrowClosed }, animated: true });
      y += step;
    }

    workflow.actions.forEach((a, i) => {
      const nodeId = `action-${i}`;
      n.push({
        id: nodeId,
        position: { x: 0, y },
        data: { label: `▶ Action\n${ACTION_LABELS[a.type] || a.type}` },
        style: { background: '#ecfdf5', border: '1px solid #10b981', borderRadius: 10, padding: 10, fontSize: 12, whiteSpace: 'pre-line', width: 220 },
      });
      const source = i === 0 ? (workflow.conditions.length > 0 ? 'conditions' : 'trigger') : `action-${i - 1}`;
      e.push({ id: `e-a${i}`, source, target: nodeId, markerEnd: { type: MarkerType.ArrowClosed }, animated: true });
      y += step;
    });

    return { nodes: n, edges: e };
  }, [workflow]);

  if (loading) return <LoadingSpinner full label="Loading workflow..." />;

  return (
    <div className="space-y-5">
      <button onClick={() => navigate('/workflows')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} /> Back to Workflows
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{isNew ? 'New Workflow' : 'Edit Workflow'}</h1>
        <div className="flex gap-2">
          {!isNew && <Button variant="secondary" onClick={handleTest}><Play size={15}/> Test</Button>}
          <Button onClick={handleSave} disabled={saving}><Save size={15}/> {saving ? 'Saving...' : 'Save Workflow'}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-5">
          <div className="card p-5 space-y-4">
            <Input label="Workflow name" value={workflow.name} onChange={(e) => updateField('name', e.target.value)} placeholder='e.g. "High Priority Task Completion"' />
            <div>
              <label className="label">Description</label>
              <textarea className="input" rows={2} value={workflow.description} onChange={(e) => updateField('description', e.target.value)} />
            </div>
            <Select label="Project" value={workflow.project} onChange={(e) => updateField('project', e.target.value)}>
              <option value="">Select project...</option>
              {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </Select>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-sm mb-3">⚡ Trigger</h3>
            <Select value={workflow.trigger.type} onChange={(e) => updateField('trigger', { type: e.target.value })}>
              {TRIGGER_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">🔍 Conditions <span className="text-xs text-slate-400 font-normal">(all must match)</span></h3>
              <Button variant="ghost" onClick={addCondition}><Plus size={14}/> Add</Button>
            </div>
            <div className="space-y-2">
              {workflow.conditions.map((c, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select className="input" value={c.field} onChange={(e) => updateCondition(i, { field: e.target.value })}>
                    {CONDITION_FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <select className="input w-32" value={c.operator} onChange={(e) => updateCondition(i, { operator: e.target.value })}>
                    {CONDITION_OPERATORS.map((op) => <option key={op} value={op}>{op}</option>)}
                  </select>
                  <input className="input" placeholder="value" value={c.value} onChange={(e) => updateCondition(i, { value: e.target.value })} />
                  <button onClick={() => removeCondition(i)} className="text-slate-400 hover:text-red-600 shrink-0"><Trash2 size={15}/></button>
                </div>
              ))}
              {workflow.conditions.length === 0 && <p className="text-xs text-slate-400">No conditions — action(s) will always run when triggered.</p>}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">▶ Actions</h3>
              <Button variant="ghost" onClick={addAction}><Plus size={14}/> Add</Button>
            </div>
            <div className="space-y-3">
              {workflow.actions.map((a, i) => (
                <div key={i} className="border border-slate-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <select className="input" value={a.type} onChange={(e) => updateAction(i, { type: e.target.value, params: {} })}>
                      {ACTION_TYPES.map((t) => <option key={t} value={t}>{ACTION_LABELS[t]}</option>)}
                    </select>
                    <button onClick={() => removeAction(i)} className="text-slate-400 hover:text-red-600 shrink-0"><Trash2 size={15}/></button>
                  </div>
                  <ActionParamsEditor action={a} onChange={(key, value) => updateActionParam(i, key, value)} users={users} />
                </div>
              ))}
              {workflow.actions.length === 0 && <p className="text-xs text-slate-400">Add at least one action to run when the workflow triggers.</p>}
            </div>
          </div>
        </div>

        <div className="card p-3 h-fit lg:sticky lg:top-20">
          <p className="text-xs text-slate-400 px-2 pt-1 pb-2">Live preview</p>
          <div style={{ height: 480 }}>
            <ReactFlow nodes={nodes} edges={edges} fitView proOptions={{ hideAttribution: true }}>
              <Background />
              <Controls showInteractive={false} />
            </ReactFlow>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionParamsEditor({ action, onChange, users }) {
  const p = action.params || {};
  switch (action.type) {
    case 'assignTask':
      return (
        <select className="input" value={p.userId || ''} onChange={(e) => onChange('userId', e.target.value)}>
          <option value="">Select user...</option>
          {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
        </select>
      );
    case 'changeTaskStatus':
      return (
        <select className="input" value={p.status || ''} onChange={(e) => onChange('status', e.target.value)}>
          <option value="">Select status...</option>
          {['Todo', 'In Progress', 'Review', 'Done'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      );
    case 'sendNotification':
      return (
        <div className="space-y-2">
          <select className="input" value={p.target || 'projectMembers'} onChange={(e) => onChange('target', e.target.value)}>
            <option value="projectMembers">All project members</option>
            <option value="assignee">Task assignee</option>
          </select>
          <input className="input" placeholder="Notification message" value={p.message || ''} onChange={(e) => onChange('message', e.target.value)} />
        </div>
      );
    case 'addComment':
      return <input className="input" placeholder="Comment text" value={p.text || ''} onChange={(e) => onChange('text', e.target.value)} />;
    case 'createTask':
      return (
        <div className="space-y-2">
          <input className="input" placeholder="New task title" value={p.title || ''} onChange={(e) => onChange('title', e.target.value)} />
          <select className="input" value={p.priority || 'Medium'} onChange={(e) => onChange('priority', e.target.value)}>
            {['Low', 'Medium', 'High', 'Critical'].map((pr) => <option key={pr} value={pr}>{pr}</option>)}
          </select>
        </div>
      );
    case 'updateTask':
      return (
        <select className="input" value={p.status || ''} onChange={(e) => onChange('status', e.target.value)}>
          <option value="">No status change</option>
          {['Todo', 'In Progress', 'Review', 'Done'].map((s) => <option key={s} value={s}>Set status: {s}</option>)}
        </select>
      );
    case 'updateProject':
      return (
        <select className="input" value={p.status || ''} onChange={(e) => onChange('status', e.target.value)}>
          <option value="">No status change</option>
          {['Planning', 'In Progress', 'On Hold', 'Completed'].map((s) => <option key={s} value={s}>Set status: {s}</option>)}
        </select>
      );
    case 'sendWebhook':
      return <input className="input" placeholder="https://example.com/webhook" value={p.url || ''} onChange={(e) => onChange('url', e.target.value)} />;
    default:
      return null;
  }
}
