import { CSSProperties, ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  style?: CSSProperties
  className?: string
}

const Card = ({ children, style, className = '' }: CardProps) => (
  <div className={`card-standard ${className}`} style={style}>
    {children}
  </div>
)

export default Card
