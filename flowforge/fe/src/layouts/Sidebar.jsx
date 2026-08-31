// import { NavLink } from 'react-router-dom';
// import {
//   LayoutDashboard,
//   FolderKanban,
//   ListChecks,
//   Columns3,
//   Workflow,
//   Activity,
//   BarChart3,
//   Bell,
//   Users,
//   Settings,
//   Zap,
// } from 'lucide-react';

// const links = [
//   { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
//   { to: '/projects', label: 'Projects', icon: FolderKanban },
//   { to: '/tasks', label: 'Tasks', icon: ListChecks },
//   { to: '/kanban', label: 'Kanban Board', icon: Columns3 },
//   { to: '/workflows', label: 'Workflows', icon: Workflow },
//   { to: '/activity', label: 'Activity', icon: Activity },
//   { to: '/analytics', label: 'Analytics', icon: BarChart3 },
//   { to: '/notifications', label: 'Notifications', icon: Bell },
//   { to: '/team', label: 'Team', icon: Users },
//   { to: '/settings', label: 'Settings', icon: Settings },
// ];

// export default function Sidebar() {
//   return (
//     <aside className="w-60 shrink-0 h-screen sticky top-0 border-r border-slate-200 bg-white flex flex-col">
//       <div className="h-16 flex items-center gap-2 px-5 border-b border-slate-200">
//         <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
//           <Zap size={18} className="text-white" fill="white" />
//         </div>
//         <span className="font-bold text-lg tracking-tight">FlowForge</span>
//       </div>
//       <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
//         {links.map(({ to, label, icon: Icon }) => (
//           <NavLink
//             key={to}
//             to={to}
//             className={({ isActive }) =>
//               `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
//                 isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
//               }`
//             }
//           >
//             <Icon size={17} />
//             {label}
//           </NavLink>
//         ))}
//       </nav>
//       <div className="p-3 border-t border-slate-200 text-xs text-slate-400">FlowForge v1.0</div>
//     </aside>
//   );
// }


import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  Columns3,
  Workflow,
  Activity,
  BarChart3,
  Bell,
  Users,
  Settings,
  Zap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/kanban', label: 'Kanban Board', icon: Columns3 },
  { to: '/workflows', label: 'Workflows', icon: Workflow },
  { to: '/activity', label: 'Activity', icon: Activity },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('ff_sidebar_collapsed') === 'true';
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('ff_sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <aside
      className={`${
        collapsed ? 'w-16' : 'w-60'
      } shrink-0 h-screen sticky top-0 border-r border-slate-200 bg-white flex flex-col transition-all duration-200`}
    >
      <div className={`h-16 flex items-center gap-2 border-b border-slate-200 ${collapsed ? 'justify-center px-2' : 'px-5'}`}>
        <div className="w-8 h-8 shrink-0 rounded-lg bg-brand-600 flex items-center justify-center">
          <Zap size={18} className="text-white" fill="white" />
        </div>
        {!collapsed && <span className="font-bold text-lg tracking-tight">FlowForge</span>}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                collapsed ? 'justify-center' : ''
              } ${
                isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <Icon size={17} className="shrink-0" />
            {!collapsed && label}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={toggleCollapsed}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="flex items-center justify-center gap-2 p-3 border-t border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
      >
        {collapsed ? <ChevronRight size={16} /> : (
          <>
            <ChevronLeft size={16} />
            <span className="text-xs">Collapse</span>
          </>
        )}
      </button>

      {!collapsed && (
        <div className="px-3 pb-3 text-xs text-slate-400">FlowForge v1.0</div>
      )}
    </aside>
  );
}