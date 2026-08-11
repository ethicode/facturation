import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './app/layout/AppLayout.jsx'
import LoginPage from './pages/LoginPage.jsx'
import OverviewPage from './pages/OverviewPage.jsx'
import DirfinPage from './pages/DirfinPage.jsx'
import ApproPage from './pages/ApproPage.jsx'
import ApproTicketCreatePage from './pages/ApproTicketCreatePage.jsx'
import ApproTicketDetailPage from './pages/ApproTicketDetailPage.jsx'
import InvoicesPage from './pages/InvoicesPage.jsx'
import InvoiceDetailPage from './pages/InvoiceDetailPage.jsx'
import BudgetPage from './pages/BudgetPage.jsx'
import AdminSettingsPage from './pages/AdminSettingsPage.jsx'

function ProtectedRoute({ children }) {
  const auth = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('facturation.auth') || 'null') : null
  return auth?.token ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<OverviewPage />} />
        <Route path="dirfin" element={<DirfinPage />} />
        <Route path="approvisionnement" element={<ApproPage />} />
        <Route path="approvisionnement/creation" element={<ApproTicketCreatePage />} />
        <Route path="approvisionnement/:ticketId" element={<ApproTicketDetailPage />} />
        <Route path="facturation" element={<InvoicesPage />} />
        <Route path="facturation/:invoiceId" element={<InvoiceDetailPage />} />
        <Route path="budget" element={<BudgetPage />} />
        <Route path="parametrages" element={<AdminSettingsPage />} />
        <Route path="parametrage" element={<Navigate to="/parametrages#directions" replace />} />
      </Route>
      <Route path="*" element={<Navigate to={typeof window !== 'undefined' && JSON.parse(localStorage.getItem('facturation.auth') || 'null')?.token ? '/' : '/login'} replace />} />
    </Routes>
  )
}

export default App
