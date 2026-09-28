import { useState, useEffect, useCallback } from 'react'
import clientService from '../services/client.service'

export function useClients(initialParams = {}) {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [params, setParams] = useState(initialParams)

  const fetchClients = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await clientService.getAll(params)
      setClients(res.data?.data || res.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat daftar klien.')
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const createClient = async (data) => {
    const res = await clientService.create(data)
    await fetchClients()
    return res.data
  }

  const updateClient = async (id, data) => {
    const res = await clientService.update(id, data)
    await fetchClients()
    return res.data
  }

  return {
    clients,
    loading,
    error,
    params,
    setParams,
    refetch: fetchClients,
    createClient,
    updateClient,
  }
}

export function useClientDetail(id) {
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDetail = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const res = await clientService.getById(id)
      setClient(res.data?.data || res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data klien.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  return { client, loading, error, refetch: fetchDetail }
}
