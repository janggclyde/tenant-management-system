import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBillingReference(id: number | string): string {
  return `IN-${String(id).padStart(5, '0')}`;
}

export function formatCollectionReference(id: number | string): string {
  return `OR-${String(id).padStart(5, '0')}`;
}

export function formatBillingCycle(cycle?: string): string {
  if (!cycle) return 'Monthly';
  const trimmed = cycle.trim();
  switch (trimmed.toLowerCase()) {
    case 'quarterly': return 'Quarterly';
    case 'annually':
    case 'annual': return 'Annually';
    case 'one_time':
    case 'one-time': return 'One-time';
    case 'monthly': return 'Monthly';
    default: return trimmed;
  }
}

