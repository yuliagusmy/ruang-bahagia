import './Skeleton.css'

/**
 * Skeleton — placeholder animasi shimmer saat data dimuat
 */
export default function Skeleton({
  variant = 'text', // text | card | avatar | button | block
  width,
  height,
  className = '',
  style = {},
}) {
  return (
    <div
      className={`rb-skeleton rb-skeleton--${variant} ${className}`}
      style={{
        width: width || undefined,
        height: height || undefined,
        ...style,
      }}
      aria-hidden="true"
    />
  )
}
