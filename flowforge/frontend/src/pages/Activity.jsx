import { useEffect, useState } from 'react';
import { Activity as ActivityIcon } from 'lucide-react';
import { projectApi } from '../api/endpoints';
import { useSocket } from '../context/SocketContext';
import Select from '../components/Select';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Activity() {
  const { socket } = useSocket();
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectApi.list().then((res) => {
      setProjects(res.data.data.projects);
      if (res.data.data.projects.length) setProjectId(res.data.data.projects[0]._id);
      else setLoading(false);
    });
  }, []);

  const load = (pid) => {
    if (!pid) return;
    setLoading(true);
    projectApi.activity(pid).then((res) => {
      setActivity(res.data.data.activity);
      setLoading(false);
    });
  };

  useEffect(() => { load(projectId); }, [projectId]);

  useEffect(() => {
    if (!socket || !projectId) return;
    socket.emit('joinProject', projectId);
    const refresh = () => load(projectId);
    ['taskCreated', 'taskUpdated', 'taskStatusChanged', 'projectUpdated', 'workflowExecuted'].forEach((evt) => socket.on(evt, refresh));
    return () => {
      socket.emit('leaveProject', projectId);
      ['taskCreated', 'taskUpdated', 'taskStatusChanged', 'projectUpdated', 'workflowExecuted'].forEach((evt) => socket.off(evt, refresh));
    };
  }, [socket, projectId]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Activity</h1>
          <p className="text-sm text-slate-500 mt-1">A live feed of what's happening on your team</p>
        </div>
        {projects.length > 0 && (
          <Select className="w-56" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </Select>
        )}
      </div>

      {loading ? (
        <LoadingSpinner full />
      ) : activity.length === 0 ? (
        <EmptyState icon={ActivityIcon} title="No activity yet" description="Actions across this project will show up here in real time." />
      ) : (
        <div className="card p-5 space-y-4">
          {activity.map((a) => (
            <div key={a._id} className="flex items-start gap-3 text-sm border-b border-slate-50 last:border-0 pb-3 last:pb-0">
              <Avatar name={a.actor?.name || '?'} size={28} src={a.actor?.avatar} />
              <div>
                <p className="text-slate-700">{a.action}</p>
                <p className="text-xs text-slate-400">{new Date(a.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
