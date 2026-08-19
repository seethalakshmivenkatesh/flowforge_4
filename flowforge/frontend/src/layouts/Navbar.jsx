import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, LogOut, User as UserIcon, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { notificationApi, searchApi } from '../api/endpoints';
import Avatar from '../components/Avatar';
import Dropdown from '../components/Dropdown';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);

  useEffect(() => {
    notificationApi.list().then((res) => setUnread(res.data.data.unreadCount)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = () => setUnread((u) => u + 1);
    socket.on('notificationCreated', handler);
    return () => socket.off('notificationCreated', handler);
  }, [socket]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    const t = setTimeout(() => {
      searchApi.global(query).then((res) => setResults(res.data.data));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="relative w-full max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects, tasks, workflows..."
          className="input pl-9 bg-slate-50"
        />
        {results && (
          <div className="absolute mt-2 w-full card max-h-80 overflow-y-auto z-40 py-2">
            {['projects', 'tasks', 'workflows', 'users'].map((key) =>
              results[key]?.length ? (
                <div key={key} className="px-3 py-1">
                  <p className="text-xs uppercase text-slate-400 font-semibold mt-1 mb-1">{key}</p>
                  {results[key].slice(0, 4).map((item) => (
                    <div
                      key={item._id}
                      onClick={() => {
                        setQuery('');
                        setResults(null);
                        if (key === 'projects') navigate(`/projects/${item._id}`);
                        if (key === 'tasks') navigate(`/tasks`);
                        if (key === 'workflows') navigate(`/workflows`);
                      }}
                      className="px-2 py-1.5 rounded-md hover:bg-slate-50 cursor-pointer text-sm"
                    >
                      {item.name || item.title}
                    </div>
                  ))}
                </div>
              ) : null
            )}
            {Object.values(results).every((v) => !v.length) && (
              <p className="px-3 py-2 text-sm text-slate-400">No results found</p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/notifications')} className="relative text-slate-500 hover:text-slate-800">
          <Bell size={19} />
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        <Dropdown
          trigger={
            <div className="flex items-center gap-2 cursor-pointer">
              <Avatar name={user?.name} size={32} src={user?.avatar} />
            </div>
          }
        >
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
          <button onClick={() => navigate('/settings')} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2">
            <UserIcon size={14} /> Profile
          </button>
          <button onClick={() => navigate('/settings')} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2">
            <Settings size={14} /> Settings
          </button>
          <button onClick={logout} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 text-red-600 flex items-center gap-2">
            <LogOut size={14} /> Logout
          </button>
        </Dropdown>
      </div>
    </header>
  );
}
