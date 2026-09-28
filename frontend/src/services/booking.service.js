import api from './api'

export const bookingService = {
  getAll: (params) => api.get('/bookings', { params }),
  getUpcoming: () => api.get('/bookings/upcoming'),
  getById: (id) => api.get(`/bookings/${id}`),
  create: (data) => api.post('/bookings', data),
  updateStatus: (id, status) => api.patch(`/bookings/${id}/status`, { status }),
  requestPublic: (data) => api.post('/bookings/request', data),

  // Payments
  getPayments: (bookingId) => api.get(`/bookings/${bookingId}/payments`),
  addPayment: (bookingId, data) => api.post(`/bookings/${bookingId}/payments`, data),
  confirmPayment: (paymentId) => api.patch(`/payments/${paymentId}/confirm`),
}

export default bookingService
