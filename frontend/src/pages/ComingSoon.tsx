import { Link, useLocation } from 'react-router'
import {
  ArrowLeft,
  Compass,
  Route as RouteIcon,
  Settings,
  Sparkles,
  Truck,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PlannedModule {
  name: string
  icon: LucideIcon
  summary: string
  capabilities: string[]
}

const MODULES: Record<string, PlannedModule> = {
  '/tracking': {
    name: 'Live Tracking Timeline',
    icon: RouteIcon,
    summary: 'Real-time hub checkpoints, carrier scan events, and customer ETA tracking.',
    capabilities: ['Multi-hub scan timeline', 'Public tracking lookup', 'Exception & delay alerts'],
  },
  '/fleet': {
    name: 'Fleet & Dispatch Board',
    icon: Truck,
    summary: 'Vehicle scheduling, courier assignment, and route load balancing across hubs.',
    capabilities: ['Driver & van assignment', 'Batch waybill dispatch', 'Route capacity overview'],
  },
  '/customers': {
    name: 'Customer Directory',
    icon: Users,
    summary: 'Saved sender/receiver profiles, Hong Kong address book, and order history.',
    capabilities: ['Saved HK address book', 'Account shipment history', 'Contact verification'],
  },
  '/settings': {
    name: 'Workspace Settings',
    icon: Settings,
    summary: 'Role-based access control, warehouse hub configuration, and status workflow rules.',
    capabilities: ['User & role management', 'Hub directory configuration', 'Notification preferences'],
  },
}

export default function ComingSoon() {
  const { pathname } = useLocation()
  const moduleInfo = MODULES[pathname] ?? {
    name: 'Planned Module',
    icon: Compass,
    summary: 'This capability is scheduled for an upcoming iteration of the operations console.',
    capabilities: ['Schema & API alignment', 'Interactive workflow integration'],
  }
  const Icon = moduleInfo.icon

  return (
    <div className="flex min-h-[65vh] items-center justify-center py-8">
      <div className="flex w-full max-w-lg flex-col items-center rounded-2xl border border-border bg-card p-8 text-center shadow-card">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </div>

        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Planned roadmap module
        </div>

        <h1 className="font-display mt-3 text-2xl font-bold tracking-tight text-foreground">
          {moduleInfo.name}
        </h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          {moduleInfo.summary}
        </p>

        <div className="mt-6 w-full rounded-xl border border-border/80 bg-muted/30 p-4 text-left">
          <div className="eyebrow">Planned capabilities</div>
          <ul className="mt-2.5 space-y-2 text-xs text-foreground/90">
            {moduleInfo.capabilities.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <Button asChild size="sm">
            <Link to="/dashboard">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Back to Overview
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/waybills">Open Waybills</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
