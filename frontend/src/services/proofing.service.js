import api from './api'

export const proofingService = {
  // Public client proofing
  getBySlug: (slug, pin) => api.get(`/proof/${slug}`, { params: { pin } }),
  submitSelections: (slug, pin, photoIds) =>
    api.post(`/proof/${slug}/selections`, { pin, photo_ids: photoIds }),

  // Standalone & All Sessions
  getAllSessions: (params) => api.get('/proofing-sessions', { params }),
  createStandaloneSession: (data) => api.post('/proofing-sessions', data),
  getSessionById: (id) => api.get(`/proofing-sessions/${id}`),
  updateSessionById: (id, data) => api.patch(`/proofing-sessions/${id}`, data),
  deleteSessionById: (id) => api.delete(`/proofing-sessions/${id}`),
  addPhotosToSession: (id, photos) => api.post(`/proofing-sessions/${id}/photos`, { photos }),
  importDriveToSession: (id, folderInput) =>
    api.post(`/proofing-sessions/${id}/import-drive`, { folder_input: folderInput }),
  deletePhotoFromSession: (id, photoId) =>
    api.delete(`/proofing-sessions/${id}/photos/${photoId}`),

  // Legacy Booking-specific endpoints
  getByBooking: (bookingId) => api.get(`/bookings/${bookingId}/proofing`),
  createSession: (bookingId, data) => api.post(`/bookings/${bookingId}/proofing`, data),
  addPhotos: (bookingId, photos) => api.post(`/bookings/${bookingId}/proofing/photos`, { photos }),
  importFromDrive: (bookingId, folderInput) =>
    api.post(`/bookings/${bookingId}/proofing/import-drive`, { folder_input: folderInput }),
  deletePhoto: (bookingId, photoId) => api.delete(`/bookings/${bookingId}/proofing/photos/${photoId}`),
  updateSession: (sessionId, data) => api.patch(`/proofing-sessions/${sessionId}`, data),
}

export default proofingService
