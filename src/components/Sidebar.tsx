import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Megaphone,
  Users,
  ClipboardCheck,
  MessageSquare,
  Settings,
} from 'lucide-react';
import { pendingApprovalsCount } from '../data/mockData';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number;
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/campaigns', label: 'Campañas', icon: Megaphone },
  { to: '/prospects', label: 'Prospectos', icon: Users },
  { to: '/approvals', label: 'Aprobación', icon: ClipboardCheck, badge: pendingApprovalsCount },
  { to: '/conversations', label: 'Conversaciones', icon: MessageSquare },
  { to: '/settings', label: 'Configuración', icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="flex h-full w-[180px] shrink-0 flex-col border-r border-border bg-panel">
      <div className="flex h-16 items-center px-5">
        <span className="text-[15px] font-semibold tracking-tight text-primary">
          Prospecta<span className="text-accent">+</span>
        </span>
      </div>
      <nav className="flex-1 px-2 py-2">
        <ul className="flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon, badge }) => (
            <li key={to} className="relative">
              <NavLink
                to={to}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-2.5 rounded-control px-3 py-2 text-sm transition-colors duration-150 ease-out',
                    isActive
                      ? 'bg-accent/10 text-primary'
                      : 'text-secondary hover:bg-panel hover:text-primary hover:bg-white/5',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={[
                        'absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-accent transition-all duration-200 ease-out',
                        isActive ? 'opacity-100' : 'opacity-0',
                      ].join(' ')}
                    />
                    <Icon size={16} strokeWidth={2} className="shrink-0" />
                    <span className="flex-1 truncate">{label}</span>
                    {badge ? (
                      <span className="rounded-full bg-accent px-1.5 py-0.5 text-[11px] font-medium leading-none text-white">
                        {badge}
                      </span>
                    ) : null}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
