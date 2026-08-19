import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, UserPlus, Archive } from 'lucide-react';
import { projectApi, taskApi, userApi } from '../api/endpoints';
import { useSocket } from '../context/SocketContext';
import Badge from '../components/Badge';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Select from '../components/Select';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import Table from '../components/Table';

const TABS = ['Overview', 'Tasks', 'Members', 'Activity', 'Workflows', 'Settings'];

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activity, setActivity] = useState([]);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');

  const load = () => {
    Promise.all([projectApi.get(id), taskApi.list({ project: id }), userApi.list()]).then(([p, t, u]) => {
      setProject(p.data.data.project);
      setTasks(t.data.data.tasks);
      setUsers(u.data.data.users);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('joinProject', id);
    const refresh = () => load();
    socket.on('taskCreated', refresh);
    socket.on('taskUpdated', refresh);
    socket.on('projectUpdated', refresh);
    return () => {
      socket.emit('leaveProject', id);
      socket.off('taskCreated', refresh);
      socket.off('taskUpdated', refresh);
      socket.off('projectUpdated', refresh);
    };
  }, [socket, id]);

  useEffect(() => {
    if (tab === 'Activity') projectApi.activity(id).then((res) => setActivity(res.data.data.activity));
  }, [tab, id]);

  const handleAddMember = async () => {
    if (!selectedUser) return;
    try {
      await projectApi.addMember(id, selectedUser);
      toast.success('Member added');
      setAddMemberOpen(false);
      setSelectedUser('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId) => {
    await projectApi.removeMember(id, userId);
    toast.success('Member removed');
    load();
  };

  const handleDelete = async () => {
    await projectApi.remove(id);
    toast.success('Project deleted');
    navigate('/projects');
  };

  const handleArchive = async () => {
    await projectApi.archive(id);
    toast.success('Project archive status updated');
    load();
  };

  if (loading || !project) return <LoadingSpinner full label="Loading project..." />;

  return (
    <div className="space-y-5">
      <button onClick={() => navigate('/projects')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} /> Back to Projects
      </button>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
            <Badge>{project.status}</Badge>
            <Badge>{project.priority}</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">{project.description}</p>
        </div>
      </div>

      <div className="border-b border-slate-200 flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap ${
              tab === t ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-5">
            <p className="text-xs text-slate-500 mb-1">Progress</p>
            <p className="text-2xl font-bold">{project.progress}%</p>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
              <div className="h-full bg-brand-600" style={{ width: `${project.progress}%` }} />
            </div>
          </div>
          <div className="card p-5">
            <p className="text-xs text-slate-500 mb-1">Tasks</p>
            <p className="text-2xl font-bold">{tasks.length}</p>
            <p className="text-xs text-slate-400 mt-1">{tasks.filter((t) => t.status === 'Done').length} completed</p>
          </div>
          <div className="card p-5">
            <p className="text-xs text-slate-500 mb-1">Due Date</p>
            <p className="text-lg font-semibold">{project.dueDate ? new Date(project.dueDate).toLocaleDateString() : '—'}</p>
          </div>
        </div>
      )}

      {tab === 'Tasks' && (
        <Table
          columns={[
            { key: 'title', header: 'Title' },
            { key: 'status', header: 'Status', render: (r) => <Badge>{r.status}</Badge> },
            { key: 'priority', header: 'Priority', render: (r) => <Badge>{r.priority}</Badge> },
            { key: 'assignee', header: 'Assignee', render: (r) => r.assignee ? <div className="flex items-center gap-2"><Avatar name={r.assignee.name} size={22}/> {r.assignee.name}</div> : '—' },
            { key: 'dueDate', header: 'Due', render: (r) => r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '—' },
          ]}
          data={tasks}
          onRowClick={() => navigate('/tasks')}
          emptyMessage="No tasks in this project yet"
        />
      )}

      {tab === 'Members' && (
        <div className="card p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-sm">Team Members</h3>
            <Button onClick={() => setAddMemberOpen(true)}><UserPlus size={15}/> Add Member</Button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <Avatar name={project.owner.name} src={project.owner.avatar} />
                <div>
                  <p className="text-sm font-medium">{project.owner.name}</p>
                  <p className="text-xs text-slate-400">{project.owner.email}</p>
                </div>
              </div>
              <Badge color="bg-brand-50 text-brand-700">Owner</Badge>
            </div>
            {project.members.map((m) => (
              <div key={m._id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3">
                  <Avatar name={m.name} src={m.avatar} />
                  <div>
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-slate-400">{m.email}</p>
                  </div>
                </div>
                <button onClick={() => handleRemoveMember(m._id)} className="text-slate-400 hover:text-red-600">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Activity' && (
        <div className="card p-5 space-y-3">
          {activity.length === 0 && <p className="text-sm text-slate-400">No activity yet</p>}
          {activity.map((a) => (
            <div key={a._id} className="flex items-start gap-3 text-sm">
              <Avatar name={a.actor?.name || '?'} size={26} src={a.actor?.avatar} />
              <div>
                <p className="text-slate-700">{a.action}</p>
                <p className="text-xs text-slate-400">{new Date(a.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Workflows' && (
        <div className="card p-5 text-center">
          <p className="text-sm text-slate-500 mb-3">Manage automation rules for this project.</p>
          <Button onClick={() => navigate('/workflows')}>Go to Workflows</Button>
        </div>
      )}

      {tab === 'Settings' && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Archive Project</p>
              <p className="text-xs text-slate-500">{project.archived ? 'This project is archived' : 'Hide this project without deleting it'}</p>
            </div>
            <Button variant="secondary" onClick={handleArchive}><Archive size={15}/> {project.archived ? 'Unarchive' : 'Archive'}</Button>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <div>
              <p className="text-sm font-medium text-red-600">Delete Project</p>
              <p className="text-xs text-slate-500">This will permanently delete the project and all its tasks.</p>
            </div>
            <Button variant="danger" onClick={() => setConfirmDelete(true)}><Trash2 size={15}/> Delete</Button>
          </div>
        </div>
      )}

      <Modal
        open={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        title="Add Member"
        footer={<><Button variant="secondary" onClick={() => setAddMemberOpen(false)}>Cancel</Button><Button onClick={handleAddMember}>Add</Button></>}
      >
        <Select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
          <option value="">Select a user...</option>
          {users.filter((u) => u._id !== project.owner._id && !project.members.some((m) => m._id === u._id)).map((u) => (
            <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
          ))}
        </Select>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete this project?"
        description="This action cannot be undone. All tasks in this project will also be deleted."
        confirmLabel="Delete Project"
      />
    </div>
  );
}
