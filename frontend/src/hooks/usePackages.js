import { useState, useEffect, useCallback } from 'react'
import packageService from '../services/package.service'

export function usePackages(initialParams = {}) {
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [params, setParams] = useState(initialParams)

  const fetchPackages = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await packageService.getAll(params)
      setPackages(res.data?.data || res.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat paket.')
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => {
    fetchPackages()
  }, [fetchPackages])

  const createPackage = async (data) => {
    const res = await packageService.create(data)
    await fetchPackages()
    return res.data
  }

  const updatePackage = async (id, data) => {
    const res = await packageService.update(id, data)
    await fetchPackages()
    return res.data
  }

  const deletePackage = async (id) => {
    await packageService.delete(id)
    await fetchPackages()
  }

  return {
    packages,
    loading,
    error,
    params,
    setParams,
    refetch: fetchPackages,
    createPackage,
    updatePackage,
    deletePackage,
  }
}
