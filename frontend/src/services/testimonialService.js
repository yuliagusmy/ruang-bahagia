import api from './api'

export const testimonialService = {
  /**
   * Klien submit rating & ulasan dari portal unduh foto final
   */
  submitReview(bookingCode, data) {
    return api.post(`/deliveries/${bookingCode}/review`, data)
  },

  /**
   * Ambil daftar ulasan klien untuk profil publik fotografer
   */
  getPublicReviews(username) {
    return api.get(`/photographers/${username}/reviews`)
  },

  /**
   * Ambil ulasan sorotan untuk halaman publik beranda (Landing Page)
   */
  getFeatured() {
    return api.get('/testimonials/featured')
  },

  /**
   * Fotografer: ambil semua ulasan masuk
   */
  getAll() {
    return api.get('/reviews')
  },

  /**
   * Fotografer: tandai / lepas sorotan ulasan untuk tampil di profil
   */
  toggleFeatured(id) {
    return api.patch(`/reviews/${id}/toggle-featured`)
  },

  /**
   * Fotografer: hapus ulasan
   */
  deleteReview(id) {
    return api.delete(`/reviews/${id}`)
  },
}

export default testimonialService
