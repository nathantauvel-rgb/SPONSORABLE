import { ArrowRight } from 'lucide-react'

interface ButtonProps {
  variant?: 'primary' | 'dark' | 'outline'
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  className?: string
  arrow?: boolean
  fullWidth?: boolean
}

const Button = ({
  variant = 'primary',
  children,
  onClick,
  type = 'button',
  className = '',
  arrow = false,
  fullWidth = false,
}: ButtonProps) => {
  const base = fullWidth ? 'w-full justify-center ' : ''

  if (variant === 'primary') {
    return (
      <button type={type} onClick={onClick} className={`btn-primary ${base}${className}`}>
        {children}
        {arrow && <ArrowRight size={16} className="arrow-icon" />}
      </button>
    )
  }

  if (variant === 'dark') {
    return (
      <button type={type} onClick={onClick} className={`btn-dark ${base}${className}`}>
        {children}
        {arrow && <ArrowRight size={16} className="arrow-icon" />}
      </button>
    )
  }

  return (
    <button type={type} onClick={onClick} className={`btn-outline ${base}${className}`}>
      {children}
      {arrow && <ArrowRight size={16} className="arrow-icon" />}
    </button>
  )
}

export default Button
export { Button }
