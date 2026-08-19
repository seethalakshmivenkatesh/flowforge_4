import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { taskApi, projectApi } from '../api/endpoints';
import { useSocket } from '../context/SocketContext';
import Badge from '../components/Badge';
import Avatar from '../components/Avatar';
import Select from '../components/Select';
import LoadingSpinner from '../components/LoadingSpinner';

const COLUMNS = ['Todo', 'In Progress', 'Review', 'Done'];
const COLUMN_COLORS = {
  Todo: 'border-t-slate-400',
  'In Progress': 'border-t-blue-500',
  Review: 'border-t-amber-500',
  Done: 'border-t-emerald-500',
};

export default function Kanban() {
  const { socket } = useSocket();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [dragTaskId, setDragTaskId] = useState(null);

  useEffect(() => {
    projectApi.list().then((res) => {
      setProjects(res.data.data.projects);
      if (res.data.data.projects.length) setProjectId(res.data.data.projects[0]._id);
    });
  }, []);

  const load = (pid) => {
    if (!pid) return;
    setLoading(true);
    taskApi.list({ project: pid }).then((res) => {
      setTasks(res.data.data.tasks);
      setLoading(false);
    });
  };

  useEffect(() => {
    load(projectId);
  }, [projectId]);

  useEffect(() => {
    if (!socket || !projectId) return;
    socket.emit('joinProject', projectId);
    const refresh = () => load(projectId);
    socket.on('taskCreated', refresh);
    socket.on('taskUpdated', refresh);
    socket.on('taskStatusChanged', refresh);
    socket.on('taskDeleted', refresh);
    return () => {
      socket.emit('leaveProject', projectId);
      socket.off('taskCreated', refresh);
      socket.off('taskUpdated', refresh);
      socket.off('taskStatusChanged', refresh);
      socket.off('taskDeleted', refresh);
    };
  }, [socket, projectId]);

  const handleDrop = async (status) => {
    if (!dragTaskId) return;
    const task = tasks.find((t) => t._id === dragTaskId);
    if (!task || task.status === status) {
      setDragTaskId(null);
      return;
    }
    // optimistic update
    setTasks((prev) => prev.map((t) => (t._id === dragTaskId ? { ...t, status } : t)));
    setDragTaskId(null);
    try {
      await taskApi.update(dragTaskId, { status });
    } catch (err) {
      toast.error('Failed to update task status');
      load(projectId);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kanban Board</h1>
          <p className="text-sm text-slate-500 mt-1">Drag tasks between columns to update their status</p>
        </div>
        <Select className="w-56" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </Select>
      </div>

      {loading ? (
        <LoadingSpinner full />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col);
            return (
              <div
                key={col}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(col)}
                className={`bg-slate-100/60 rounded-xl border-t-4 ${COLUMN_COLORS[col]} p-3 min-h-[420px]`}
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="font-semibold text-sm text-slate-700">{col}</h3>
                  <span className="text-xs text-slate-400 bg-white rounded-full px-2 py-0.5">{colTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {colTasks.map((t) => (
                    <div
                      key={t._id}
                      draggable
                      onDragStart={() => setDragTaskId(t._id)}
                      className="card p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                    >
                      <p className="text-sm font-medium text-slate-800 mb-2">{t.title}</p>
                      <div className="flex items-center justify-between">
                        <Badge>{t.priority}</Badge>
                        {t.assignee && <Avatar name={t.assignee.name} size={22} src={t.assignee.avatar} />}
                      </div>
                    </div>
                  ))}
                  {colTasks.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-6">No tasks</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
