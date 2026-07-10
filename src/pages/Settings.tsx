import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCampaigns } from '@/hooks/queries/useCampaigns';
import { useUpdateCampaign, type UpdateCampaignValues } from '@/hooks/queries/useUpdateCampaign';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { CampaignForm, type CampaignFormValues } from '@/components/CampaignForm';

const selectClassName =
  'max-w-sm rounded-control px-3 py-2 text-sm outline-none transition-colors duration-150 ease-out focus:border-accent';

export function Settings() {
  const { data: campaigns, isLoading, isError } = useCampaigns();
  const updateCampaign = useUpdateCampaign();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (campaigns && campaigns.length > 0 && !selectedId) {
      setSelectedId(campaigns[0].id);
    }
  }, [campaigns, selectedId]);

  if (isLoading) {
    return <p className="text-sm text-secondary">Cargando configuración…</p>;
  }

  if (isError) {
    return <p className="text-sm text-error">No se pudo cargar la configuración.</p>;
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <EmptyState
        title="Todavía no tenés campañas"
        description="Creá tu primera campaña para poder configurarla acá."
        action={
          <Link to="/campaigns">
            <Button>Ir a Campañas</Button>
          </Link>
        }
      />
    );
  }

  const selectedCampaign = campaigns.find((campaign) => campaign.id === selectedId) ?? campaigns[0];

  const handleSave = (values: CampaignFormValues) => {
    const updateValues: UpdateCampaignValues = {
      nombre: values.nombre,
      industria: values.industria || null,
      zona: values.zona || null,
      tono_voz: values.tono_voz || null,
      umbral_score: values.umbral_score,
      estado: values.estado,
    };

    updateCampaign.mutate({ id: selectedCampaign.id, values: updateValues });
  };

  return (
    <div className="flex flex-col gap-6">
      {campaigns.length > 1 ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="campaign-select" className="text-xs font-medium text-secondary">
            Campaña a configurar
          </label>
          <select
            id="campaign-select"
            value={selectedCampaign.id}
            onChange={(event) => setSelectedId(event.target.value)}
            className={selectClassName}
          >
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.nombre}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <Card className="max-w-2xl">
        <CampaignForm
          key={selectedCampaign.id}
          initialValues={{
            nombre: selectedCampaign.nombre,
            industria: selectedCampaign.industria ?? '',
            zona: selectedCampaign.zona ?? '',
            tono_voz: selectedCampaign.tono_voz ?? '',
            umbral_score: selectedCampaign.umbral_score,
            estado: selectedCampaign.estado,
          }}
          showEstado
          submitLabel="Guardar cambios"
          submitting={updateCampaign.isPending}
          onSubmit={handleSave}
        />
      </Card>
    </div>
  );
}
