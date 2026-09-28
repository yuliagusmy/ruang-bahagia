import api from './api'

const subscriptionService = {
  getStatus: () => api.get('/subscription'),
  upgrade: (plan = 'monthly', paymentMethod = 'qris') =>
    api.post('/subscription/upgrade', {
      plan,
      payment_method: paymentMethod,
    }),
}

export default subscriptionService
