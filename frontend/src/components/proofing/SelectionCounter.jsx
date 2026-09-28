import './SelectionCounter.css'

export default function SelectionCounter({ selectedCount, quota }) {
  const percentage = Math.min((selectedCount / (quota || 1)) * 100, 100)
  const isFull = selectedCount >= quota

  return (
    <div className="rb-selection-counter">
      <div className="rb-selection-counter__header">
        <span className="rb-selection-counter__label">Foto Terpilih</span>
        <span className={`rb-selection-counter__val ${isFull ? 'rb-selection-counter__val--full' : ''}`}>
          {selectedCount} / {quota}
        </span>
      </div>
      <div className="rb-selection-counter__track">
        <div
          className="rb-selection-counter__progress"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
