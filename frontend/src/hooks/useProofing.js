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

export function useProofingList() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchSessions = useCallback(async (params = {}) => {
    setLoading(true)
    setError(null)
    try {
      const res = await proofingService.getAllSessions(params)
      setSessions(res.data?.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat daftar sesi proofing.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const createStandalone = async (data) => {
    const res = await proofingService.createStandaloneSession(data)
    await fetchSessions()
    return res.data?.data || res.data
  }

  const deleteSession = async (id) => {
    await proofingService.deleteSessionById(id)
    await fetchSessions()
  }

  return {
    sessions,
    loading,
    error,
    refetch: fetchSessions,
    createStandalone,
    deleteSession,
  }
}

export function usePhotographerProofing(identifier, isSessionId = false) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchSession = useCallback(async () => {
    if (!identifier) return
    setLoading(true)
    setError(null)
    try {
      let res
      if (isSessionId) {
        res = await proofingService.getSessionById(identifier)
      } else {
        try {
          res = await proofingService.getByBooking(identifier)
        } catch (err) {
          // Jika gagal via booking, coba akses langsung sebagai session ID
          if (err.response?.status === 404) {
            res = await proofingService.getSessionById(identifier)
          } else {
            throw err
          }
        }
      }
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
  }, [identifier, isSessionId])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  const createSession = async (data = {}) => {
    let res
    if (data.isStandalone || !identifier) {
      res = await proofingService.createStandaloneSession(data)
    } else {
      res = await proofingService.createSession(identifier, data)
    }
    const sessionData = res.data?.data || res.data
    setSession(sessionData)
    return sessionData
  }

  const addPhotos = async (photos) => {
    let res
    if (session?.id) {
      res = await proofingService.addPhotosToSession(session.id, photos)
    } else {
      res = await proofingService.addPhotos(identifier, photos)
    }
    const sessionData = res.data?.data || res.data
    setSession(sessionData)
    return sessionData
  }

  const importFromDrive = async (folderInput) => {
    let res
    if (session?.id) {
      res = await proofingService.importDriveToSession(session.id, folderInput)
    } else {
      res = await proofingService.importFromDrive(identifier, folderInput)
    }
    const sessionData = res.data?.data || res.data
    setSession(sessionData)
    return sessionData
  }

  const deletePhoto = async (photoId) => {
    if (session?.id) {
      await proofingService.deletePhotoFromSession(session.id, photoId)
    } else {
      await proofingService.deletePhoto(identifier, photoId)
    }
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
