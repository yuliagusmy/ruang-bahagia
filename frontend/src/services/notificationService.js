import api from './api'

export const notificationService = {
  /**
   * Ambil daftar notifikasi in-app fotografer
   */
  getAll() {
    return api.get('/notifications')
  },

  /**
   * Tandai satu notifikasi sebagai sudah dibaca
   */
  markAsRead(id) {
    return api.patch(`/notifications/${id}/read`)
  },

  /**
   * Tandai semua notifikasi sebagai sudah dibaca
   */
  markAllRead() {
    return api.post('/notifications/mark-all-read')
  },

  /**
   * Kirim test push notification ke semua perangkat terdaftar
   */
  testPush() {
    return api.post('/push-notifications/test')
  },

  /**
   * Kirim test WhatsApp ke nomor tertentu
   */
  testWhatsApp(phone) {
    return api.post('/whatsapp/test', { phone })
  },

  /**
   * Kirim notifikasi WhatsApp 1-klik untuk booking tertentu
   */
  sendBookingWa(bookingId, type, customMessage = null) {
    return api.post(`/bookings/${bookingId}/send-wa`, {
      type,
      custom_message: customMessage,
    })
  },
}
