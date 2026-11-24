import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

type KpiTone = 'neutral' | 'blue' | 'amber' | 'emerald' | 'rose'

const TONE_ICON_STYLES: Record<KpiTone, string> = {
  neutral: 'bg-secondary text-foreground/80',
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
}

interface KpiCardProps {
  label: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  tone?: KpiTone
  loading?: boolean
  active?: boolean
  onClick?: () => void
  className?: string
}

export function KpiCard({
  label,
  value,
  subtitle,
  icon: Icon,
  tone = 'neutral',
  loading = false,
  active = false,
  onClick,
  className,
}: KpiCardProps) {
  const interactive = Boolean(onClick)
  const Element = interactive ? 'button' : 'div'

  return (
    <Element
      type={interactive ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'group relative flex flex-col justify-between rounded-xl border bg-card p-5 text-left shadow-card transition-all',
        interactive &&
          'cursor-pointer hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active && 'border-primary ring-2 ring-primary/15',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span
          className={cn(
            'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform',
            interactive && 'group-hover:scale-105',
            TONE_ICON_STYLES[tone],
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>

      <div className="mt-3">
        {loading ? (
          <Skeleton className="h-8 w-24 rounded-md" />
        ) : (
          <div className="font-display text-2xl font-bold tracking-tight tabular-nums text-foreground sm:text-[28px]">
            {value}
          </div>
        )}
        {subtitle && (
          <div className="mt-1.5 text-xs text-muted-foreground">
            {loading ? <Skeleton className="h-3.5 w-28" /> : subtitle}
          </div>
        )}
      </div>
    </Element>
  )
}
