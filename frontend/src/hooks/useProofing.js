import { useState, useEffect, useCallback } from 'react'
import proofingService from '../services/proofing.service'

export function useClientProofing(slug, pin) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchSession = useCallback(async () => {
    if (!slug) return
    setLoading(true)
    setError(null)
    try {
      const res = await proofingService.getBySlug(slug, pin)
      setSession(res.data?.data || res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat sesi proofing. Periksa PIN Anda.')
    } finally {
      setLoading(false)
    }
  }, [slug, pin])

  useEffect(() => {
    if (pin) {
      fetchSession()
    } else {
      setLoading(false)
    }
  }, [pin, fetchSession])

  const submitSelections = async (photoIds) => {
    const res = await proofingService.submitSelections(slug, pin, photoIds)
    return res.data
  }

  return { session, loading, error, refetch: fetchSession, submitSelections }
}
