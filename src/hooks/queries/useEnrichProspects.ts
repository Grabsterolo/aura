import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { prospectsKey } from './useProspects';
import { scoresKey } from './useScores';
import type { AuditProspectsResponse } from './useAuditProspects';

export interface EnrichProspectsError {
  prospect_id: string;
  nombre_negocio: string;
  motivo: string;
}

export interface EnrichProspectsResponse {
  procesados: number;
  enriquecidos: number;
  sin_resultado: number;
  omitidos_con_sitio: number;
  errores: EnrichProspectsError[];
  enriched_ids: string[];
}

async function getAuthToken(): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (!token) {
    throw new Error('No hay sesión activa.');
  }

  return token;
}

async function postJson<T>(path: string, body: unknown, token: string): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? 'Ocurrió un error en la solicitud.');
  }

  return data;
}

export function useEnrichProspects() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prospectIds: string[]): Promise<EnrichProspectsResponse> => {
      const token = await getAuthToken();

      const enrichData = await postJson<EnrichProspectsResponse>(
        '/api/enrich-prospects',
        { prospect_ids: prospectIds },
        token,
      );

      // Los prospectos enriquecidos encontraron sitio web recién ahora, pero ya
      // están en estado 'auditado' (el botón "Auditar" solo aparece con estado
      // 'encontrado'), así que no hay forma de disparar la auditoría del sitio
      // nuevo desde la UI. Se encadena automáticamente acá, solo para los que
      // realmente cambiaron (no para todo el batch).
      if (enrichData.enriched_ids.length > 0) {
        await postJson<AuditProspectsResponse>(
          '/api/audit-prospects',
          { prospect_ids: enrichData.enriched_ids },
          token,
        );
      }

      return enrichData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: prospectsKey });
      queryClient.invalidateQueries({ queryKey: scoresKey });
    },
  });
}
