import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, FolderKanban, Search } from 'lucide-react';
import { projectApi, userApi } from '../api/endpoints';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ mode: 'onChange', reValidateMode: 'onChange' });

  const load = () => {
    setLoading(true);
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.search) params.search = filters.search;
    projectApi
      .list(params)
      .then((res) => setProjects(res.data.data.projects))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [filters.status, filters.priority]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [filters.search]);

  const onCreate = async (data) => {
    try {
      await projectApi.create(data);
      toast.success('Project created');
      setModalOpen(false);
      reset();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and track all your projects</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> New Project
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search projects..."
            className="input pl-8"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          />
        </div>
        <select className="input w-auto bg-white" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
          <option value="">All Status</option>
          {['Planning', 'In Progress', 'On Hold', 'Completed'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select className="input w-auto bg-white" value={filters.priority} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}>
          <option value="">All Priority</option>
          {['Low', 'Medium', 'High', 'Critical'].map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner full />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create your first project to start organizing tasks and workflows."
          action={<Button onClick={() => setModalOpen(true)}><Plus size={16}/> New Project</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div key={p._id} onClick={() => navigate(`/projects/${p._id}`)} className="card p-5 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-slate-900">{p.name}</h3>
                <Badge>{p.priority}</Badge>
              </div>
              <p className="text-sm text-slate-500 line-clamp-2 mb-4">{p.description || 'No description'}</p>
              <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Progress</span>
                  <span>{p.progress}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-600 rounded-full" style={{ width: `${p.progress}%` }} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Badge>{p.status}</Badge>
                <div className="flex -space-x-2">
                  {[p.owner, ...(p.members || [])].filter(Boolean).slice(0, 4).map((m) => (
                    <div key={m._id} className="ring-2 ring-white rounded-full">
                      <Avatar name={m.name} size={26} src={m.avatar} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Project"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit(onCreate)}>Create Project</Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(onCreate)}>
          <Input label="Project name" error={errors.name?.message} {...register('name', { required: 'Name is required' })} />
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} {...register('description')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Status" defaultValue="Planning" {...register('status')}>
              {['Planning', 'In Progress', 'On Hold', 'Completed'].map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Select label="Priority" defaultValue="Medium" {...register('priority')}>
              {['Low', 'Medium', 'High', 'Critical'].map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start date" type="date" {...register('startDate')} />
            <Input label="Due date" type="date" {...register('dueDate')} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
