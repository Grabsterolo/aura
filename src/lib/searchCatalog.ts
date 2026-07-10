export interface Category {
  label: string;
  osmTag: string;
}

export const OVERPASS_CATEGORIES: Category[] = [
  { label: 'Clínicas dentales', osmTag: 'amenity=dentist' },
  { label: 'Talleres mecánicos', osmTag: 'shop=car_repair' },
  { label: 'Ópticas', osmTag: 'shop=optician' },
  { label: 'Veterinarias', osmTag: 'amenity=veterinary' },
  { label: 'Farmacias', osmTag: 'amenity=pharmacy' },
  { label: 'Gimnasios', osmTag: 'leisure=fitness_centre' },
  { label: 'Salones de belleza', osmTag: 'shop=hairdresser' },
  { label: 'Restaurantes', osmTag: 'amenity=restaurant' },
  { label: 'Cafeterías', osmTag: 'amenity=cafe' },
  { label: 'Ferreterías', osmTag: 'shop=hardware' },
];

export interface City {
  label: string;
  lat: number;
  lon: number;
  radiusDeg?: number; // opcional, default 0.08 si no se especifica
}

export interface Country {
  code: string;
  label: string;
  cities: City[];
}

export const OVERPASS_COUNTRIES: Country[] = [
  {
    code: 'CR',
    label: 'Costa Rica',
    cities: [
      { label: 'San José', lat: 9.9281, lon: -84.0907, radiusDeg: 0.1 },
      { label: 'Cartago', lat: 9.8644, lon: -83.9194 },
      { label: 'Heredia', lat: 10.0021, lon: -84.1165 },
      { label: 'Alajuela', lat: 10.0163, lon: -84.2116 },
      { label: 'Liberia', lat: 10.6346, lon: -85.437 },
      { label: 'Puntarenas', lat: 9.9763, lon: -84.8384 },
      { label: 'Escazú', lat: 9.9189, lon: -84.14 },
      { label: 'Desamparados', lat: 9.8974, lon: -84.0655 },
      { label: 'Ciudad Quesada', lat: 10.3242, lon: -84.4265 },
      { label: 'Limón', lat: 9.991, lon: -83.0355 },
    ],
  },
  {
    code: 'MX',
    label: 'México',
    cities: [
      { label: 'Ciudad de México', lat: 19.4326, lon: -99.1332, radiusDeg: 0.15 },
      { label: 'Guadalajara', lat: 20.6597, lon: -103.3496, radiusDeg: 0.12 },
      { label: 'Monterrey', lat: 25.6866, lon: -100.3161, radiusDeg: 0.12 },
      { label: 'Puebla', lat: 19.0414, lon: -98.2063 },
      { label: 'Tijuana', lat: 32.5149, lon: -117.0382 },
      { label: 'León', lat: 21.125, lon: -101.686 },
      { label: 'Querétaro', lat: 20.5888, lon: -100.3899 },
      { label: 'Mérida', lat: 20.9674, lon: -89.5926 },
      { label: 'Cancún', lat: 21.1619, lon: -86.8515 },
      { label: 'Toluca', lat: 19.2926, lon: -99.6568 },
    ],
  },
  {
    code: 'CO',
    label: 'Colombia',
    cities: [
      { label: 'Bogotá', lat: 4.711, lon: -74.0721, radiusDeg: 0.13 },
      { label: 'Medellín', lat: 6.2442, lon: -75.5812, radiusDeg: 0.11 },
      { label: 'Cali', lat: 3.4516, lon: -76.532, radiusDeg: 0.11 },
      { label: 'Barranquilla', lat: 10.9639, lon: -74.7964 },
      { label: 'Cartagena', lat: 10.391, lon: -75.4794 },
      { label: 'Bucaramanga', lat: 7.1193, lon: -73.1227 },
      { label: 'Pereira', lat: 4.8133, lon: -75.6961 },
      { label: 'Cúcuta', lat: 7.8939, lon: -72.5078 },
      { label: 'Manizales', lat: 5.0703, lon: -75.5138 },
      { label: 'Santa Marta', lat: 11.2408, lon: -74.199 },
    ],
  },
  {
    code: 'CL',
    label: 'Chile',
    cities: [
      { label: 'Santiago', lat: -33.4489, lon: -70.6693, radiusDeg: 0.14 },
      { label: 'Valparaíso', lat: -33.0472, lon: -71.6127 },
      { label: 'Concepción', lat: -36.8201, lon: -73.0444, radiusDeg: 0.1 },
      { label: 'La Serena', lat: -29.9027, lon: -71.2519 },
      { label: 'Antofagasta', lat: -23.6509, lon: -70.3975 },
      { label: 'Temuco', lat: -38.7359, lon: -72.5904 },
      { label: 'Rancagua', lat: -34.1708, lon: -70.7444 },
      { label: 'Viña del Mar', lat: -33.0245, lon: -71.5518 },
      { label: 'Puerto Montt', lat: -41.4693, lon: -72.9424 },
      { label: 'Iquique', lat: -20.2141, lon: -70.1522 },
    ],
  },
  {
    code: 'PE',
    label: 'Perú',
    cities: [
      { label: 'Lima', lat: -12.0464, lon: -77.0428, radiusDeg: 0.14 },
      { label: 'Arequipa', lat: -16.409, lon: -71.5375, radiusDeg: 0.1 },
      { label: 'Trujillo', lat: -8.1116, lon: -79.029 },
      { label: 'Chiclayo', lat: -6.7714, lon: -79.8409 },
      { label: 'Piura', lat: -5.1945, lon: -80.6328 },
      { label: 'Cusco', lat: -13.532, lon: -71.9675 },
      { label: 'Iquitos', lat: -3.7437, lon: -73.2516 },
      { label: 'Huancayo', lat: -12.0651, lon: -75.2049 },
      { label: 'Tacna', lat: -18.0146, lon: -70.2536 },
      { label: 'Chimbote', lat: -9.0853, lon: -78.5783 },
    ],
  },
];

export function cityToBbox(city: City): [number, number, number, number] {
  const r = city.radiusDeg ?? 0.08;
  return [city.lat - r, city.lon - r, city.lat + r, city.lon + r];
}
