import { useState, useEffect } from 'react'
import BottomSheet from '../../../components/ui/BottomSheet'
import Button from '../../../components/ui/Button'
import subscriptionService from '../../../services/subscription.service'

export default function SubscriptionCheckoutModal({
  isOpen,
  onClose,
  billingCycle = 'yearly',
  price = 490000,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState(null)
  const [simulating, setSimulating] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const formatRp = (num) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num || 0)

  // Buat transaksi saat modal terbuka
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('')
      setOrder(null)
      initiateTransaction()
    }
  }, [isOpen, billingCycle])

  const initiateTransaction = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await subscriptionService.createTransaction(billingCycle)
      const data = res.data?.data || res.data
      setOrder(data)

      // Jika bukan mock dan Midtrans Snap tersedia di browser
      if (!data.is_mock && data.snap_token) {
        openMidtransSnap(data.snap_token, data.client_key, data.is_production, data.order_id)
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Gagal menyiapkan tagihan pembayaran Midtrans.')
    } finally {
      setLoading(false)
    }
  }

  const openMidtransSnap = (snapToken, clientKey, isProduction, orderId) => {
    const scriptId = 'midtrans-snap-js'
    const snapUrl = isProduction
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js'

    const triggerPay = () => {
      if (window.snap) {
        window.snap.pay(snapToken, {
          onSuccess: async () => {
            await handleCheckStatus(orderId)
          },
          onPending: () => {
            alert('Pembayaran Anda sedang diproses. Mohon selesaikan transfer.')
          },
          onError: () => {
            setErrorMsg('Pembayaran gagal atau dibatalkan.')
          },
          onClose: () => {
            // User menutup popup Snap
          },
        })
      }
    }

    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script')
      script.id = scriptId
      script.src = snapUrl
      script.setAttribute('data-client-key', clientKey || '')
      script.onload = triggerPay
      document.body.appendChild(script)
    } else {
      triggerPay()
    }
  }

  const handleCheckStatus = async (orderId) => {
    try {
      const res = await subscriptionService.checkStatus(orderId)
      if (res.data?.data?.is_paid) {
        onSuccess?.()
        onClose?.()
      }
    } catch {
      // Abaikan error cek
    }
  }

  const handleSimulatePayment = async () => {
    if (!order?.order_id) return
    setSimulating(true)
    try {
      const res = await subscriptionService.simulatePayment(order.order_id)
      const updatedUser = res.data?.data?.user
      onSuccess?.(updatedUser)
      onClose?.()
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Gagal memproses simulasi pembayaran.')
    } finally {
      setSimulating(false)
    }
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Checkout Midtrans — Pro Studio"
      className="rb-sheet--wide"
    >
      <div className="rb-upgrade-modal">
        {errorMsg && (
          <div className="rb-settings-alert rb-settings-alert--error" role="alert">
            <span>⚠️ {errorMsg}</span>
          </div>
        )}

        <div className="rb-upgrade-summary">
          <div className="rb-upgrade-summary__row">
            <span>Paket Pilihan</span>
            <strong>Pro Studio ({billingCycle === 'yearly' ? 'Tahunan - Hemat 2 Bulan' : 'Bulanan'})</strong>
          </div>
          <div className="rb-upgrade-summary__row">
            <span>Metode Gateway</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <strong>Midtrans Snap</strong> (QRIS, VA, e-Wallet)
            </span>
          </div>
          {order?.order_id && (
            <div className="rb-upgrade-summary__row">
              <span>Nomor Pesanan</span>
              <code style={{ fontSize: '12px' }}>{order.order_id}</code>
            </div>
          )}
          <div className="rb-upgrade-summary__row rb-upgrade-summary__row--total">
            <span>Total Tagihan</span>
            <strong>{formatRp(price)}</strong>
          </div>
        </div>

        {/* Kotak Info Midtrans / Simulator */}
        <div className="rb-midtrans-box">
          <div className="rb-midtrans-box__header">
            <span className="rb-midtrans-badge">✦ Midtrans Sandbox</span>
            <span className="rb-midtrans-methods">QRIS • GoPay • ShopeePay • BCA • Mandiri • BRI</span>
          </div>
          <p className="rb-midtrans-box__desc">
            Sistem terintegrasi dengan gateway pembayaran Midtrans untuk verifikasi otomatis status Pro Studio Anda.
          </p>

          {/* Tombol Buka Snap atau Simulasi */}
          <div style={{ marginTop: 'var(--rb-space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--rb-space-2)' }}>
            {!order?.is_mock && order?.snap_token ? (
              <>
                <Button
                  onClick={() => openMidtransSnap(order.snap_token, order.client_key, order.is_production, order.order_id)}
                  loading={loading}
                  fullWidth
                >
                  💳 Buka Layar Pembayaran Midtrans Snap
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleSimulatePayment}
                  loading={simulating}
                  fullWidth
                >
                  ⚡ Simulasikan Pembayaran Berhasil (Dev / Sandbox)
                </Button>
              </>
            ) : (
              <Button
                onClick={handleSimulatePayment}
                loading={simulating || loading}
                fullWidth
                style={{
                  background: 'var(--rb-accent)',
                  color: 'var(--rb-accent-text)',
                  border: 'none',
                  fontWeight: 600,
                }}
              >
                ⚡ Simulasikan Pembayaran Sukses (Instant Pro)
              </Button>
            )}
          </div>
        </div>

        <div className="rb-upgrade-actions" style={{ marginTop: 'var(--rb-space-4)' }}>
          <Button variant="ghost" onClick={onClose} fullWidth disabled={loading || simulating}>
            Batal
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}
