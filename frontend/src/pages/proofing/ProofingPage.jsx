import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import proofingService from '../../services/proofing.service'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Skeleton from '../../components/ui/Skeleton'
import './ProofingPage.css'

export default function ProofingPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // In production: fetch by booking id or session id
    proofingService.getByBooking(id)
      .then((res) => setSession(res.data?.data || res.data))
      .catch(() => {
        // Fallback demo mock session if not yet seeded
        setSession({
          id: id || 1,
          slug: `sesi-wedding-${id || 'demo'}`,
          pin: '2024',
          status: 'active',
          package: { name: 'Wedding Classic', photo_quota: 25 },
          photos: [
            { id: 1, original_filename: '_DSC4821.ARW', status: 'selected', watermarked_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=500' },
            { id: 2, original_filename: '_DSC4829.ARW', status: 'selected', watermarked_url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=500' },
            { id: 3, original_filename: '_DSC4835.ARW', status: 'skipped', watermarked_url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=500' },
          ],
        })
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="page rb-proofing-admin">
        <Skeleton variant="card" height="150px" />
      </div>
    )
  }

  const selectedPhotos = session?.photos?.filter((p) => p.status === 'selected') || []
  const shareUrl = `${window.location.origin}/proof/${session?.slug}`

  const copyLightroomList = () => {
    const list = selectedPhotos.map((p) => p.original_filename).join(', ')
    navigator.clipboard.writeText(list)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="page rb-proofing-admin">
      <div className="rb-proofing-admin__top">
        <button className="rb-proofing-admin__back" onClick={() => navigate(-1)} aria-label="Kembali">
          ← Kembali
        </button>
        <Badge status={session?.status || 'active'} />
      </div>

      <section className="rb-detail-card">
        <h2 className="rb-detail-card__title">Sesi Client Proofing</h2>
        <p className="rb-detail-card__sub">{session?.package?.name} • Kuota {session?.package?.photo_quota} Foto</p>

        <div className="rb-proofing-admin__link-card">
          <label>Tautan Klien & PIN:</label>
          <div className="rb-proofing-admin__url-box">
            <input type="text" readOnly value={shareUrl} />
            <button onClick={() => navigator.clipboard.writeText(`${shareUrl} (PIN: ${session?.pin})`)}>
              Salin
            </button>
          </div>
          <span className="rb-proofing-admin__pin">PIN Akses: <strong>{session?.pin}</strong></span>
        </div>
      </section>

      <section className="rb-detail-card">
        <div className="rb-detail-card__header">
          <h3 className="rb-detail-card__section-title">
            Foto Dipilih Klien ({selectedPhotos.length})
          </h3>
          {selectedPhotos.length > 0 && (
            <Button size="sm" onClick={copyLightroomList} variant="secondary">
              {copied ? '✓ Tersalin!' : 'Salin ke Lightroom'}
            </Button>
          )}
        </div>

        {selectedPhotos.length === 0 ? (
          <p className="rb-proofing-admin__empty">Klien belum menyelesaikan pemilihan foto.</p>
        ) : (
          <div className="rb-proofing-admin__selected-grid">
            {selectedPhotos.map((p) => (
              <div key={p.id} className="rb-proofing-thumb">
                <img src={p.watermarked_url} alt={p.original_filename} />
                <span>{p.original_filename}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
