import api from './api'

export const adminService = {
  getSummary: () => api.get('/admin/summary'),
  getPhotographers: (params = {}) => api.get('/admin/photographers', { params }),
  adjustSubscription: (id, payload) => api.post(`/admin/photographers/${id}/adjust-subscription`, payload),
  getTransactions: () => api.get('/admin/transactions'),
}

export default adminService
