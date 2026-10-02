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

export function usePhotographerProofing(identifier, isSessionId = true) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchSession = useCallback(async () => {
    if (!identifier) return
    setLoading(true)
    setError(null)
    try {
      let res
      // 1. Prioritaskan ambil langsung via ID Sesi Proofing (karena rute utamanya adalah /proofing/:id)
      try {
        res = await proofingService.getSessionById(identifier)
      } catch (errSession) {
        // Jika gagal di session ID (misal 404 atau 403), coba cari apakah identifier ini adalah ID booking
        try {
          res = await proofingService.getByBooking(identifier)
        } catch (errBooking) {
          // Jika keduanya 404, berarti sesi memang belum dibuat untuk booking ini
          if (errBooking.response?.status === 404) {
            setSession(null)
            return
          }
          throw errSession.response?.status !== 404 ? errSession : errBooking
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
  }, [identifier])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  const createSession = async (data = {}) => {
    let res
    if (data.isStandalone || !identifier) {
      res = await proofingService.createStandaloneSession(data)
    } else {
      try {
        res = await proofingService.createSession(identifier, data)
      } catch {
        res = await proofingService.createStandaloneSession(data)
      }
    }
    const sessionData = res.data?.data || res.data
    setSession(sessionData)
    return sessionData
  }

  const addPhotos = async (photos) => {
    const targetSessionId = session?.id || identifier
    let res
    try {
      res = await proofingService.addPhotosToSession(targetSessionId, photos)
    } catch (err) {
      if (!session?.id) {
        res = await proofingService.addPhotos(identifier, photos)
      } else {
        throw err
      }
    }
    const sessionData = res.data?.data || res.data
    setSession(sessionData)
    return sessionData
  }

  const importFromDrive = async (folderInput) => {
    const targetSessionId = session?.id || identifier
    let res
    try {
      res = await proofingService.importDriveToSession(targetSessionId, folderInput)
    } catch (err) {
      if (!session?.id) {
        res = await proofingService.importFromDrive(identifier, folderInput)
      } else {
        throw err
      }
    }
    const sessionData = res.data?.data || res.data
    setSession(sessionData)
    return sessionData
  }

  const deletePhoto = async (photoId) => {
    const targetSessionId = session?.id || identifier
    try {
      await proofingService.deletePhotoFromSession(targetSessionId, photoId)
    } catch (err) {
      if (!session?.id) {
        await proofingService.deletePhoto(identifier, photoId)
      } else {
        throw err
      }
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
