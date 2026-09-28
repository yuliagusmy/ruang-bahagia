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
import ClientProofingPage from './pages/proofing/ClientProofingPage'
import RegisterPage from './pages/auth/RegisterPage'
import PhotographerProfilePage from './pages/public/PhotographerProfilePage'
import PublicBookingPage from './pages/booking-public/PublicBookingPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Public Client Showcase, Photographer Profiles & Booking Routes */}
        <Route element={<ClientLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/@:username" element={<PhotographerProfilePage />} />
          <Route path="/p/:username" element={<PhotographerProfilePage />} />
          <Route path="/book" element={<PublicBookingPage />} />
          <Route path="/proof/:slug" element={<ClientProofingPage />} />
        </Route>

        {/* Protected Photographer Dashboard & CRM Routes */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/bookings" element={<BookingListPage />} />
          <Route path="/bookings/:id" element={<BookingDetailPage />} />
          <Route path="/clients" element={<ClientListPage />} />
          <Route path="/clients/:id" element={<ClientDetailPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/packages" element={<PackagePage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/proofing/:id" element={<ProofingPage />} />
        </Route>

        {/* Fallbacks */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
