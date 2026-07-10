import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function Login() {
  const { session, loading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && session) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: signInError } = await signIn(email, password);

    setSubmitting(false);

    if (signInError) {
      setError('Correo o contraseña incorrectos');
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-page px-4">
      <div className="w-full max-w-sm rounded-card border border-border bg-panel p-8">
        <h1 className="text-center text-lg font-semibold tracking-tight text-primary">
          Prospecta + Aura
        </h1>
        <p className="mt-1 text-center text-sm text-secondary">Ingresá a tu cuenta</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-medium text-secondary">
              Correo
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-control border border-border bg-page px-3 py-2 text-sm text-primary outline-none transition-colors duration-150 ease-out focus:border-accent"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-medium text-secondary">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-control border border-border bg-page px-3 py-2 text-sm text-primary outline-none transition-colors duration-150 ease-out focus:border-accent"
            />
          </div>

          {error ? <p className="text-sm text-error">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-control bg-accent px-4 py-2 text-sm font-medium text-white transition-all duration-150 ease-out hover:-translate-y-px hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
