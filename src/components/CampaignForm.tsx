import { useState, type FormEvent } from 'react';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { OVERPASS_CATEGORIES, OVERPASS_COUNTRIES, cityToBbox } from '@/lib/searchCatalog';

export interface CampaignFormValues {
  nombre: string;
  industria: string;
  zona: string;
  criterio_busqueda: { osm_tag: string; bbox: [number, number, number, number] };
  tono_voz: string;
  umbral_score: number;
  estado: string;
}

interface CampaignFormProps {
  initialValues?: Partial<Pick<CampaignFormValues, 'nombre' | 'industria' | 'zona' | 'tono_voz' | 'umbral_score' | 'estado'>>;
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
  'rounded-control px-3 py-2 text-sm outline-none transition-colors duration-150 ease-out focus:border-accent disabled:cursor-not-allowed disabled:opacity-60';

function resolveInitialCategory(industria?: string): string {
  if (!industria) return '';
  return OVERPASS_CATEGORIES.find((category) => category.label === industria)?.label ?? '';
}

function resolveInitialLocation(zona?: string): { countryCode: string; cityLabel: string } {
  const empty = { countryCode: '', cityLabel: '' };
  if (!zona) return empty;

  const [cityPart, countryPart] = zona.split(',').map((part) => part.trim());
  if (!cityPart || !countryPart) return empty;

  const country = OVERPASS_COUNTRIES.find((candidate) => candidate.label === countryPart);
  if (!country) return empty;

  const city = country.cities.find((candidate) => candidate.label === cityPart);
  if (!city) return empty;

  return { countryCode: country.code, cityLabel: city.label };
}

export function CampaignForm({
  initialValues,
  showEstado = false,
  submitLabel,
  submitting = false,
  onSubmit,
  onCancel,
}: CampaignFormProps) {
  const [nombre, setNombre] = useState(initialValues?.nombre ?? '');
  const [categoryLabel, setCategoryLabel] = useState(() => resolveInitialCategory(initialValues?.industria));
  const initialLocation = resolveInitialLocation(initialValues?.zona);
  const [countryCode, setCountryCode] = useState(initialLocation.countryCode);
  const [cityLabel, setCityLabel] = useState(initialLocation.cityLabel);
  const [tonoVoz, setTonoVoz] = useState(initialValues?.tono_voz ?? '');
  const [umbralScore, setUmbralScore] = useState(initialValues?.umbral_score ?? 80);
  const [estado, setEstado] = useState(initialValues?.estado ?? 'activa');

  const selectedCountry = OVERPASS_COUNTRIES.find((country) => country.code === countryCode) ?? null;
  const availableCities = selectedCountry?.cities ?? [];

  const handleCountryChange = (code: string) => {
    setCountryCode(code);
    setCityLabel('');
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const category = OVERPASS_CATEGORIES.find((candidate) => candidate.label === categoryLabel);
    const country = OVERPASS_COUNTRIES.find((candidate) => candidate.code === countryCode);
    const city = country?.cities.find((candidate) => candidate.label === cityLabel);

    if (!category || !country || !city) {
      return;
    }

    onSubmit({
      nombre,
      industria: category.label,
      zona: `${city.label}, ${country.label}`,
      criterio_busqueda: { osm_tag: category.osmTag, bbox: cityToBbox(city) },
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

      <div className="flex flex-col gap-1.5">
        <label htmlFor="categoria" className="text-xs font-medium text-secondary">
          Categoría
        </label>
        <select
          id="categoria"
          required
          value={categoryLabel}
          onChange={(event) => setCategoryLabel(event.target.value)}
          className={selectClassName}
        >
          <option value="" disabled>
            Seleccionar categoría
          </option>
          {OVERPASS_CATEGORIES.map((category) => (
            <option key={category.label} value={category.label}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pais" className="text-xs font-medium text-secondary">
            País
          </label>
          <select
            id="pais"
            required
            value={countryCode}
            onChange={(event) => handleCountryChange(event.target.value)}
            className={selectClassName}
          >
            <option value="" disabled>
              Seleccionar país
            </option>
            {OVERPASS_COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="ciudad" className="text-xs font-medium text-secondary">
            Ciudad
          </label>
          <select
            id="ciudad"
            required
            disabled={!selectedCountry}
            value={cityLabel}
            onChange={(event) => setCityLabel(event.target.value)}
            className={selectClassName}
          >
            <option value="" disabled>
              {selectedCountry ? 'Seleccionar ciudad' : 'Elegí un país primero'}
            </option>
            {availableCities.map((city) => (
              <option key={city.label} value={city.label}>
                {city.label}
              </option>
            ))}
          </select>
        </div>
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
