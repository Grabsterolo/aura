export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('es-CR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
