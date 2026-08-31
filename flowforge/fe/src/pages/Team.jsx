import { useEffect, useState } from 'react';
import { Users, Search } from 'lucide-react';
import { userApi } from '../api/endpoints';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Team() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      userApi.list({ search }).then((res) => {
        setUsers(res.data.data.users);
        setLoading(false);
      });
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Team</h1>
        <p className="text-sm text-slate-500 mt-1">Everyone with access to FlowForge</p>
      </div>

      <div className="relative w-72">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input placeholder="Search people..." className="input pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <LoadingSpinner full />
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title="No team members found" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u) => (
            <div key={u._id} className="card p-4 flex items-center gap-3">
              <Avatar name={u.name} size={40} src={u.avatar} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{u.name}</p>
                <p className="text-xs text-slate-400 truncate">{u.email}</p>
              </div>
              <Badge color="bg-slate-100 text-slate-600">{u.role}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
