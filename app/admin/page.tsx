import AdminDashboard from '@/components/AdminDashboard'
import AdminLogin from '@/components/AdminLogin'
import { isAdminRequest } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const isAdmin = await isAdminRequest()
  return isAdmin ? <AdminDashboard /> : <AdminLogin />
}
