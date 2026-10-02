import api from './api'

/**
 * usePushNotifications — hook utility untuk daftarkan browser ke Web Push Notifications
 * Digunakan di AppLayout saat fotografer login.
 */
export async function registerPushSubscription() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { success: false, message: 'Browser Anda tidak mendukung Push Notifications.' }
  }

  try {
    const registration = await navigator.serviceWorker.ready

    // Ambil VAPID public key dari backend
    const { data: keyData } = await api.get('/push-notifications/vapid-key')
    const vapidPublicKey = keyData?.data?.public_key
    if (!vapidPublicKey) {
      return { success: false, message: 'VAPID public key tidak tersedia dari server.' }
    }

    // Minta izin notifikasi dari browser
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      return { success: false, message: 'Izin notifikasi browser ditolak oleh pengguna.' }
    }

    // Buat subscription baru di PushManager
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    })

    const subJson = subscription.toJSON()

    // Kirim ke backend untuk disimpan
    await api.post('/push-subscriptions', {
      endpoint: subJson.endpoint,
      p256dh: subJson.keys?.p256dh,
      auth: subJson.keys?.auth,
      user_agent: navigator.userAgent,
    })

    return { success: true, message: 'Push Notifications PWA berhasil diaktifkan.' }
  } catch (err) {
    console.warn('[WebPush] Gagal daftarkan subscription:', err)
    return { success: false, message: err.message || 'Gagal mengaktifkan Push Notifications.' }
  }
}

/**
 * Konversi VAPID public key dari Base64 ke Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
