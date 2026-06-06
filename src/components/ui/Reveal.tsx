'use client'

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react'

/* Hook : détecte l'entrée dans le viewport (une seule fois).
   En prefers-reduced-motion, considère l'élément visible d'emblée. */
export function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) { setInView(true); return }
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect() } },
      { threshold },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  return { ref, inView }
}

/* Wrapper de révélation : fade + rise (ou slide gauche) au scroll.
   direction='up'   → translateY(24px) → 0   (défaut)
   direction='left' → translateX(-24px) → 0  (slide depuis la gauche) */
export default function Reveal({
  children,
  delay = 0,
  direction = 'up',
  style,
  className,
}: {
  children: ReactNode
  delay?: number
  direction?: 'up' | 'left'
  style?: CSSProperties
  className?: string
}) {
  const { ref, inView } = useInView<HTMLDivElement>()

  const transform = inView
    ? 'translate(0, 0)'
    : direction === 'left'
      ? 'translate(-24px, 0)'
      : 'translate(0, 24px)'

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform,
        transition: `opacity 600ms ease-out ${delay}ms, transform 600ms ease-out ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
