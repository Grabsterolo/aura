import { useState, type FormEvent } from 'react';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export interface CampaignFormValues {
  nombre: string;
  industria: string;
  zona: string;
  tono_voz: string;
  umbral_score: number;
  estado: string;
}

interface CampaignFormProps {
  initialValues?: Partial<CampaignFormValues>;
  showEstado?: boolean;
  submitLabel: string;
  submitting?: boolean;
  onSubmit: (values: CampaignFormValues) => void;
  onCancel?: () => void;
}

const ESTADO_OPTIONS = [
  { value: 'activa', label: 'Activa' },
  { value: 'en_curso', label: 'En curso' },
  { value: 'pausada', label: 'Pausada' },
  { value: 'cerrada', label: 'Cerrada' },
];

const selectClassName =
  'rounded-control px-3 py-2 text-sm outline-none transition-colors duration-150 ease-out focus:border-accent';

export function CampaignForm({
  initialValues,
  showEstado = false,
  submitLabel,
  submitting = false,
  onSubmit,
  onCancel,
}: CampaignFormProps) {
  const [nombre, setNombre] = useState(initialValues?.nombre ?? '');
  const [industria, setIndustria] = useState(initialValues?.industria ?? '');
  const [zona, setZona] = useState(initialValues?.zona ?? '');
  const [tonoVoz, setTonoVoz] = useState(initialValues?.tono_voz ?? '');
  const [umbralScore, setUmbralScore] = useState(initialValues?.umbral_score ?? 80);
  const [estado, setEstado] = useState(initialValues?.estado ?? 'activa');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit({
      nombre,
      industria,
      zona,
      tono_voz: tonoVoz,
      umbral_score: umbralScore,
      estado,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        id="nombre"
        label="Nombre"
        required
        value={nombre}
        onChange={(event) => setNombre(event.target.value)}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          id="industria"
          label="Industria"
          value={industria}
          onChange={(event) => setIndustria(event.target.value)}
        />
        <Input id="zona" label="Zona" value={zona} onChange={(event) => setZona(event.target.value)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-secondary">Canal</span>
        <div className="flex items-center gap-2 rounded-control border border-border bg-panel px-3 py-2 text-sm text-secondary">
          <Mail size={14} className="shrink-0 text-muted" />
          Correo electrónico
        </div>
        <p className="text-xs text-muted">
          El primer contacto siempre es por correo — es una regla fija del proyecto.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          id="tono_voz"
          label="Tono de voz"
          value={tonoVoz}
          onChange={(event) => setTonoVoz(event.target.value)}
        />
        <Input
          id="umbral_score"
          label="Umbral de score"
          type="number"
          min={0}
          max={100}
          value={umbralScore}
          onChange={(event) => setUmbralScore(Number(event.target.value))}
        />
      </div>

      {showEstado ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="estado" className="text-xs font-medium text-secondary">
            Estado
          </label>
          <select
            id="estado"
            value={estado}
            onChange={(event) => setEstado(event.target.value)}
            className={selectClassName}
          >
            {ESTADO_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="mt-2 flex items-center gap-2">
        <Button type="submit" disabled={submitting || !nombre.trim()}>
          {submitting ? 'Guardando…' : submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  );
}
