import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/campaigns': 'Campañas',
  '/prospects': 'Prospectos',
  '/approvals': 'Aprobación',
  '/conversations': 'Conversaciones',
  '/settings': 'Configuración',
};

export function AppShell() {
  const location = useLocation();
  const title = pageTitles[location.pathname] ?? 'Prospecta';

  return (
    <div className="flex h-screen w-full bg-page">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1200px] px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
