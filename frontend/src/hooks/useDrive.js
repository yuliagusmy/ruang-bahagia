import { useState, useEffect } from 'react'
import api from '../services/api'

/**
 * Hook untuk mengelola status koneksi Google Drive fotografer.
 * Membaca dari GET /gdrive/status dan memicu OAuth flow.
 */
export function useDrive() {
  const [status, setStatus]   = useState(null)   // { connected, gdrive_email, expires_at }
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchStatus = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/gdrive/status')
      setStatus(data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memeriksa status Google Drive.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  /**
   * Mulai OAuth flow: ambil auth_url dari backend, lalu redirect browser ke sana.
   * Setelah consent, Google redirect ke /api/gdrive/callback yang akan redirect
   * ke /settings?gdrive=success
   */
  const connect = async () => {
    setActionLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/gdrive/connect')
      window.location.href = data.data.auth_url
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memulai koneksi Google Drive.')
      setActionLoading(false)
    }
  }

  const disconnect = async () => {
    setActionLoading(true)
    setError(null)
    try {
      await api.delete('/gdrive/disconnect')
      setStatus({ connected: false })
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memutus koneksi Google Drive.')
    } finally {
      setActionLoading(false)
    }
  }

  const fetchFolders = async () => {
    try {
      const { data } = await api.get('/gdrive/folders')
      return data.data || []
    } catch (err) {
      throw err
    }
  }

  return { status, loading, error, actionLoading, connect, disconnect, fetchFolders, refetch: fetchStatus }
}
