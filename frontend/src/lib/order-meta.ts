import type { ShipmentStatus } from '@/types'

export const SHIPMENT_STATUS_META: Record<ShipmentStatus, { label: string; dot: string; text: string }> = {
  pending: { label: 'Pending pickup', dot: 'bg-amber-400', text: 'text-amber-300' },
  shipped: { label: 'In transit', dot: 'bg-emerald-400', text: 'text-emerald-300' },
  delivered: { label: 'Delivered', dot: 'bg-zinc-400', text: 'text-zinc-300' },
}

export function formatDateTime(timestamp: string): string {
  // SQLite CURRENT_TIMESTAMP is UTC without a timezone suffix, and is returned
  // with a space instead of "T". Treat both forms as UTC so the displayed time
  // does not shift with the viewer's local timezone.
  const normalised = timestamp.includes('T') ? timestamp : timestamp.replace(' ', 'T')
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalised)
  const date = new Date(hasTimezone ? normalised : `${normalised}Z`)
  return date.toLocaleString('en-GB')
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-HK', { style: 'currency', currency: 'HKD' }).format(value)
}
