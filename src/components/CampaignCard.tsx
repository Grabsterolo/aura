import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Campaign } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/formatDate';
import { supabase } from '@/lib/supabaseClient';
import { prospectsKey } from '@/hooks/queries/useProspects';
import { useDeleteCampaign } from '@/hooks/queries/useDeleteCampaign';

interface SearchOverpassResponse {
  encontrados?: number;
  insertados?: number;
  duplicados_omitidos?: number;
  sedes_agrupadas?: number;
  error?: string;
  detalles?: string[];
}

interface SearchCriteria {
  osm_tag: string;
  bbox: [number, number, number, number];
}

function parseCriterioBusqueda(value: Campaign['criterio_busqueda']): SearchCriteria | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const osmTag = record.osm_tag;
  const bbox = record.bbox;

  if (typeof osmTag !== 'string') {
    return null;
  }

  if (!Array.isArray(bbox) || bbox.length !== 4 || !bbox.every((n) => typeof n === 'number')) {
    return null;
  }

  return { osm_tag: osmTag, bbox: bbox as [number, number, number, number] };
}

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const queryClient = useQueryClient();
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [resultDetails, setResultDetails] = useState<string[] | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const deleteCampaign = useDeleteCampaign();

  const criteria = parseCriterioBusqueda(campaign.criterio_busqueda);

  const handleSearch = async () => {
    if (!criteria) return;

    setIsSearching(true);
    setResult(null);
    setResultDetails(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        setResult('No hay sesión activa.');
        return;
      }

      const response = await fetch('/api/search-overpass', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          campaign_id: campaign.id,
          osm_tag: criteria.osm_tag,
          bbox: criteria.bbox,
        }),
      });

      const data = (await response.json()) as SearchOverpassResponse;

      if (!response.ok) {
        setResult(data.error ?? 'Ocurrió un error al buscar prospectos.');
        setResultDetails(data.detalles ?? null);
        return;
      }

      const duplicadosTexto = data.duplicados_omitidos
        ? `, ${data.duplicados_omitidos} duplicados omitidos`
        : '';
      const sedesTexto = data.sedes_agrupadas
        ? `, ${data.sedes_agrupadas} ${data.sedes_agrupadas === 1 ? 'sede agrupada' : 'sedes agrupadas'}`
        : '';
      setResult(
        `${data.encontrados ?? 0} encontrados, ${data.insertados ?? 0} insertados${duplicadosTexto}${sedesTexto}.`,
      );
      queryClient.invalidateQueries({ queryKey: prospectsKey });
    } catch {
      setResult('No se pudo conectar con el servidor.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleDelete = () => {
    deleteCampaign.mutate(campaign.id, {
      onSuccess: () => setIsConfirmingDelete(false),
    });
  };

  return (
    <Card hoverable>
      <p className="text-sm font-medium text-primary">{campaign.nombre}</p>
      <p className="mt-0.5 text-xs text-muted">
        {campaign.industria ?? 'Sin industria'} · {campaign.zona ?? 'Sin zona'}
      </p>
      <div className="mt-4 flex items-center justify-between">
        <StatusBadge status={campaign.estado} />
        <span className="text-xs text-muted">{formatDate(campaign.creado_en)}</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={isSearching || !criteria}
          onClick={handleSearch}
        >
          {isSearching ? 'Buscando…' : 'Buscar prospectos'}
        </Button>

        {isConfirmingDelete ? (
          <span className="flex items-center gap-2">
            <span className="text-xs text-secondary">¿Eliminar campaña?</span>
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={deleteCampaign.isPending}
              onClick={handleDelete}
            >
              {deleteCampaign.isPending ? 'Eliminando…' : 'Sí'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={deleteCampaign.isPending}
              onClick={() => setIsConfirmingDelete(false)}
            >
              No
            </Button>
          </span>
        ) : (
          <Button type="button" variant="danger" size="sm" onClick={() => setIsConfirmingDelete(true)}>
            Eliminar campaña
          </Button>
        )}
      </div>

      {!criteria ? (
        <p className="mt-2 text-xs text-muted">Definí categoría y zona en Configuración para poder buscar.</p>
      ) : null}
      {result ? <p className="mt-2 text-xs text-secondary">{result}</p> : null}
      {resultDetails && resultDetails.length > 0 ? (
        <ul className="mt-1 flex flex-col gap-0.5">
          {resultDetails.map((detail, index) => (
            <li key={index} className="break-all text-xs text-error">
              {detail}
            </li>
          ))}
        </ul>
      ) : null}
      {deleteCampaign.isError ? (
        <p className="mt-2 text-xs text-error">
          {deleteCampaign.error instanceof Error
            ? deleteCampaign.error.message
            : 'No se pudo eliminar la campaña.'}
        </p>
      ) : null}
    </Card>
  );
}
