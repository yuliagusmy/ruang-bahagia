import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import ClientLayout from './layouts/ClientLayout'
import LandingPage from './pages/public/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import BookingListPage from './pages/bookings/BookingListPage'
import BookingDetailPage from './pages/bookings/BookingDetailPage'
import ClientListPage from './pages/clients/ClientListPage'
import ClientDetailPage from './pages/clients/ClientDetailPage'
import SchedulePage from './pages/schedule/SchedulePage'
import PackagePage from './pages/packages/PackagePage'
import PortfolioPage from './pages/portfolio/PortfolioPage'
import ProofingPage from './pages/proofing/ProofingPage'
import ProofingListPage from './pages/proofing/ProofingListPage'
import ClientProofingPage from './pages/proofing/ClientProofingPage'
import ClientDeliveryPage from './pages/delivery/ClientDeliveryPage'
import RegisterPage from './pages/auth/RegisterPage'
import AuthCallbackPage from './pages/auth/AuthCallbackPage'
import PhotographerProfilePage from './pages/public/PhotographerProfilePage'
import PublicBookingPage from './pages/booking-public/PublicBookingPage'
import PublicInvoicePage from './pages/public/PublicInvoicePage'

import SettingsPage from './pages/settings/SettingsPage'
import SubscriptionPage from './pages/subscription/SubscriptionPage'
import FinancialReportPage from './pages/reports/FinancialReportPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* Public Client Showcase, Photographer Profiles & Booking Routes */}
        <Route element={<ClientLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/book" element={<PublicBookingPage />} />
          <Route path="/proof/:slug" element={<ClientProofingPage />} />
          <Route path="/delivery/:code" element={<ClientDeliveryPage />} />
          <Route path="/invoice/:code" element={<PublicInvoicePage />} />
          <Route path="/p/:username" element={<PhotographerProfilePage />} />
          <Route path="/:username" element={<PhotographerProfilePage />} />
        </Route>

        {/* Protected Photographer Dashboard & CRM Routes */}
        <Route element={<AppLayout />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/reports" element={<FinancialReportPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/bookings" element={<BookingListPage />} />
          <Route path="/bookings/:id" element={<BookingDetailPage />} />
          <Route path="/clients" element={<ClientListPage />} />
          <Route path="/clients/:id" element={<ClientDetailPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/packages" element={<PackagePage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/proofing" element={<ProofingListPage />} />
          <Route path="/proofing/:id" element={<ProofingPage />} />
        </Route>

        {/* Fallbacks */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
