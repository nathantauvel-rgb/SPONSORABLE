interface AvatarProps {
  initials: string
  size?: number
  className?: string
}

const Avatar = ({ initials, size = 40, className = '' }: AvatarProps) => (
  <div
    className={`flex items-center justify-center rounded-full font-semibold text-white flex-shrink-0 ${className}`}
    style={{
      width: size,
      height: size,
      background: '#16a34a',
      fontSize: size * 0.35,
      letterSpacing: '0.02em',
    }}
  >
    {initials}
  </div>
)

export default Avatar
