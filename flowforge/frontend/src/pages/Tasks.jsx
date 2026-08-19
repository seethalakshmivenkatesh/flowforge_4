import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, ListChecks, Search, Send } from 'lucide-react';
import { taskApi, projectApi, userApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import Table from '../components/Table';

export default function Tasks() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ mode: 'onChange', reValidateMode: 'onChange' });

  const load = () => {
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.search) params.search = filters.search;
    taskApi.list(params).then((res) => {
      setTasks(res.data.data.tasks);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
    projectApi.list().then((res) => setProjects(res.data.data.projects));
    userApi.list().then((res) => setUsers(res.data.data.users));
    // eslint-disable-next-line
  }, [filters.status, filters.priority]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [filters.search]);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => load();
    socket.on('taskCreated', refresh);
    socket.on('taskUpdated', refresh);
    socket.on('taskDeleted', refresh);
    return () => {
      socket.off('taskCreated', refresh);
      socket.off('taskUpdated', refresh);
      socket.off('taskDeleted', refresh);
    };
  }, [socket]);

  const onCreate = async (data) => {
    try {
      await taskApi.create(data);
      toast.success('Task created');
      setCreateOpen(false);
      reset();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    }
  };

  const openTask = async (row) => {
    const res = await taskApi.get(row._id);
    setActiveTask(res.data.data.task);
  };

  const handleStatusChange = async (status) => {
    await taskApi.update(activeTask._id, { status });
    const res = await taskApi.get(activeTask._id);
    setActiveTask(res.data.data.task);
    load();
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    await taskApi.addComment(activeTask._id, commentText);
    setCommentText('');
    const res = await taskApi.get(activeTask._id);
    setActiveTask(res.data.data.task);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
          <p className="text-sm text-slate-500 mt-1">Everything you and your team need to do</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus size={16}/> New Task</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input placeholder="Search tasks..." className="input pl-8" value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} />
        </div>
        <select className="input w-auto bg-white" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
          <option value="">All Status</option>
          {['Todo', 'In Progress', 'Review', 'Done'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input w-auto bg-white" value={filters.priority} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}>
          <option value="">All Priority</option>
          {['Low', 'Medium', 'High', 'Critical'].map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner full />
      ) : tasks.length === 0 ? (
        <EmptyState icon={ListChecks} title="No tasks found" description="Create a task to get started." action={<Button onClick={() => setCreateOpen(true)}><Plus size={16}/> New Task</Button>} />
      ) : (
        <div className="card p-2">
          <Table
            columns={[
              { key: 'title', header: 'Title' },
              { key: 'project', header: 'Project', render: (r) => r.project?.name },
              { key: 'status', header: 'Status', render: (r) => <Badge>{r.status}</Badge> },
              { key: 'priority', header: 'Priority', render: (r) => <Badge>{r.priority}</Badge> },
              { key: 'assignee', header: 'Assignee', render: (r) => r.assignee ? <div className="flex items-center gap-2"><Avatar name={r.assignee.name} size={22}/> {r.assignee.name}</div> : '—' },
              { key: 'dueDate', header: 'Due', render: (r) => r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '—' },
            ]}
            data={tasks}
            onRowClick={openTask}
          />
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Task" footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={handleSubmit(onCreate)}>Create Task</Button></>}>
        <form className="space-y-4" onSubmit={handleSubmit(onCreate)}>
          <Input label="Title" error={errors.title?.message} {...register('title', { required: 'Title is required' })} />
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} {...register('description')} />
          </div>
          <Select label="Project" error={errors.project?.message} {...register('project', { required: 'Project is required' })}>
            <option value="">Select project...</option>
            {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Priority" defaultValue="Medium" {...register('priority')}>
              {['Low', 'Medium', 'High', 'Critical'].map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
            <Input label="Due date" type="date" {...register('dueDate')} />
          </div>
          <Select label="Assignee" {...register('assignee')}>
            <option value="">Unassigned</option>
            {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
          </Select>
        </form>
      </Modal>

      <Modal open={!!activeTask} onClose={() => setActiveTask(null)} title={activeTask?.title} size="lg" footer={<Button variant="secondary" onClick={() => setActiveTask(null)}>Close</Button>}>
        {activeTask && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{activeTask.priority}</Badge>
              {activeTask.labels?.map((l) => <Badge key={l} color="bg-slate-100 text-slate-600">{l}</Badge>)}
            </div>
            <p className="text-sm text-slate-600">{activeTask.description || 'No description provided.'}</p>

            <div>
              <label className="label">Status</label>
              <div className="flex gap-2">
                {['Todo', 'In Progress', 'Review', 'Done'].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                      activeTask.status === s ? 'bg-brand-600 text-white border-brand-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <div>
                <p className="text-xs text-slate-400">Assignee</p>
                <p>{activeTask.assignee?.name || 'Unassigned'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Reporter</p>
                <p>{activeTask.reporter?.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Due Date</p>
                <p>{activeTask.dueDate ? new Date(activeTask.dueDate).toLocaleDateString() : '—'}</p>
              </div>
            </div>

            {activeTask.checklist?.length > 0 && (
              <div>
                <p className="label">Checklist</p>
                <div className="space-y-1">
                  {activeTask.checklist.map((c) => (
                    <label key={c._id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={c.done} readOnly /> {c.text}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="label">Comments</p>
              <div className="space-y-3 max-h-40 overflow-y-auto mb-3">
                {activeTask.comments?.length === 0 && <p className="text-xs text-slate-400">No comments yet</p>}
                {activeTask.comments?.map((c) => (
                  <div key={c._id} className="flex items-start gap-2 text-sm">
                    <Avatar name={c.author?.name || '?'} size={22} />
                    <div>
                      <p className="text-slate-700">{c.text}</p>
                      <p className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input className="input" placeholder="Write a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddComment()} />
                <Button onClick={handleAddComment}><Send size={14}/></Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
