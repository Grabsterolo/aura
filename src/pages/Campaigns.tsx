import { useState } from 'react';
import { useCampaigns } from '@/hooks/queries/useCampaigns';
import { useCreateCampaign, type CreateCampaignInput } from '@/hooks/queries/useCreateCampaign';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { CampaignCard } from '@/components/CampaignCard';
import { CampaignForm, type CampaignFormValues } from '@/components/CampaignForm';

export function Campaigns() {
  const { data: campaigns, isLoading, isError } = useCampaigns();
  const createCampaign = useCreateCampaign();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = (values: CampaignFormValues) => {
    const input: CreateCampaignInput = {
      nombre: values.nombre,
      industria: values.industria || null,
      zona: values.zona || null,
      tono_voz: values.tono_voz || null,
      umbral_score: values.umbral_score,
    };

    createCampaign.mutate(input, {
      onSuccess: () => setIsCreating(false),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-primary">Todas las campañas</h2>
        <Button onClick={() => setIsCreating((prev) => !prev)}>
          {isCreating ? 'Cerrar' : 'Nueva campaña'}
        </Button>
      </div>

      {isCreating ? (
        <Card>
          <CampaignForm
            submitLabel="Crear campaña"
            submitting={createCampaign.isPending}
            onSubmit={handleCreate}
            onCancel={() => setIsCreating(false)}
          />
        </Card>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-secondary">Cargando campañas…</p>
      ) : isError ? (
        <p className="text-sm text-error">No se pudieron cargar las campañas.</p>
      ) : campaigns && campaigns.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Todavía no tenés campañas"
          description="Creá tu primera campaña con el botón 'Nueva campaña' para empezar a buscar prospectos."
        />
      )}
    </div>
  );
}
