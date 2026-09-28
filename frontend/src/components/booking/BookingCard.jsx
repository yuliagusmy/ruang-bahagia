import { Link } from 'react-router-dom'
import Badge from '../ui/Badge'
import './BookingCard.css'

export default function BookingCard({ booking }) {
  const date = new Date(booking.event_date)
  const day = date.toLocaleDateString('id-ID', { day: '2-digit' })
  const month = date.toLocaleDateString('id-ID', { month: 'short' })

  const formattedAmount = booking.total_price
    ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(booking.total_price)
    : '-'

  return (
    <Link to={`/bookings/${booking.id}`} className="rb-booking-card">
      <div className="rb-booking-card__date">
        <span className="rb-booking-card__day">{day}</span>
        <span className="rb-booking-card__month">{month}</span>
      </div>

      <div className="rb-booking-card__content">
        <div className="rb-booking-card__header">
          <h4 className="rb-booking-card__client">{booking.client?.name || 'Klien'}</h4>
          <Badge status={booking.status} size="sm" />
        </div>

        <p className="rb-booking-card__package">
          {booking.package?.name || 'Paket Sesi'}
          {booking.location ? ` • ${booking.location}` : ''}
        </p>

        <div className="rb-booking-card__meta">
          <span className="rb-booking-card__code">#{booking.booking_code}</span>
          <span className="rb-booking-card__price">{formattedAmount}</span>
        </div>
      </div>
    </Link>
  )
}
