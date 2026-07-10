import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Campaign } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/formatDate';
import { supabase } from '@/lib/supabaseClient';
import { prospectsKey } from '@/hooks/queries/useProspects';

const TEST_OSM_TAG = 'amenity=dentist';
const TEST_BBOX: [number, number, number, number] = [9.85, -84.2, 10.05, -83.95];

interface SearchOverpassResponse {
  encontrados?: number;
  insertados?: number;
  duplicados_omitidos?: number;
  error?: string;
}

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const queryClient = useQueryClient();
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleTestSearch = async () => {
    setIsSearching(true);
    setResult(null);

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
          osm_tag: TEST_OSM_TAG,
          bbox: TEST_BBOX,
        }),
      });

      const data = (await response.json()) as SearchOverpassResponse;

      if (!response.ok) {
        setResult(data.error ?? 'Ocurrió un error al buscar prospectos.');
        return;
      }

      const duplicadosTexto = data.duplicados_omitidos
        ? `, ${data.duplicados_omitidos} duplicados omitidos`
        : '';
      setResult(`${data.encontrados ?? 0} encontrados, ${data.insertados ?? 0} insertados${duplicadosTexto}.`);
      queryClient.invalidateQueries({ queryKey: prospectsKey });
    } catch {
      setResult('No se pudo conectar con el servidor.');
    } finally {
      setIsSearching(false);
    }
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

      <div className="mt-4 border-t border-border pt-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={isSearching}
          onClick={handleTestSearch}
        >
          {isSearching ? 'Buscando…' : 'Buscar prospectos (prueba)'}
        </Button>
        {result ? <p className="mt-2 text-xs text-secondary">{result}</p> : null}
      </div>
    </Card>
  );
}
