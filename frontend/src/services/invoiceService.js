import api from './api'

export const invoiceService = {
  getPublicInvoice: async (bookingCode) => {
    const response = await api.get(`/invoices/${bookingCode}`)
    return response.data
  },
}

export default invoiceService
