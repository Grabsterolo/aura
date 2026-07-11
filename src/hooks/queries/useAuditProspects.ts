import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { prospectsKey } from './useProspects';

export interface AuditProspectsError {
  prospect_id: string;
  nombre_negocio: string;
  motivo: string;
}

export interface AuditProspectsResponse {
  procesados: number;
  auditados: number;
  omitidos_sin_web: number;
  errores: AuditProspectsError[];
}

export function useAuditProspects() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prospectIds: string[]): Promise<AuditProspectsResponse> => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error('No hay sesión activa.');
      }

      const response = await fetch('/api/audit-prospects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prospect_ids: prospectIds }),
      });

      const data = (await response.json()) as AuditProspectsResponse & { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? 'Ocurrió un error al auditar los prospectos.');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: prospectsKey });
    },
  });
}
