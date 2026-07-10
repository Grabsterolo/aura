import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from './ProtectedRoute';
import type { AuthContextValue } from '@/hooks/useAuth';

const { mockUseAuth } = vi.hoisted(() => ({
  mockUseAuth: vi.fn<() => AuthContextValue>(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: mockUseAuth,
}));

function renderProtectedRoute() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/login" element={<p>Pantalla de login</p>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<p>Contenido protegido</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  it('redirige a /login cuando no hay sesión', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    renderProtectedRoute();

    expect(screen.getByText('Pantalla de login')).toBeInTheDocument();
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument();
  });

  it('muestra un estado de carga mientras se resuelve la sesión, sin redirigir todavía', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    renderProtectedRoute();

    expect(screen.getByText('Cargando…')).toBeInTheDocument();
    expect(screen.queryByText('Pantalla de login')).not.toBeInTheDocument();
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument();
  });

  it('renderiza el contenido protegido cuando hay sesión', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' } as AuthContextValue['user'],
      session: { access_token: 'token' } as AuthContextValue['session'],
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    renderProtectedRoute();

    expect(screen.getByText('Contenido protegido')).toBeInTheDocument();
  });
});
