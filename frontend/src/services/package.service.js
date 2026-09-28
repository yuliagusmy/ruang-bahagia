import api from './api'

export const packageService = {
  getAll: (params) => api.get('/packages', { params }),
  getPublic: () => api.get('/packages/public'),
  getById: (id) => api.get(`/packages/${id}`),
  create: (data) => api.post('/packages', data),
  update: (id, data) => api.patch(`/packages/${id}`, data),
  delete: (id) => api.delete(`/packages/${id}`),
}

export default packageService
