import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { FolderKanban, ListChecks, CheckCircle2, AlertTriangle, Zap, Clock } from 'lucide-react';
import { dashboardApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';

const COLORS = ['#3f6ab5', '#f59e0b', '#10b981', '#ef4444'];

function StatCard({ icon: Icon, label, value, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-600',
  };
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tones[tone]}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([dashboardApi.summary(), dashboardApi.charts()])
      .then(([s, c]) => {
        setSummary(s.data.data);
        setCharts(c.data.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => load();
    socket.on('taskCreated', refresh);
    socket.on('taskUpdated', refresh);
    socket.on('taskStatusChanged', refresh);
    socket.on('workflowExecuted', refresh);
    return () => {
      socket.off('taskCreated', refresh);
      socket.off('taskUpdated', refresh);
      socket.off('taskStatusChanged', refresh);
      socket.off('workflowExecuted', refresh);
    };
  }, [socket]);

  if (loading) return <LoadingSpinner full label="Loading dashboard..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="text-sm text-slate-500 mt-1">Here's what's happening across your projects.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={FolderKanban} label="Active Projects" value={summary.activeProjects} />
        <StatCard icon={ListChecks} label="Total Tasks" value={summary.totalTasks} />
        <StatCard icon={CheckCircle2} label="Completed Tasks" value={summary.completedTasks} tone="emerald" />
        <StatCard icon={AlertTriangle} label="Overdue Tasks" value={summary.overdueTasks} tone="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold text-sm mb-4">Tasks Completed Over Time</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={charts.tasksCompletedOverTime.map((d) => ({ date: d._id, count: d.count }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3f6ab5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-sm mb-4">Task Status Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={charts.taskStatusDistribution.map((d) => ({ name: d._id, value: d.count }))}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {charts.taskStatusDistribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-sm mb-4">Project Progress</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={charts.projectProgress}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} hide={charts.projectProgress.length > 6} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="progress" fill="#3f6ab5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-sm mb-4">Team Workload</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={charts.teamWorkload} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Zap size={15}/> Recent Activity</h3>
          <div className="space-y-3">
            {summary.recentActivity.length === 0 && <p className="text-sm text-slate-400">No recent activity</p>}
            {summary.recentActivity.map((a) => (
              <div key={a._id} className="flex items-start gap-3 text-sm">
                <Avatar name={a.actor?.name || '?'} size={26} src={a.actor?.avatar} />
                <div>
                  <p className="text-slate-700">{a.action}</p>
                  <p className="text-xs text-slate-400">{new Date(a.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Clock size={15}/> Upcoming Deadlines</h3>
          <div className="space-y-3">
            {summary.upcomingDeadlines.length === 0 && <p className="text-sm text-slate-400">No upcoming deadlines</p>}
            {summary.upcomingDeadlines.map((t) => (
              <div
                key={t._id}
                onClick={() => navigate('/tasks')}
                className="flex items-center justify-between text-sm cursor-pointer hover:bg-slate-50 rounded-lg px-1 py-1"
              >
                <div className="flex items-center gap-2">
                  <Avatar name={t.assignee?.name || '?'} size={24} src={t.assignee?.avatar} />
                  <span className="text-slate-700">{t.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{t.priority}</Badge>
                  <span className="text-xs text-slate-400">{new Date(t.dueDate).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
