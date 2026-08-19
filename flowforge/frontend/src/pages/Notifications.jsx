import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { notificationApi } from '../api/endpoints';
import { useSocket } from '../context/SocketContext';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Notifications() {
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    notificationApi.list().then((res) => {
      setNotifications(res.data.data.notifications);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = () => load();
    socket.on('notificationCreated', handler);
    return () => socket.off('notificationCreated', handler);
  }, [socket]);

  const handleClick = async (n) => {
    if (!n.read) await notificationApi.markRead(n._id);
    load();
    if (n.link) navigate(n.link);
  };

  const handleMarkAll = async () => {
    await notificationApi.markAllRead();
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">Stay up to date with everything happening</p>
        </div>
        {notifications.some((n) => !n.read) && (
          <Button variant="secondary" onClick={handleMarkAll}><CheckCheck size={15}/> Mark all as read</Button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner full />
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up." />
      ) : (
        <div className="card p-2">
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => handleClick(n)}
              className={`flex items-start gap-3 px-4 py-3 rounded-lg cursor-pointer hover:bg-slate-50 ${!n.read ? 'bg-brand-50/40' : ''}`}
            >
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-brand-600' : 'bg-transparent'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800">{n.message}</p>
                <p className="text-xs text-slate-400 mt-0.5">{n.type} · {new Date(n.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
