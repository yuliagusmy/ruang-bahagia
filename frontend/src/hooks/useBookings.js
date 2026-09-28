import { useState, useEffect, useCallback } from 'react'
import bookingService from '../services/booking.service'

export function useBookings(initialParams = {}) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [params, setParams] = useState(initialParams)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await bookingService.getAll(params)
      setBookings(res.data?.data || res.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data booking.')
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const createBooking = async (data) => {
    const res = await bookingService.create(data)
    await fetchBookings()
    return res.data
  }

  const updateStatus = async (id, status) => {
    const res = await bookingService.updateStatus(id, status)
    await fetchBookings()
    return res.data
  }

  return {
    bookings,
    loading,
    error,
    params,
    setParams,
    refetch: fetchBookings,
    createBooking,
    updateStatus,
  }
}

export function useBookingDetail(id) {
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDetail = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const res = await bookingService.getById(id)
      setBooking(res.data?.data || res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat detail booking.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  return { booking, loading, error, refetch: fetchDetail }
}
