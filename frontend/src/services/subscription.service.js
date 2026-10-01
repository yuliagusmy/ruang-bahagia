import api from './api'

const subscriptionService = {
  getStatus: () => api.get('/subscription'),
  createTransaction: (plan = 'monthly') =>
    api.post('/subscription/create-transaction', { plan }),
  checkStatus: (orderId) => api.get(`/subscription/orders/${orderId}/status`),
  simulatePayment: (orderId) =>
    api.post(`/subscription/orders/${orderId}/simulate`),
  upgrade: (plan = 'monthly', paymentMethod = 'qris') =>
    api.post('/subscription/upgrade', {
      plan,
      payment_method: paymentMethod,
    }),
}

export default subscriptionService
