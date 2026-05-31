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

/* Wrapper de révélation : fade + rise discret au scroll. */
export default function Reveal({
  children,
  delay = 0,
  style,
  className,
}: {
  children: ReactNode
  delay?: number
  style?: CSSProperties
  className?: string
}) {
  const { ref, inView } = useInView<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity 450ms cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 450ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
