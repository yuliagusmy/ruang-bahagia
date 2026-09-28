import { Link } from 'react-router-dom'
import Badge from '../ui/Badge'
import './ClientCard.css'

export default function ClientCard({ client }) {
  const initial = client.name ? client.name[0].toUpperCase() : 'K'

  return (
    <Link to={`/clients/${client.id}`} className="rb-client-card">
      <div className="rb-client-card__avatar" aria-hidden="true">
        {initial}
      </div>

      <div className="rb-client-card__info">
        <div className="rb-client-card__header">
          <h4 className="rb-client-card__name">{client.name}</h4>
          {client.pipeline_status && (
            <Badge status={client.pipeline_status} size="sm" />
          )}
        </div>

        <p className="rb-client-card__contact">
          {client.phone || client.email || 'Tanpa kontak'}
          {client.instagram ? ` • @${client.instagram.replace(/^@/, '')}` : ''}
        </p>

        {client.bookings_count !== undefined && (
          <span className="rb-client-card__meta">
            {client.bookings_count} booking tercatat
          </span>
        )}
      </div>
    </Link>
  )
}
