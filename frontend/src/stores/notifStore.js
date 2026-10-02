import { create } from 'zustand'
import { notificationService } from '../services/notificationService'

export const useNotifStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    try {
      set({ loading: true })
      const res = await notificationService.getAll()
      const data = res.data?.data || {}
      set({
        notifications: data.notifications || [],
        unreadCount: data.unread_count || 0,
        loading: false,
      })
    } catch (err) {
      console.warn('[NotifStore] Gagal mengambil notifikasi:', err)
      set({ loading: false })
    }
  },

  markAsRead: async (id) => {
    try {
      await notificationService.markAsRead(id)
      set((state) => {
        const updated = state.notifications.map((n) =>
          n.id === id ? { ...n, read_at: n.read_at || new Date().toISOString() } : n
        )
        const unread = updated.filter((n) => !n.read_at).length
        return { notifications: updated, unreadCount: unread }
      })
    } catch (err) {
      console.warn('[NotifStore] Gagal menandai dibaca:', err)
    }
  },

  markAllRead: async () => {
    try {
      await notificationService.markAllRead()
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          read_at: n.read_at || new Date().toISOString(),
        })),
        unreadCount: 0,
      }))
    } catch (err) {
      console.warn('[NotifStore] Gagal menandai semua dibaca:', err)
    }
  },
}))
