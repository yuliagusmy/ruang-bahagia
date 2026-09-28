import api from './api'

export const scheduleService = {
  getAll: (params) => api.get('/schedules', { params }),
  getAvailable: (params) => api.get('/schedules/available', { params }),
  create: (data) => api.post('/schedules', data),
  update: (id, data) => api.patch(`/schedules/${id}`, data),
  delete: (id) => api.delete(`/schedules/${id}`),
}

export default scheduleService
