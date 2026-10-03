import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Attach token setiap request jika belum diatur secara eksplisit
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401: auto logout (kecuali saat berada di rute callback autentikasi)
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
      if (!pathname.includes('/auth/callback') && !pathname.includes('/gdrive/callback')) {
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
