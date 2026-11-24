import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  DollarSign,
  FileText,
  Package,
  Plus,
  RefreshCw,
  Send,
  Truck,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { toast } from 'sonner'
import { inventoryApi, shipmentApi } from '@/api'
import { ApiError } from '@/lib/request'
import {
  LOW_STOCK_THRESHOLD,
  SHIPMENT_STATUS_META,
  formatCurrency,
  formatDateTime,
  getStockHealth,
} from '@/lib/order-meta'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import type { InventoryItem, Shipment, ShipmentStatus } from '@/types'
import { cn } from '@/lib/utils'
import { CreateWaybillDialog } from '@/components/CreateWaybillDialog'
import { KpiCard } from '@/components/KpiCard'
import { ShipmentStatusBadge, StockHealthBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export default function Dashboard() {
  const user = useAuthStore((state) => state.user)
  const theme = useThemeStore((state) => state.theme)
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [preselectedSku, setPreselectedSku] = useState<string | undefined>(undefined)
  const requestId = useRef(0)

  const load = useCallback(async () => {
    const currentRequest = ++requestId.current
    setLoading(true)
    setError(null)
    try {
      const [shipmentRows, itemRows] = await Promise.all([shipmentApi.list(), inventoryApi.list()])
      if (currentRequest !== requestId.current) return
      setShipments(shipmentRows)
      setInventory(itemRows)
    } catch (cause) {
      if (currentRequest === requestId.current) {
        const message = cause instanceof ApiError ? cause.message : 'Unable to load dashboard data'
        setError(message)
        toast.error(message)
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const requests = requestId
    const frame = requestAnimationFrame(() => {
      void load()
    })
    return () => {
      cancelAnimationFrame(frame)
      requests.current++
    }
  }, [load])

  const pendingCount = shipments.filter((s) => s.status === 'pending').length
  const shippedCount = shipments.filter((s) => s.status === 'shipped').length
  const deliveredCount = shipments.filter((s) => s.status === 'delivered').length
  const totalInventoryValue = inventory.reduce(
    (sum, item) => sum + item.stock_quantity * item.unit_price,
    0,
  )
  const lowStockItems = inventory
    .filter((item) => item.stock_quantity < LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.stock_quantity - b.stock_quantity)

  const recentShipments = [...shipments].sort((a, b) => b.id - a.id).slice(0, 5)
  const watchlistItems = [...inventory]
    .sort((a, b) => a.stock_quantity - b.stock_quantity)
    .slice(0, 5)

  const statusChartData: Array<{
    key: ShipmentStatus
    name: string
    value: number
    color: string
  }> = [
    {
      key: 'pending',
      name: SHIPMENT_STATUS_META.pending.label,
      value: pendingCount,
      color: SHIPMENT_STATUS_META.pending.chartColor,
    },
    {
      key: 'shipped',
      name: SHIPMENT_STATUS_META.shipped.label,
      value: shippedCount,
      color: SHIPMENT_STATUS_META.shipped.chartColor,
    },
    {
      key: 'delivered',
      name: SHIPMENT_STATUS_META.delivered.label,
      value: deliveredCount,
      color: SHIPMENT_STATUS_META.delivered.chartColor,
    },
  ]

  const stockChartData = [...inventory]
    .sort((a, b) => b.stock_quantity - a.stock_quantity)
    .slice(0, 6)
    .map((item) => ({
      sku: item.sku ?? `#${item.id}`,
      name: item.item_name,
      stock: item.stock_quantity,
      isLow: item.stock_quantity < LOW_STOCK_THRESHOLD,
    }))

  const axisColor = theme === 'dark' ? '#94a3b8' : '#64748b'
  const gridColor = theme === 'dark' ? '#1e293b' : '#e2e8f0'
  const tooltipStyle = {
    backgroundColor: theme === 'dark' ? '#131926' : '#ffffff',
    borderColor: theme === 'dark' ? '#273244' : '#e2e8f0',
    borderRadius: '10px',
    fontSize: '12px',
    color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
    boxShadow: '0 8px 24px -6px rgba(15, 23, 42, 0.16)',
  }

  function openCreateWithSku(sku?: string) {
    setPreselectedSku(sku)
    setCreateOpen(true)
  }

  const todayLabel = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date())

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{todayLabel}</p>
          <h1 className="font-display mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-[28px]">
            Welcome back, {user?.username ?? 'Operator'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time snapshot of shipments, warehouse stock levels, and fulfillment activity.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" onClick={load} disabled={loading} className="h-9">
            <RefreshCw className={cn('mr-1.5 h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Button
            onClick={() => openCreateWithSku(undefined)}
            disabled={loading || (error !== null && inventory.length === 0)}
            className="h-9"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New waybill
          </Button>
        </div>
      </div>

      {/* Error banner if API unavailable */}
      {!loading && error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Could not load operations data: {error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={load}>
            Retry
          </Button>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total shipments"
          value={error ? '—' : shipments.length.toLocaleString('en-GB')}
          subtitle={error ? undefined : `${pendingCount} pending · ${deliveredCount} delivered`}
          icon={FileText}
          tone="blue"
          loading={loading}
        />
        <KpiCard
          label="In transit"
          value={error ? '—' : shippedCount.toLocaleString('en-GB')}
          subtitle={
            error
              ? undefined
              : shipments.length > 0
                ? `${Math.round((shippedCount / shipments.length) * 100)}% of all shipments`
                : 'No active transit'
          }
          icon={Truck}
          tone="emerald"
          loading={loading}
        />
        <KpiCard
          label="Inventory valuation"
          value={error ? '—' : formatCurrency(totalInventoryValue)}
          subtitle={
            error
              ? undefined
              : `${inventory.length} SKUs · ${inventory
                  .reduce((sum, i) => sum + i.stock_quantity, 0)
                  .toLocaleString('en-GB')} units`
          }
          icon={DollarSign}
          tone="neutral"
          loading={loading}
        />
        <KpiCard
          label="Low stock alerts"
          value={error ? '—' : lowStockItems.length.toLocaleString('en-GB')}
          subtitle={
            error
              ? undefined
              : lowStockItems.length > 0
                ? `Below ${LOW_STOCK_THRESHOLD} units threshold`
                : 'All SKUs above threshold'
          }
          icon={AlertTriangle}
          tone={lowStockItems.length > 0 ? 'amber' : 'emerald'}
          loading={loading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Inventory Stock Bar Chart */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-card lg:col-span-7">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-semibold text-foreground">
                Warehouse stock distribution
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Available units per SKU (amber highlights below {LOW_STOCK_THRESHOLD} units)
              </p>
            </div>
            <Link
              to="/inventory"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View inventory
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-5 h-60 w-full">
            {loading ? (
              <Skeleton className="h-full w-full rounded-lg" />
            ) : stockChartData.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-sm text-muted-foreground">
                <Boxes className="mb-2 h-7 w-7 opacity-50" />
                No inventory items available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockChartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis
                    dataKey="sku"
                    tick={{ fill: axisColor, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: axisColor, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RechartsTooltip
                    cursor={{ fill: theme === 'dark' ? 'rgba(148,163,184,0.08)' : 'rgba(15,23,42,0.04)' }}
                    contentStyle={tooltipStyle}
                    formatter={(value: number) => [`${value.toLocaleString('en-GB')} units`, 'Available']}
                  />
                  <Bar dataKey="stock" radius={[6, 6, 0, 0]} maxBarSize={44}>
                    {stockChartData.map((entry) => (
                      <Cell
                        key={entry.sku}
                        fill={entry.isLow ? '#f59e0b' : theme === 'dark' ? '#3b82f6' : '#2563eb'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* Shipment Status Breakdown */}
        <section className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-card lg:col-span-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-semibold text-foreground">
                Fulfillment status
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Live breakdown across all persisted waybills
              </p>
            </div>
            <Link
              to="/waybills"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              All waybills
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 grid flex-1 grid-cols-1 items-center gap-4 sm:grid-cols-2">
            <div className="relative h-48 w-full">
              {loading ? (
                <Skeleton className="mx-auto h-40 w-40 rounded-full" />
              ) : shipments.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-xs text-muted-foreground">
                  <Package className="mb-1.5 h-6 w-6 opacity-50" />
                  No shipments yet
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={52}
                        outerRadius={74}
                        paddingAngle={3}
                        strokeWidth={0}
                      >
                        {statusChartData.map((entry) => (
                          <Cell key={entry.key} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display text-2xl font-bold tabular-nums text-foreground">
                      {shipments.length}
                    </span>
                    <span className="text-[11px] text-muted-foreground">Shipments</span>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2.5">
              {statusChartData.map((entry) => {
                const pct =
                  shipments.length > 0 ? Math.round((entry.value / shipments.length) * 100) : 0
                return (
                  <div
                    key={entry.key}
                    className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-xs font-medium text-foreground">{entry.name}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono-num text-xs">
                      <span className="font-semibold text-foreground">{entry.value}</span>
                      <span className="text-muted-foreground">({pct}%)</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Activity Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Recent Shipments */}
        <section className="rounded-xl border border-border bg-card shadow-card lg:col-span-7">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="font-display text-base font-semibold text-foreground">
                Recent shipments
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Latest created or updated waybills
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
              <Link to="/waybills">
                Manage all
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <div className="divide-y divide-border">
            {loading &&
              Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              ))}

            {!loading && recentShipments.length === 0 && (
              <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
                <FileText className="h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm font-medium text-foreground">No shipments recorded</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Create your first waybill to begin tracking fulfillment.
                </p>
                <Button
                  size="sm"
                  className="mt-4"
                  onClick={() => openCreateWithSku(undefined)}
                  disabled={inventory.length === 0}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  New waybill
                </Button>
              </div>
            )}

            {!loading &&
              recentShipments.map((shipment) => (
                <div
                  key={shipment.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-muted/35"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-num text-xs font-semibold text-primary">
                        {shipment.tracking_number}
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="truncate text-sm font-medium text-foreground">
                        {shipment.receiver_name}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="truncate">
                        {shipment.items.map((item) => `${item.item_name} ×${item.quantity}`).join(', ')}
                      </span>
                      <span>·</span>
                      <span className="font-mono-num text-[11px]">
                        {formatDateTime(shipment.updated_at)}
                      </span>
                    </div>
                  </div>
                  <ShipmentStatusBadge status={shipment.status} />
                </div>
              ))}
          </div>
        </section>

        {/* Inventory Watchlist */}
        <section className="rounded-xl border border-border bg-card shadow-card lg:col-span-5">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="font-display text-base font-semibold text-foreground">
                Inventory watchlist
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Lowest stock SKUs ready for quick dispatch
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
              <Link to="/inventory">
                Full catalogue
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <div className="divide-y divide-border">
            {loading &&
              Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-7 w-20 rounded-md" />
                </div>
              ))}

            {!loading && watchlistItems.length === 0 && (
              <div className="flex flex-col items-center justify-center px-5 py-12 text-center text-sm text-muted-foreground">
                <Boxes className="mb-2 h-8 w-8 opacity-50" />
                No inventory items loaded
              </div>
            )}

            {!loading &&
              watchlistItems.map((item) => {
                const health = getStockHealth(item.stock_quantity)
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-muted/35"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-foreground">
                        {item.item_name}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] font-medium text-muted-foreground">
                          {item.sku ?? '—'}
                        </span>
                        <StockHealthBadge health={health} />
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <div className="text-right">
                        <div className="font-mono-num text-sm font-semibold text-foreground">
                          {item.stock_quantity.toLocaleString('en-GB')}
                        </div>
                        <div className="text-[11px] text-muted-foreground">units</div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!item.sku || item.stock_quantity <= 0}
                        onClick={() => openCreateWithSku(item.sku ?? undefined)}
                        className="h-8 px-2.5 text-xs"
                      >
                        <Send className="mr-1 h-3 w-3" />
                        Dispatch
                      </Button>
                    </div>
                  </div>
                )
              })}
          </div>
        </section>
      </div>

      <CreateWaybillDialog
        open={createOpen}
        inventory={inventory}
        defaultSku={preselectedSku}
        onOpenChange={(next) => {
          setCreateOpen(next)
          if (!next) setPreselectedSku(undefined)
        }}
        onCreated={load}
      />
    </div>
  )
}
