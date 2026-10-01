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

export function usePhotographerProofing(bookingId) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchSession = useCallback(async () => {
    if (!bookingId) return
    setLoading(true)
    setError(null)
    try {
      const res = await proofingService.getByBooking(bookingId)
      setSession(res.data?.data || res.data)
    } catch (err) {
      if (err.response?.status === 404) {
        setSession(null)
      } else {
        setError(err.response?.data?.message || 'Gagal memuat sesi proofing.')
      }
    } finally {
      setLoading(false)
    }
  }, [bookingId])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  const createSession = async (data = {}) => {
    const res = await proofingService.createSession(bookingId, data)
    const sessionData = res.data?.data || res.data
    setSession(sessionData)
    return sessionData
  }

  const addPhotos = async (photos) => {
    const res = await proofingService.addPhotos(bookingId, photos)
    const sessionData = res.data?.data || res.data
    setSession(sessionData)
    return sessionData
  }

  const importFromDrive = async (folderInput) => {
    const res = await proofingService.importFromDrive(bookingId, folderInput)
    const sessionData = res.data?.data || res.data
    setSession(sessionData)
    return sessionData
  }

  const deletePhoto = async (photoId) => {
    await proofingService.deletePhoto(bookingId, photoId)
    await fetchSession()
  }

  return {
    session,
    loading,
    error,
    refetch: fetchSession,
    createSession,
    addPhotos,
    importFromDrive,
    deletePhoto,
  }
}
