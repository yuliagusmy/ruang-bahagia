import { useState, useEffect, useCallback } from 'react'
import scheduleService from '../services/schedule.service'

export function useSchedules(initialParams = {}) {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [params, setParams] = useState(initialParams)

  const fetchSchedules = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await scheduleService.getAll(params)
      setSchedules(res.data?.data || res.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat jadwal.')
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  const createSchedule = async (data) => {
    const res = await scheduleService.create(data)
    await fetchSchedules()
    return res.data
  }

  const updateSchedule = async (id, data) => {
    const res = await scheduleService.update(id, data)
    await fetchSchedules()
    return res.data
  }

  const deleteSchedule = async (id) => {
    await scheduleService.delete(id)
    await fetchSchedules()
  }

  return {
    schedules,
    loading,
    error,
    params,
    setParams,
    refetch: fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
  }
}
