import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function maskEmail(email: string): string {
  if (!email) return '';
  const [name, domain] = email.split('@');
  if (!name || !domain) return email; // Invalid email format

  const maskedName =
    name.length > 2
      ? name.substring(0, 1) + '*'.repeat(name.length - 2) + name.substring(name.length - 1)
      : '*'.repeat(name.length);

  return `${maskedName}@${domain}`;
}
