import api from './api'

export const portfolioService = {
  getAll: (params) => api.get('/portfolio', { params }),
  getPublic: (params) => api.get('/portfolio/public', { params }),
  getDetail: (id) => api.get(`/portfolio/${id}`),
  getPublicDetail: (id) => api.get(`/portfolio/public/${id}`),
  create: (data) => api.post('/portfolio', data),
  update: (id, data) => api.patch(`/portfolio/${id}`, data),
  delete: (id) => api.delete(`/portfolio/${id}`),
}

export default portfolioService
