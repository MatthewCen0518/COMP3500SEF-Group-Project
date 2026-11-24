import type { ShipmentStatus } from '@/types'

export const LOW_STOCK_THRESHOLD = 20

export interface StatusMeta {
  label: string
  shortLabel: string
  dot: string
  text: string
  badge: string
  chartColor: string
}

export const SHIPMENT_STATUS_META: Record<ShipmentStatus, StatusMeta> = {
  pending: {
    label: 'Pending pickup',
    shortLabel: 'Pending',
    dot: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
    badge:
      'border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300',
    chartColor: '#f59e0b',
  },
  shipped: {
    label: 'In transit',
    shortLabel: 'In transit',
    dot: 'bg-blue-500',
    text: 'text-blue-700 dark:text-blue-300',
    badge:
      'border-blue-200/80 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300',
    chartColor: '#2563eb',
  },
  delivered: {
    label: 'Delivered',
    shortLabel: 'Delivered',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300',
    badge:
      'border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300',
    chartColor: '#10b981',
  },
}

export type StockHealth = 'in_stock' | 'low_stock' | 'out_of_stock'

export function getStockHealth(quantity: number): StockHealth {
  if (quantity <= 0) return 'out_of_stock'
  if (quantity < LOW_STOCK_THRESHOLD) return 'low_stock'
  return 'in_stock'
}

export const STOCK_HEALTH_META: Record<
  StockHealth,
  { label: string; dot: string; badge: string; bar: string }
> = {
  in_stock: {
    label: 'In stock',
    dot: 'bg-emerald-500',
    badge:
      'border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300',
    bar: 'bg-emerald-500',
  },
  low_stock: {
    label: 'Low stock',
    dot: 'bg-amber-500',
    badge:
      'border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300',
    bar: 'bg-amber-500',
  },
  out_of_stock: {
    label: 'Out of stock',
    dot: 'bg-rose-500',
    badge:
      'border-rose-200/80 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300',
    bar: 'bg-rose-500',
  },
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
