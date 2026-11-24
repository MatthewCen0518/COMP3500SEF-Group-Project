import { cn } from '@/lib/utils'
import { SHIPMENT_STATUS_META, STOCK_HEALTH_META, type StockHealth } from '@/lib/order-meta'
import type { ShipmentStatus } from '@/types'

interface ShipmentStatusBadgeProps {
  status: ShipmentStatus
  className?: string
}

export function ShipmentStatusBadge({ status, className }: ShipmentStatusBadgeProps) {
  const meta = SHIPMENT_STATUS_META[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        meta.badge,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  )
}

interface StockHealthBadgeProps {
  health: StockHealth
  className?: string
}

export function StockHealthBadge({ health, className }: StockHealthBadgeProps) {
  const meta = STOCK_HEALTH_META[health]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        meta.badge,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  )
}
