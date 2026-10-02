import { useNavigate } from 'react-router-dom'
import { useNotifStore } from '../../stores/notifStore'
import BottomSheet from '../ui/BottomSheet'
import './NotificationSheet.css'

function formatTimeAgo(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffSec = Math.floor((now - date) / 1000)

  if (diffSec < 60) return 'Baru saja'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} menit lalu`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour} jam lalu`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay === 1) return 'Kemarin'
  if (diffDay < 7) return `${diffDay} hari lalu`

  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

function getIconForType(type) {
  switch (type) {
    case 'booking_new':
      return { emoji: '📸', bg: 'var(--rb-accent-subtle, #fdf4e3)' }
    case 'selection_done':
      return { emoji: '🎉', bg: 'rgba(16, 185, 129, 0.1)' }
    case 'system_test':
      return { emoji: '⚡', bg: 'rgba(59, 130, 246, 0.1)' }
    default:
      return { emoji: '🔔', bg: 'var(--rb-bg-secondary)' }
  }
}

export default function NotificationSheet({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { notifications, unreadCount, markAsRead, markAllRead, loading } = useNotifStore()

  const handleItemClick = async (notif) => {
    if (!notif.read_at) {
      await markAsRead(notif.id)
    }
    onClose()
    const targetUrl = notif.data?.url || (notif.notifiable_id ? `/bookings/${notif.notifiable_id}` : null)
    if (targetUrl) {
      navigate(targetUrl)
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Pusat Notifikasi">
      <div className="rb-notif-panel">
        <div className="rb-notif-panel__header">
          <div className="rb-notif-panel__title-wrap">
            <span className="rb-notif-panel__count-badge">
              {unreadCount > 0 ? `${unreadCount} Belum Dibaca` : 'Semua Sudah Dibaca'}
            </span>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              className="rb-notif-panel__mark-all-btn"
              onClick={markAllRead}
            >
              Tandai Semua Dibaca
            </button>
          )}
        </div>

        {loading && notifications.length === 0 ? (
          <div className="rb-notif-panel__loading">
            <span className="rb-notif-panel__spinner" />
            <p>Memuat notifikasi...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="rb-notif-panel__empty">
            <div className="rb-notif-panel__empty-icon" aria-hidden="true">🔔</div>
            <h4 className="rb-notif-panel__empty-title">Belum Ada Notifikasi Baru</h4>
            <p className="rb-notif-panel__empty-desc">
              Pemberitahuan booking baru dari klien dan hasil seleksi swipe proofing akan langsung tampil di sini.
            </p>
          </div>
        ) : (
          <div className="rb-notif-panel__list" role="list">
            {notifications.map((item) => {
              const isUnread = !item.read_at
              const iconInfo = getIconForType(item.type)
              return (
                <div
                  key={item.id}
                  role="listitem"
                  tabIndex={0}
                  className={`rb-notif-item ${isUnread ? 'rb-notif-item--unread' : ''}`}
                  onClick={() => handleItemClick(item)}
                  onKeyDown={(e) => e.key === 'Enter' && handleItemClick(item)}
                >
                  <div
                    className="rb-notif-item__icon"
                    style={{ backgroundColor: iconInfo.bg }}
                    aria-hidden="true"
                  >
                    <span>{iconInfo.emoji}</span>
                  </div>

                  <div className="rb-notif-item__body">
                    <div className="rb-notif-item__top">
                      <strong className="rb-notif-item__title">{item.title}</strong>
                      <span className="rb-notif-item__time">{formatTimeAgo(item.created_at)}</span>
                    </div>
                    <p className="rb-notif-item__text">{item.body}</p>
                  </div>

                  {isUnread && (
                    <span className="rb-notif-item__dot" aria-label="Belum dibaca" />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </BottomSheet>
  )
}
