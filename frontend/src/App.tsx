import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router'
import { Toaster } from 'sonner'
import AppLayout from '@/components/AppLayout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Orders from '@/pages/Orders'
import Inventory from '@/pages/Inventory'
import Waybills from '@/pages/Waybills'
import ComingSoon from '@/pages/ComingSoon'
import { useIsAuthed } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

function RequireAuth() {
  // Preserve the requested route when redirecting visitors to sign in.
  const isAuthed = useIsAuthed()
  const location = useLocation()
  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

export default function App() {
  const theme = useThemeStore((state) => state.theme)

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/waybills" element={<Waybills />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/tracking" element={<ComingSoon />} />
            <Route path="/fleet" element={<ComingSoon />} />
            <Route path="/customers" element={<ComingSoon />} />
            <Route path="/settings" element={<ComingSoon />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      </Routes>
      <Toaster position="top-right" theme={theme} richColors closeButton />
    </>
  )
}
