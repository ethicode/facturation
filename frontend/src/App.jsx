import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './app/layout/AppLayout.jsx'
import { getStoredAuth } from './services/authService.js'
import LoginPage from './pages/LoginPage.jsx'
import OverviewPage from './pages/OverviewPage.jsx'
import DirfinPage from './pages/DirfinPage.jsx'
import ApproPage from './pages/ApproPage.jsx'
import ApproTicketCreatePage from './pages/ApproTicketCreatePage.jsx'
import ApproTicketDetailPage from './pages/ApproTicketDetailPage.jsx'
import FacturationPage from './pages/FacturationPage.jsx'
import FacturationCreatePage from './pages/FacturationCreatePage.jsx'
import FacturationDetailPage from './pages/FacturationDetailPage.jsx'
import BudgetPage from './pages/BudgetPage.jsx'
import AdminSettingsPage from './pages/AdminSettingsPage.jsx'

function ProtectedRoute({ children }) {
  const auth = getStoredAuth()
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
        <Route path="facturation" element={<FacturationPage />} />
        <Route path="facturation/creation" element={<FacturationCreatePage />} />
        <Route path="facturation/:factureId/:taskSlug" element={<FacturationDetailPage />} />
        <Route path="facturation/:factureId" element={<FacturationDetailPage />} />
        <Route path="budget" element={<BudgetPage />} />
        <Route path="tracabilite" element={<Navigate to="/" replace />} />
        <Route path="parametrages" element={<AdminSettingsPage />} />
        <Route path="parametrage" element={<Navigate to="/parametrages#directions" replace />} />
      </Route>
      <Route path="*" element={<Navigate to={getStoredAuth()?.token ? '/' : '/login'} replace />} />
    </Routes>
  )
}

export default App
