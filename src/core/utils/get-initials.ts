export function getInitials(name?: string | null): string {
  if (!name || name.trim() === '') return '';

  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
