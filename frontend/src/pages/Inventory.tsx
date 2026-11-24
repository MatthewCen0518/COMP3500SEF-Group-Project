import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowUpDown,
  Boxes,
  DollarSign,
  Layers,
  Plus,
  RefreshCw,
  Search,
  Send,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { inventoryApi } from '@/api'
import { ApiError } from '@/lib/request'
import {
  LOW_STOCK_THRESHOLD,
  STOCK_HEALTH_META,
  formatCurrency,
  getStockHealth,
} from '@/lib/order-meta'
import type { InventoryItem } from '@/types'
import { cn } from '@/lib/utils'
import { CreateWaybillDialog } from '@/components/CreateWaybillDialog'
import { KpiCard } from '@/components/KpiCard'
import { StockHealthBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type StockFilter = 'all' | 'low'
type SortOption = 'default' | 'stock-asc' | 'stock-desc' | 'value-desc'

export default function Inventory() {
  const [keyword, setKeyword] = useState('')
  const [stockFilter, setStockFilter] = useState<StockFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('default')
  const [list, setList] = useState<InventoryItem[]>([])
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
      const data = await inventoryApi.list()
      if (currentRequest === requestId.current) setList(data)
    } catch (cause) {
      if (currentRequest === requestId.current) {
        const message = cause instanceof ApiError ? cause.message : 'Unable to load inventory'
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

  const totalUnitsAll = list.reduce((sum, item) => sum + item.stock_quantity, 0)
  const totalValuationAll = list.reduce(
    (sum, item) => sum + item.stock_quantity * item.unit_price,
    0,
  )
  const lowStockCount = list.filter((item) => item.stock_quantity < LOW_STOCK_THRESHOLD).length
  const maxStock = Math.max(1, ...list.map((item) => item.stock_quantity))

  const search = keyword.trim().toLowerCase()
  const filtered = list
    .filter((item) => {
      const matchesFilter = stockFilter === 'all' || item.stock_quantity < LOW_STOCK_THRESHOLD
      const matchesSearch = [item.sku ?? '', item.item_name].some((text) =>
        text.toLowerCase().includes(search),
      )
      return matchesFilter && matchesSearch
    })
    .sort((a, b) => {
      if (sortBy === 'stock-asc') return a.stock_quantity - b.stock_quantity
      if (sortBy === 'stock-desc') return b.stock_quantity - a.stock_quantity
      if (sortBy === 'value-desc') {
        return b.stock_quantity * b.unit_price - a.stock_quantity * a.unit_price
      }
      return a.id - b.id
    })

  const hasActiveFilters = stockFilter !== 'all' || keyword.trim().length > 0

  function openDispatch(sku?: string) {
    setPreselectedSku(sku)
    setCreateOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-[28px]">
            Inventory
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor warehouse SKU stock levels, asset valuation, and dispatch directly to waybills.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" onClick={load} disabled={loading} className="h-9">
            <RefreshCw className={cn('mr-1.5 h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Button
            onClick={() => openDispatch(undefined)}
            disabled={loading || (error !== null && list.length === 0)}
            className="h-9"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New waybill
          </Button>
        </div>
      </div>

      {/* 4-column KPI Cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard
          label="Total SKUs"
          value={error ? '—' : list.length.toLocaleString('en-GB')}
          subtitle="Active catalogue entries"
          icon={Boxes}
          tone="blue"
          loading={loading}
          active={stockFilter === 'all'}
          onClick={() => setStockFilter('all')}
        />
        <KpiCard
          label="Available units"
          value={error ? '—' : totalUnitsAll.toLocaleString('en-GB')}
          subtitle="Ready for outbound dispatch"
          icon={Layers}
          tone="emerald"
          loading={loading}
        />
        <KpiCard
          label="Total valuation"
          value={error ? '—' : formatCurrency(totalValuationAll)}
          subtitle="Stock qty × unit price"
          icon={DollarSign}
          tone="neutral"
          loading={loading}
        />
        <KpiCard
          label="Low stock alerts"
          value={error ? '—' : lowStockCount.toLocaleString('en-GB')}
          subtitle={`Items below ${LOW_STOCK_THRESHOLD} units`}
          icon={AlertTriangle}
          tone={lowStockCount > 0 ? 'amber' : 'emerald'}
          loading={loading}
          active={stockFilter === 'low'}
          onClick={() => setStockFilter((current) => (current === 'low' ? 'all' : 'low'))}
        />
      </div>

      {/* Inventory Table Card */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        {/* Filter & Sort Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/25 px-4 py-3.5">
          <div
            role="tablist"
            aria-label="Filter inventory health"
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background p-1"
          >
            {(
              [
                ['all', 'All items', list.length],
                ['low', 'Low stock', lowStockCount],
              ] as const
            ).map(([value, label, count]) => {
              const active = stockFilter === value
              return (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setStockFilter(value)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all',
                    active
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                  )}
                >
                  <span>{label}</span>
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.2 font-mono-num text-[10px]',
                      active ? 'bg-white/20 text-primary-foreground' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {error ? '—' : count}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search inventory"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Search SKU or item name…"
                className="h-9 bg-background pl-9 pr-8 text-sm"
              />
              {keyword && (
                <button
                  type="button"
                  onClick={() => setKeyword('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger aria-label="Sort inventory" className="h-9 w-44 bg-background text-xs">
                <div className="flex items-center gap-1.5">
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default order</SelectItem>
                <SelectItem value="stock-asc">Stock: Low to High</SelectItem>
                <SelectItem value="stock-desc">Stock: High to Low</SelectItem>
                <SelectItem value="value-desc">Total value: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/35 hover:bg-muted/35">
              <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                SKU
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                Item name
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                Stock level
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                Unit price
              </TableHead>
              <TableHead className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                Total value
              </TableHead>
              <TableHead className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading &&
              Array.from({ length: 4 }, (_, row) => (
                <TableRow key={row}>
                  {Array.from({ length: 7 }, (_, cell) => (
                    <TableCell key={cell} className="px-4 py-4">
                      <Skeleton className="h-4 w-full max-w-28" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading && error && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="h-48 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                      <Boxes className="h-5 w-5" />
                    </span>
                    <div className="mt-3 font-medium text-foreground">Could not load inventory</div>
                    <div className="mt-1 text-xs text-muted-foreground">{error}</div>
                    <Button variant="outline" size="sm" className="mt-4" onClick={load}>
                      Retry
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!loading && !error && filtered.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="h-48 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Boxes className="h-5 w-5" />
                    </span>
                    <div className="mt-3 font-medium text-foreground">
                      No matching inventory records
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {hasActiveFilters
                        ? 'Try clearing your search or switching back to all items.'
                        : 'Warehouse stock entries will appear here once loaded.'}
                    </div>
                    {hasActiveFilters && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => {
                          setKeyword('')
                          setStockFilter('all')
                        }}
                      >
                        Reset filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              !error &&
              filtered.map((item) => {
                const health = getStockHealth(item.stock_quantity)
                const healthMeta = STOCK_HEALTH_META[health]
                const fillPct = Math.min(100, Math.round((item.stock_quantity / maxStock) * 100))
                const rowTotal = item.stock_quantity * item.unit_price
                return (
                  <TableRow key={item.id} className="transition-colors hover:bg-muted/35">
                    <TableCell className="px-4 py-3.5">
                      <span className="rounded-md border border-border bg-muted/60 px-2 py-0.5 font-mono text-xs font-semibold text-foreground">
                        {item.sku ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-[13.5px] font-medium text-foreground">
                      {item.item_name}
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="w-12 font-mono-num text-[13.5px] font-semibold text-foreground">
                          {item.stock_quantity.toLocaleString('en-GB')}
                        </span>
                        <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-muted sm:block">
                          <div
                            className={cn('h-full rounded-full transition-all', healthMeta.bar)}
                            style={{ width: `${Math.max(item.stock_quantity > 0 ? 6 : 0, fillPct)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      <StockHealthBadge health={health} />
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-right font-mono-num text-[13px] text-muted-foreground">
                      {formatCurrency(item.unit_price)}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-right font-mono-num text-[13.5px] font-semibold text-foreground">
                      {formatCurrency(rowTotal)}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!item.sku || item.stock_quantity <= 0}
                        onClick={() => openDispatch(item.sku ?? undefined)}
                        className="h-8 px-2.5 text-xs"
                      >
                        <Send className="mr-1 h-3 w-3" />
                        Dispatch
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
          </TableBody>
        </Table>

        {!error && !loading && (
          <div className="flex items-center justify-between border-t border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
            <span>
              Showing <span className="font-mono-num font-medium text-foreground">{filtered.length}</span>{' '}
              of <span className="font-mono-num font-medium text-foreground">{list.length}</span> SKUs
            </span>
            <span className="font-mono-num">
              Filtered stock:{' '}
              <strong className="font-semibold text-foreground">
                {filtered.reduce((sum, entry) => sum + entry.stock_quantity, 0).toLocaleString('en-GB')}
              </strong>{' '}
              units
            </span>
          </div>
        )}
      </div>

      <CreateWaybillDialog
        open={createOpen}
        inventory={list}
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
