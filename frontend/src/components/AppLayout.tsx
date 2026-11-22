import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import {
  Boxes,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PackageSearch,
  Route as RouteIcon,
  Settings,
  Sun,
  Truck,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { cn } from '@/lib/utils'
import { BrandMark } from '@/components/BrandMark'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const CORE_NAV = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/orders', label: 'Orders', icon: PackageSearch },
  { to: '/waybills', label: 'Waybills', icon: FileText },
  { to: '/inventory', label: 'Inventory', icon: Boxes },
]

const PLANNED_NAV = [
  { to: '/tracking', label: 'Tracking', icon: RouteIcon },
  { to: '/fleet', label: 'Fleet', icon: Truck },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
]

const ROUTE_TITLES: Record<string, { section: string; title: string }> = {
  '/dashboard': { section: 'Operations', title: 'Overview' },
  '/orders': { section: 'Operations', title: 'Orders' },
  '/waybills': { section: 'Operations', title: 'Waybills' },
  '/inventory': { section: 'Operations', title: 'Inventory' },
  '/tracking': { section: 'Roadmap', title: 'Tracking' },
  '/fleet': { section: 'Roadmap', title: 'Fleet' },
  '/customers': { section: 'Roadmap', title: 'Customers' },
  '/settings': { section: 'Roadmap', title: 'Settings' },
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const user = useAuthStore((state) => state.user)

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
        <BrandMark size="sm" />
        <div className="min-w-0 leading-tight">
          <div className="truncate font-display text-[15px] font-bold tracking-tight text-foreground">
            Yunlian Logistics
          </div>
          <div className="truncate text-[11px] font-medium text-muted-foreground">
            Operations Console
          </div>
        </div>
      </div>

      <nav className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-3 py-4">
        <div>
          <div className="eyebrow mb-2 px-3">Operations</div>
          <div className="space-y-0.5">
            {CORE_NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-xs'
                      : 'text-sidebar-foreground hover:bg-muted/70 hover:text-foreground',
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
              </NavLink>
            ))}
          </div>
        </div>

        <div>
          <div className="eyebrow mb-2 px-3">Planned Modules</div>
          <div className="space-y-0.5">
            {PLANNED_NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-muted-foreground/80 hover:bg-muted/60 hover:text-foreground',
                  )
                }
              >
                <span className="flex items-center gap-3 truncate">
                  <Icon className="h-4 w-4 shrink-0 opacity-75" />
                  <span className="truncate">{label}</span>
                </span>
                <span className="rounded-full border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Soon
                </span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="rounded-lg border border-border/70 bg-muted/40 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-foreground">Hong Kong Hub</span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Online
            </span>
          </div>
          <div className="mt-1 truncate text-[11px] text-muted-foreground">
            Role: <span className="capitalize text-foreground/80">{user?.role ?? 'operator'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AppLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const routeMeta = ROUTE_TITLES[pathname] ?? { section: 'Operations', title: 'Workspace' }
  const initials = (user?.username ?? 'U').slice(0, 2).toUpperCase()

  function handleLogout() {
    logout()
    toast.success('Signed out')
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop persistent sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile navigation drawer */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-72 bg-sidebar p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation menu</SheetTitle>
          </SheetHeader>
          <SidebarContent onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-card/85 px-4 backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
              <span className="hidden text-muted-foreground sm:inline">{routeMeta.section}</span>
              <ChevronRight className="hidden h-3.5 w-3.5 text-muted-foreground/60 sm:inline" />
              <span className="font-medium text-foreground">{routeMeta.title}</span>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="hidden items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 sm:inline-flex dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Live API
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Connected to persistent Python + SQLite backend
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={toggleTheme}
                  aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              </TooltipContent>
            </Tooltip>

            <div className="h-5 w-px bg-border" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2.5 text-left transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarFallback className="bg-primary/10 font-display text-xs font-semibold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden leading-tight sm:block">
                    <div className="text-xs font-semibold text-foreground">
                      {user?.username ?? 'Signed out'}
                    </div>
                    <div className="text-[11px] capitalize text-muted-foreground">
                      {user?.role ?? 'guest'}
                    </div>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="font-normal">
                  <div className="text-sm font-semibold text-foreground">{user?.username}</div>
                  <div className="mt-0.5 text-xs capitalize text-muted-foreground">
                    {user?.role} account
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggleTheme}>
                  {theme === 'dark' ? (
                    <Sun className="mr-2 h-4 w-4" />
                  ) : (
                    <Moon className="mr-2 h-4 w-4" />
                  )}
                  {theme === 'dark' ? 'Light appearance' : 'Dark appearance'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="scrollbar-thin min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1400px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
