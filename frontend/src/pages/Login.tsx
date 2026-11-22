import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import {
  AlertCircle,
  ArrowRight,
  Boxes,
  Database,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  UserRound,
} from 'lucide-react'
import { toast } from 'sonner'
import { authApi } from '@/api'
import { ApiError } from '@/lib/request'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { BrandMark } from '@/components/BrandMark'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const HIGHLIGHTS = [
  {
    icon: Boxes,
    title: 'Atomic inventory control',
    description: 'Real-time SKU stock validation and automatic deduction on every waybill.',
  },
  {
    icon: ShieldCheck,
    title: 'End-to-end shipment visibility',
    description: 'Track fulfillment transitions from pending pickup through final delivery.',
  },
  {
    icon: Database,
    title: 'Persistent SQLite ledger',
    description: 'Shared Python REST API backed by durable, transactional storage.',
  },
]

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((state) => state.setAuth)
  const { theme, toggleTheme } = useThemeStore()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function fillDemoCredentials() {
    setUsername('demo')
    setPassword('demo123')
    setErrorMessage(null)
    toast.info('Demo credentials filled')
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setErrorMessage(null)
    if (!username.trim() || !password) {
      const msg = 'Enter both your username and password.'
      setErrorMessage(msg)
      toast.error(msg)
      return
    }
    setLoading(true)
    try {
      const { token, user } = await authApi.login({ username: username.trim(), password })
      setAuth(token, user)
      toast.success(`Welcome back, ${user.username}`)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from ?? '/dashboard', { replace: true })
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : 'Unable to sign in. Please try again.'
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Left executive brand showcase */}
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-slate-950 p-12 text-slate-50 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(37, 99, 235, 0.45), transparent 48%), radial-gradient(circle at 80% 78%, rgba(79, 70, 229, 0.35), transparent 45%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />

        <div className="relative flex items-center gap-3">
          <BrandMark size="md" />
          <div>
            <div className="font-display text-base font-bold tracking-tight text-white">
              Yunlian Logistics
            </div>
            <div className="text-xs text-slate-400">Logistics Management System</div>
          </div>
        </div>

        <div className="relative my-auto max-w-lg py-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            Hong Kong Hub · Operations Console
          </div>
          <h1 className="font-display mt-6 text-4xl font-bold leading-[1.12] tracking-[-0.03em] text-white xl:text-5xl">
            Precision logistics,
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
              unified operations.
            </span>
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-slate-300/90">
            Manage warehouse inventory, issue trackable waybills, and coordinate delivery status
            transitions from a single workspace.
          </p>

          <div className="mt-10 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="flex items-start gap-3.5 rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xs"
              >
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-300">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <div>
                  <div className="text-sm font-semibold text-white">{title}</div>
                  <div className="mt-0.5 text-xs leading-relaxed text-slate-400">{description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-between border-t border-white/10 pt-6 text-xs text-slate-400">
          <span>Yunlian Logistics Management System</span>
          <span className="font-mono text-[11px] text-slate-500">COMP3500SEF</span>
        </div>
      </div>

      {/* Right sign-in workspace */}
      <div className="relative flex w-full flex-col justify-between px-6 py-8 sm:px-10 lg:w-[500px] lg:shrink-0 xl:w-[540px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 lg:invisible">
            <BrandMark size="sm" />
            <span className="font-display text-sm font-bold text-foreground">
              Yunlian Logistics
            </span>
          </div>
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
        </div>

        <div className="mx-auto my-auto w-full max-w-[380px] py-8">
          <div className="space-y-2">
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground">
              Sign in
            </h2>
            <p className="text-sm text-muted-foreground">
              Enter your operator credentials to access the console.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {errorMessage && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-medium text-foreground">
                Username
              </Label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username"
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value)
                    if (errorMessage) setErrorMessage(null)
                  }}
                  placeholder="Enter username"
                  autoComplete="username"
                  className="h-11 bg-card pl-10 text-sm shadow-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-foreground">
                Password
              </Label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    if (errorMessage) setErrorMessage(null)
                  }}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="h-11 bg-card pl-10 pr-10 text-sm shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="h-11 w-full text-sm font-semibold">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in to console
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Demo workspace account
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    User:{' '}
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] font-medium text-foreground">
                      demo
                    </code>
                  </span>
                  <span>·</span>
                  <span>
                    Pass:{' '}
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] font-medium text-foreground">
                      demo123
                    </code>
                  </span>
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={fillDemoCredentials}
                className="shrink-0 text-xs"
              >
                Auto-fill
              </Button>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground lg:text-left">
          Protected operator session · Local SQLite API
        </div>
      </div>
    </div>
  )
}
