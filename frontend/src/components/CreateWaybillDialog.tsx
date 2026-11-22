import { useCallback, useRef, useState } from 'react'
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, PackageCheck } from 'lucide-react'
import { toast } from 'sonner'
import { shipmentApi } from '@/api'
import { ApiError } from '@/lib/request'
import { formatCurrency } from '@/lib/order-meta'
import { useAuthStore } from '@/stores/auth'
import type { InventoryItem } from '@/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface CreateWaybillDialogProps {
  open: boolean
  inventory: InventoryItem[]
  defaultSku?: string
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export function CreateWaybillDialog({
  open,
  inventory,
  defaultSku,
  onOpenChange,
  onCreated,
}: CreateWaybillDialogProps) {
  const user = useAuthStore((state) => state.user)
  const [selectedSku, setSelectedSku] = useState<string | null>(null)
  const [quantity, setQuantity] = useState('1')
  const [receiverName, setReceiverName] = useState('')
  const [receiverPhone, setReceiverPhone] = useState('')
  const [address, setAddress] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const draftId = useRef(0)

  const sku = selectedSku ?? (defaultSku ?? '')
  const selectableItems = inventory.filter((entry) => entry.sku !== null)
  const item = inventory.find((entry) => entry.sku === sku)
  const qty = Number(quantity)
  const validQty = Number.isSafeInteger(qty) && qty > 0
  const insufficient = Boolean(item) && validQty && qty > (item?.stock_quantity ?? 0)
  const remainingStock = item && validQty ? item.stock_quantity - qty : item?.stock_quantity ?? 0
  const estimatedValue = item && validQty ? item.unit_price * qty : 0

  const resetForm = useCallback(() => {
    setSelectedSku(null)
    setQuantity('1')
    setReceiverName('')
    setReceiverPhone('')
    setAddress('')
    setFormError(null)
  }, [])

  // The dialog stays mounted between openings. Every close path (Cancel,
  // Escape, overlay click and the close icon) calls onOpenChange, so clear the
  // draft there instead of showing a cancelled form on the next waybill.
  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        draftId.current++
        resetForm()
      }
      onOpenChange(next)
    },
    [onOpenChange, resetForm],
  )

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setFormError(null)

    if (!user || !item) {
      setFormError('Please select a SKU from inventory.')
      return
    }
    if (!validQty) {
      setFormError('Quantity must be a positive whole number.')
      return
    }
    if (insufficient) {
      setFormError(`Requested quantity (${qty}) exceeds available stock (${item.stock_quantity}).`)
      return
    }
    if (!receiverName.trim() || !receiverPhone.trim() || !address.trim()) {
      setFormError('Enter receiver name, phone number, and delivery address.')
      return
    }

    const submittedDraft = draftId.current
    setLoading(true)
    try {
      const shipment = await shipmentApi.create({
        sender_id: user.id,
        sku,
        quantity: qty,
        receiver_name: receiverName.trim(),
        receiver_phone: receiverPhone.trim(),
        delivery_address: address.trim(),
      })
      toast.success(`Waybill ${shipment.tracking_number} created · ${qty} units deducted`)
      // A user can dismiss this request and start another draft while it is pending.
      if (submittedDraft === draftId.current) handleOpenChange(false)
      onCreated()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Unable to create waybill'
      setFormError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-5 sm:max-w-[560px]">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <PackageCheck className="h-4.5 w-4.5" />
            </span>
            <div>
              <DialogTitle className="font-display text-lg font-semibold">
                Create new waybill
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs">
                Inventory stock is atomically deducted upon creation · Sender:{' '}
                <span className="font-medium text-foreground">{user?.username ?? '—'}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="waybill-sku" className="text-xs font-medium text-foreground">
                Inventory SKU <span className="text-destructive">*</span>
              </Label>
              <Select
                value={sku}
                onValueChange={(value) => {
                  setSelectedSku(value)
                  setFormError(null)
                }}
              >
                <SelectTrigger id="waybill-sku" className="h-10 w-full bg-background">
                  <SelectValue placeholder="Choose an item by SKU" />
                </SelectTrigger>
                <SelectContent>
                  {selectableItems.map((entry) => (
                    <SelectItem
                      key={entry.id}
                      value={entry.sku!}
                      disabled={entry.stock_quantity <= 0}
                    >
                      <span className="font-mono text-xs font-medium text-primary">
                        {entry.sku}
                      </span>
                      <span className="mx-1.5 text-muted-foreground">·</span>
                      <span>{entry.item_name}</span>
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        ({entry.stock_quantity} left)
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="waybill-quantity" className="text-xs font-medium text-foreground">
                Quantity <span className="text-destructive">*</span>
              </Label>
              <Input
                id="waybill-quantity"
                type="number"
                min={1}
                step={1}
                required
                value={quantity}
                onChange={(event) => {
                  setQuantity(event.target.value)
                  setFormError(null)
                }}
                placeholder="1"
                className="h-10 bg-background font-mono-num"
              />
            </div>
          </div>

          {item && (
            <div
              className={cn(
                'rounded-lg border px-3.5 py-3 text-xs transition-colors',
                insufficient
                  ? 'border-rose-200 bg-rose-50/80 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200'
                  : 'border-border bg-muted/40 text-foreground',
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {insufficient ? (
                    <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  )}
                  <span className="font-medium">{item.item_name}</span>
                </div>
                <span className="font-mono-num text-muted-foreground">
                  {formatCurrency(item.unit_price)} / unit
                </span>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2">
                <div className="flex items-center gap-1.5 font-mono-num">
                  <span className="text-muted-foreground">Stock:</span>
                  <span className="font-semibold">{item.stock_quantity.toLocaleString('en-GB')}</span>
                  {validQty && (
                    <>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span
                        className={cn(
                          'font-semibold',
                          insufficient
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400',
                        )}
                      >
                        {remainingStock.toLocaleString('en-GB')}
                      </span>
                    </>
                  )}
                </div>
                {validQty && !insufficient && (
                  <div className="font-mono-num">
                    <span className="text-muted-foreground">Est. value: </span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(estimatedValue)}
                    </span>
                  </div>
                )}
                {insufficient && (
                  <span className="font-medium text-rose-600 dark:text-rose-400">
                    Exceeds available stock by {(qty - item.stock_quantity).toLocaleString('en-GB')}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="waybill-receiver" className="text-xs font-medium text-foreground">
                Receiver name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="waybill-receiver"
                required
                value={receiverName}
                onChange={(event) => setReceiverName(event.target.value)}
                placeholder="e.g. David Cheung"
                className="h-10 bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="waybill-phone" className="text-xs font-medium text-foreground">
                Receiver phone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="waybill-phone"
                type="tel"
                required
                value={receiverPhone}
                onChange={(event) => setReceiverPhone(event.target.value)}
                placeholder="+852-91112222"
                className="h-10 bg-background font-mono-num"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="waybill-address" className="text-xs font-medium text-foreground">
              Delivery address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="waybill-address"
              required
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Flat B, 12/F, Nathan Tower, Mong Kok, Kowloon"
              className="h-10 bg-background"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || insufficient || !user}>
              {loading && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {loading ? 'Creating waybill…' : 'Create waybill'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
