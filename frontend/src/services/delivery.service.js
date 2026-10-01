import api from './api'

export const deliveryService = {
  // Public client delivery
  getByCode: (bookingCode, pin) => api.get(`/deliveries/${bookingCode}`, { params: { pin } }),

  // Photographer delivery endpoints
  getByBooking: (bookingId) => api.get(`/bookings/${bookingId}/delivery`),
  saveDelivery: (bookingId, data) => api.post(`/bookings/${bookingId}/delivery`, data),
}

export default deliveryService
