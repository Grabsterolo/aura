import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/hooks/useAuth';

export function Topbar({ title }: { title: string }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-6">
      <h1 className="text-base font-semibold text-primary">{title}</h1>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Cerrar sesión"
          className="flex h-9 w-9 items-center justify-center rounded-control border border-border text-secondary transition-all duration-150 ease-out hover:border-accent hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <LogOut size={16} />
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-medium text-white">
          JG
        </div>
      </div>
    </header>
  );
}
