import api from './api'

export const proofingService = {
  // Public client proofing
  getBySlug: (slug, pin) => api.get(`/proof/${slug}`, { params: { pin } }),
  submitSelections: (slug, pin, photoIds) =>
    api.post(`/proof/${slug}/selections`, { pin, photo_ids: photoIds }),

  // Photographer session endpoints
  getByBooking: (bookingId) => api.get(`/bookings/${bookingId}/proofing`),
  createSession: (bookingId, data) => api.post(`/bookings/${bookingId}/proofing`, data),
  updateSession: (sessionId, data) => api.patch(`/proofing-sessions/${sessionId}`, data),
}

export default proofingService
