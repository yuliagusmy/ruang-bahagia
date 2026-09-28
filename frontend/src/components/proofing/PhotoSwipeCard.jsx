import { useState, useRef } from 'react'
import './PhotoSwipeCard.css'

export default function PhotoSwipeCard({ photo, onSwipeRight, onSwipeLeft }) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const startPos = useRef({ x: 0, y: 0 })

  const handleTouchStart = (e) => {
    setIsDragging(true)
    const touch = e.touches[0]
    startPos.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleTouchMove = (e) => {
    if (!isDragging) return
    const touch = e.touches[0]
    const deltaX = touch.clientX - startPos.current.x
    const deltaY = touch.clientY - startPos.current.y
    setDragOffset({ x: deltaX, y: deltaY * 0.3 })
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    setIsDragging(false)
    if (dragOffset.x > 80) {
      onSwipeRight()
    } else if (dragOffset.x < -80) {
      onSwipeLeft()
    }
    setDragOffset({ x: 0, y: 0 })
  }

  const rotation = dragOffset.x * 0.08
  const opacitySelect = Math.min(Math.max(dragOffset.x / 80, 0), 1)
  const opacitySkip = Math.min(Math.max(-dragOffset.x / 80, 0), 1)

  return (
    <div
      className="rb-swipe-card"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${rotation}deg)`,
        transition: isDragging ? 'none' : 'transform 0.25s ease',
      }}
    >
      <div
        className="rb-swipe-badge rb-swipe-badge--select"
        style={{ opacity: opacitySelect }}
      >
        PILIH
      </div>
      <div
        className="rb-swipe-badge rb-swipe-badge--skip"
        style={{ opacity: opacitySkip }}
      >
        LEWATI
      </div>

      <img
        src={photo.watermarked_url || photo.file_url}
        alt={photo.filename || 'Foto'}
        className="rb-swipe-card__img"
        draggable="false"
      />
      <div className="rb-swipe-card__meta">
        <span className="rb-swipe-card__filename">{photo.original_filename || photo.filename}</span>
      </div>
    </div>
  )
}
