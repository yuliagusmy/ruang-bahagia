import { useState, useEffect, useCallback } from 'react'
import deliveryService from '../services/delivery.service'

export function useClientDelivery(bookingCode, pin) {
  const [delivery, setDelivery] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isExpired, setIsExpired] = useState(false)

  const fetchDelivery = useCallback(async () => {
    if (!bookingCode || !pin) return
    setLoading(true)
    setError(null)
    setIsExpired(false)
    try {
      const res = await deliveryService.getByCode(bookingCode, pin)
      setDelivery(res.data?.data || res.data)
    } catch (err) {
      if (err.response?.status === 410) {
        setIsExpired(true)
        setError(err.response?.data?.message || 'Masa aktif pengunduhan foto ini telah berakhir.')
      } else {
        setError(err.response?.data?.message || 'Gagal memuat data serah terima foto. Periksa PIN Anda.')
      }
    } finally {
      setLoading(false)
    }
  }, [bookingCode, pin])

  useEffect(() => {
    if (bookingCode && pin) {
      fetchDelivery()
    }
  }, [bookingCode, pin, fetchDelivery])

  return { delivery, loading, error, isExpired, refetch: fetchDelivery }
}

export function useBookingDelivery(bookingId) {
  const [delivery, setDelivery] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDelivery = useCallback(async () => {
    if (!bookingId) return
    setLoading(true)
    setError(null)
    try {
      const res = await deliveryService.getByBooking(bookingId)
      setDelivery(res.data?.data || null)
    } catch (err) {
      if (err.response?.status === 404) {
        setDelivery(null)
      } else {
        setError(err.response?.data?.message || 'Gagal memuat status delivery.')
      }
    } finally {
      setLoading(false)
    }
  }, [bookingId])

  useEffect(() => {
    fetchDelivery()
  }, [fetchDelivery])

  const saveDelivery = async (data) => {
    const res = await deliveryService.saveDelivery(bookingId, data)
    setDelivery(res.data?.data || res.data)
    return res.data
  }

  return { delivery, loading, error, refetch: fetchDelivery, saveDelivery }
}
