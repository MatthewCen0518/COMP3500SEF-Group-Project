import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  FileText,
  Loader2,
  MapPin,
  Package,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Truck,
  User,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { inventoryApi, shipmentApi } from '@/api'
import { ApiError } from '@/lib/request'
import { SHIPMENT_STATUS_META, formatDateTime } from '@/lib/order-meta'
import type { InventoryItem, Shipment, ShipmentStatus } from '@/types'
import { cn } from '@/lib/utils'
import { CreateWaybillDialog } from '@/components/CreateWaybillDialog'
import { KpiCard } from '@/components/KpiCard'
import { ShipmentStatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const PAGE_SIZE = 10

interface WaybillsProps {
  title?: string
  description?: string
}

export default function Waybills({
  title = 'Waybills',
  description = 'Track waybill numbers, delivery routes, and fulfillment status transitions.',
}: WaybillsProps) {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [copiedTracking, setCopiedTracking] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<ShipmentStatus | 'all'>('all')
  const [page, setPage] = useState(1)
  const requestId = useRef(0)

  const load = useCallback(async () => {
    const currentRequest = ++requestId.current
    setLoading(true)
    setError(null)
    try {
      const [rows, items] = await Promise.all([shipmentApi.list(), inventoryApi.list()])
      if (currentRequest !== requestId.current) return
      setShipments(rows)
      setInventory(items)
    } catch (cause) {
      if (currentRequest === requestId.current) {
        const message = cause instanceof ApiError ? cause.message : 'Unable to load data'
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

  async function handleStatusChange(id: number, next: ShipmentStatus) {
    setUpdatingId(id)
    try {
      await shipmentApi.updateStatus(id, next)
      toast.success(`Status updated to ${SHIPMENT_STATUS_META[next].label}`)
      await load()
    } catch (cause) {
      toast.error(cause instanceof ApiError ? cause.message : 'Unable to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleCopyTracking(trackingNumber: string) {
    try {
      await navigator.clipboard.writeText(trackingNumber)
      setCopiedTracking(trackingNumber)
      toast.success(`Copied ${trackingNumber}`)
      setTimeout(() => {
        setCopiedTracking((current) => (current === trackingNumber ? null : current))
      }, 1800)
    } catch {
      toast.error('Clipboard access unavailable')
    }
  }

  const pendingCount = shipments.filter((row) => row.status === 'pending').length
  const shippedCount = shipments.filter((row) => row.status === 'shipped').length
  const deliveredCount = shipments.filter((row) => row.status === 'delivered').length

  const search = keyword.trim().toLowerCase()
  const filtered = shipments
    .filter(
      (shipment) =>
        (status === 'all' || shipment.status === status) &&
        [
          shipment.tracking_number,
          shipment.sender ?? '',
          shipment.receiver_name,
          shipment.receiver_phone,
          shipment.delivery_address,
          ...shipment.items.flatMap((item) => [item.sku ?? '', item.item_name]),
        ].some((text) => text.toLowerCase().includes(search)),
    )
    .sort((left, right) => right.id - left.id)

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  // Keep the fallback page selected if a later refresh adds matching rows again.
  if (page !== currentPage) setPage(currentPage)
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const selectedShipment = shipments.find((item) => item.id === selectedId) ?? null
  const hasActiveFilters = status !== 'all' || keyword.trim().length > 0

  const startRow = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const endRow = Math.min(currentPage * PAGE_SIZE, filtered.length)

  const filterTabs: Array<{ value: ShipmentStatus | 'all'; label: string; count: number }> = [
    { value: 'all', label: 'All', count: shipments.length },
    { value: 'pending', label: 'Pending', count: pendingCount },
    { value: 'shipped', label: 'In transit', count: shippedCount },
    { value: 'delivered', label: 'Delivered', count: deliveredCount },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-[28px]">
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" onClick={load} disabled={loading} className="h-9">
            <RefreshCw className={cn('mr-1.5 h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Button
            onClick={() => setCreateOpen(true)}
            disabled={loading || (error !== null && inventory.length === 0)}
            className="h-9"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New waybill
          </Button>
        </div>
      </div>

      {/* Interactive KPI Cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard
          label="Total shipments"
          value={error ? '—' : shipments.length.toLocaleString('en-GB')}
          subtitle="All persisted records"
          icon={FileText}
          tone="neutral"
          loading={loading}
          active={status === 'all'}
          onClick={() => {
            setStatus('all')
            setPage(1)
          }}
        />
        <KpiCard
          label="Pending pickup"
          value={error ? '—' : pendingCount.toLocaleString('en-GB')}
          subtitle="Awaiting carrier dispatch"
          icon={Clock}
          tone="amber"
          loading={loading}
          active={status === 'pending'}
          onClick={() => {
            setStatus((current) => (current === 'pending' ? 'all' : 'pending'))
            setPage(1)
          }}
        />
        <KpiCard
          label="In transit"
          value={error ? '—' : shippedCount.toLocaleString('en-GB')}
          subtitle="Active delivery routes"
          icon={Truck}
          tone="blue"
          loading={loading}
          active={status === 'shipped'}
          onClick={() => {
            setStatus((current) => (current === 'shipped' ? 'all' : 'shipped'))
            setPage(1)
          }}
        />
        <KpiCard
          label="Delivered"
          value={error ? '—' : deliveredCount.toLocaleString('en-GB')}
          subtitle="Completed fulfillment"
          icon={CheckCircle2}
          tone="emerald"
          loading={loading}
          active={status === 'delivered'}
          onClick={() => {
            setStatus((current) => (current === 'delivered' ? 'all' : 'delivered'))
            setPage(1)
          }}
        />
      </div>

      {/* Table Card */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/25 px-4 py-3.5">
          <div
            role="tablist"
            aria-label="Filter shipments by status"
            className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-border bg-background p-1"
          >
            {filterTabs.map((tab) => {
              const active = status === tab.value
              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setStatus(tab.value)
                    setPage(1)
                  }}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all',
                    active
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.2 font-mono-num text-[10px]',
                      active ? 'bg-white/20 text-primary-foreground' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {error ? '—' : tab.count}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex flex-1 items-center justify-end gap-2 sm:flex-initial">
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search shipments"
                value={keyword}
                onChange={(event) => {
                  setKeyword(event.target.value)
                  setPage(1)
                }}
                placeholder="Search tracking no., receiver, SKU…"
                className="h-9 bg-background pl-9 pr-8 text-sm"
              />
              {keyword && (
                <button
                  type="button"
                  onClick={() => {
                    setKeyword('')
                    setPage(1)
                  }}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatus('all')
                  setKeyword('')
                  setPage(1)
                }}
                className="h-9 shrink-0 text-xs text-muted-foreground hover:text-foreground"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/35 hover:bg-muted/35">
              <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                Tracking no.
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                Cargo &amp; SKU
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                Sender → Receiver
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                Delivery address
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                Activity
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                Details
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
                      <FileText className="h-5 w-5" />
                    </span>
                    <div className="mt-3 font-medium text-foreground">Could not load shipments</div>
                    <div className="mt-1 text-xs text-muted-foreground">{error}</div>
                    <Button variant="outline" size="sm" className="mt-4" onClick={load}>
                      Retry
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!loading && !error && rows.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="h-48 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <FileText className="h-5 w-5" />
                    </span>
                    <div className="mt-3 font-medium text-foreground">No matching shipments</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {hasActiveFilters
                        ? 'Try clearing your search or switching the status filter.'
                        : 'Create your first waybill to see records here.'}
                    </div>
                    {hasActiveFilters ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => {
                          setStatus('all')
                          setKeyword('')
                          setPage(1)
                        }}
                      >
                        Clear filters
                      </Button>
                    ) : (
                      <Button size="sm" className="mt-4" onClick={() => setCreateOpen(true)}>
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        New waybill
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              !error &&
              rows.map((shipment) => {
                const statusMeta = SHIPMENT_STATUS_META[shipment.status]
                const isUpdating = updatingId === shipment.id
                const isCopied = copiedTracking === shipment.tracking_number
                return (
                  <TableRow
                    key={shipment.id}
                    className="group transition-colors hover:bg-muted/35"
                  >
                    <TableCell className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedId(shipment.id)}
                          className="font-mono-num text-[13px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {shipment.tracking_number}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyTracking(shipment.tracking_number)}
                          aria-label={`Copy ${shipment.tracking_number}`}
                          className="rounded p-1 text-muted-foreground/70 opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100"
                        >
                          {isCopied ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-3.5">
                      <div className="space-y-1.5">
                        {shipment.items.map((item, index) => (
                          <div key={index} className="leading-snug">
                            <div className="text-[13.5px] font-medium text-foreground">
                              {item.item_name}
                            </div>
                            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <span className="rounded bg-muted px-1.5 py-0.2 font-mono text-[11px] text-foreground/80">
                                {item.sku ?? '—'}
                              </span>
                              <span className="font-mono-num text-[11px] font-medium text-muted-foreground">
                                × {item.quantity}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 text-[13.5px]">
                        <span className="text-muted-foreground">{shipment.sender ?? '—'}</span>
                        <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                        <span className="font-medium text-foreground">
                          {shipment.receiver_name}
                        </span>
                      </div>
                      <div className="mt-0.5 font-mono-num text-xs text-muted-foreground">
                        {shipment.receiver_phone}
                      </div>
                    </TableCell>

                    <TableCell className="max-w-60 px-4 py-3.5 whitespace-normal text-[13px] leading-snug text-foreground/90">
                      {shipment.delivery_address}
                    </TableCell>

                    <TableCell className="px-4 py-3.5">
                      <div className="space-y-0.5 text-xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <span className="w-12 text-[11px] text-muted-foreground/80">Created</span>
                          <span className="font-mono-num text-foreground/85">
                            {formatDateTime(shipment.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <span className="w-12 text-[11px] text-muted-foreground/80">Updated</span>
                          <span className="font-mono-num text-muted-foreground">
                            {formatDateTime(shipment.updated_at)}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-3.5">
                      <Select
                        value={shipment.status}
                        disabled={isUpdating}
                        onValueChange={(value) =>
                          handleStatusChange(shipment.id, value as ShipmentStatus)
                        }
                      >
                        <SelectTrigger
                          aria-label={`Status for ${shipment.tracking_number}`}
                          className={cn(
                            'h-8 w-[148px] rounded-full border px-3 text-xs font-medium shadow-none',
                            statusMeta.badge,
                          )}
                        >
                          <div className="flex items-center gap-1.5">
                            {isUpdating ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <span className={cn('h-1.5 w-1.5 rounded-full', statusMeta.dot)} />
                            )}
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(SHIPMENT_STATUS_META).map(([value, meta]) => (
                            <SelectItem key={value} value={value}>
                              <span className="flex items-center gap-2">
                                <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
                                {meta.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell className="px-4 py-3.5 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedId(shipment.id)}
                        className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        {!error && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/20 px-4 py-3">
            <span className="text-xs text-muted-foreground">
              Showing <span className="font-mono-num font-medium text-foreground">{startRow}–{endRow}</span>{' '}
              of <span className="font-mono-num font-medium text-foreground">{filtered.length}</span>{' '}
              shipments · Page <span className="font-mono-num font-medium text-foreground">{currentPage}</span> of{' '}
              <span className="font-mono-num font-medium text-foreground">{totalPages}</span>
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1 || loading}
                onClick={() => setPage(currentPage - 1)}
                className="h-8 text-xs"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages || loading}
                onClick={() => setPage(currentPage + 1)}
                className="h-8 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Waybill Modal */}
      <CreateWaybillDialog
        open={createOpen}
        inventory={inventory}
        onOpenChange={setCreateOpen}
        onCreated={load}
      />

      {/* Waybill Detail Side Drawer */}
      <Sheet open={selectedShipment !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          {selectedShipment && (
            <>
              <SheetHeader className="border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <ShipmentStatusBadge status={selectedShipment.status} />
                  <span className="font-mono-num text-xs text-muted-foreground">
                    ID #{selectedShipment.id}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <SheetTitle className="font-mono-num text-xl font-bold tracking-tight text-foreground">
                    {selectedShipment.tracking_number}
                  </SheetTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleCopyTracking(selectedShipment.tracking_number)}
                    aria-label="Copy tracking number"
                    className="h-7 w-7 text-muted-foreground"
                  >
                    {copiedTracking === selectedShipment.tracking_number ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
                <SheetDescription className="text-xs">
                  Persisted shipment details and fulfillment controls
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-5 px-4 pb-6">
                {/* Status Update Card */}
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <div className="text-xs font-semibold text-foreground">Update fulfillment status</div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Changes are persisted immediately and appended to tracking events.
                  </p>
                  <div className="mt-3">
                    <Select
                      value={selectedShipment.status}
                      disabled={updatingId === selectedShipment.id}
                      onValueChange={(value) =>
                        handleStatusChange(selectedShipment.id, value as ShipmentStatus)
                      }
                    >
                      <SelectTrigger className="h-9 w-full bg-card text-xs font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(SHIPMENT_STATUS_META).map(([value, meta]) => (
                          <SelectItem key={value} value={value}>
                            <span className="flex items-center gap-2">
                              <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
                              {meta.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Route & Recipient */}
                <div className="space-y-3 rounded-xl border border-border bg-card p-4">
                  <div className="text-xs font-semibold text-foreground">Recipient &amp; Route</div>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-start gap-2.5">
                      <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <div className="text-muted-foreground">Sender → Receiver</div>
                        <div className="mt-0.5 font-medium text-foreground">
                          {selectedShipment.sender ?? '—'} → {selectedShipment.receiver_name}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <div className="text-muted-foreground">Contact phone</div>
                        <div className="mt-0.5 font-mono-num font-medium text-foreground">
                          {selectedShipment.receiver_phone}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <div className="text-muted-foreground">Delivery address</div>
                        <div className="mt-0.5 leading-relaxed font-medium text-foreground">
                          {selectedShipment.delivery_address}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cargo Manifest */}
                <div className="space-y-3 rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-foreground">Cargo manifest</div>
                    <span className="font-mono-num text-xs text-muted-foreground">
                      {selectedShipment.items.reduce((sum, entry) => sum + entry.quantity, 0)} total
                      units
                    </span>
                  </div>
                  <div className="divide-y divide-border rounded-lg border border-border/80">
                    {selectedShipment.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-3 px-3 py-2.5">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                            <Package className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate">{item.item_name}</span>
                          </div>
                          <div className="mt-0.5 pl-5 font-mono text-[11px] text-muted-foreground">
                            {item.sku ?? '—'}
                          </div>
                        </div>
                        <span className="rounded-md bg-muted px-2 py-0.5 font-mono-num text-xs font-semibold text-foreground">
                          × {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timestamps */}
                <div className="space-y-2 rounded-xl border border-border bg-card p-4 text-xs">
                  <div className="text-xs font-semibold text-foreground">Timeline metadata</div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-muted-foreground">Created at</span>
                    <span className="font-mono-num text-foreground">
                      {formatDateTime(selectedShipment.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Last updated</span>
                    <span className="font-mono-num text-foreground">
                      {formatDateTime(selectedShipment.updated_at)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
