'use client'

import { useRef, useState, useEffect } from 'react'
import { useCountUp } from '@/hooks/useCountUp'

interface StatCardProps {
  target: number
  suffix?: string
  prefix?: string
  label: string
}

/* Carte stat animée : compteur easeOutQuart + barre de progression + halo vert */
export default function StatCard({ target, suffix = '', prefix = '', label }: StatCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [triggered, setTriggered] = useState(false)
  const value = useCountUp(target, 1500, triggered)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) { setTriggered(true); return }
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setTriggered(true); obs.disconnect() } },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{
        background: '#1c1f26',
        border: '0.5px solid #222222',
        borderRadius: '8px',
        padding: '16px 20px 20px',
        position: 'relative',
        overflow: 'hidden',
        /* Halo vert qui pulse en continu dès que le compteur démarre */
        boxShadow: triggered
          ? '0 0 0 0 rgba(34,197,94,0.27)'
          : 'none',
        animation: triggered ? 'haloGlow 2s ease-in-out infinite' : 'none',
      }}
    >
      {/* Chiffre animé — Martian Mono (chiffres métriques) */}
      <p style={{
        fontFamily: '"Martian Mono", var(--font-num), ui-monospace, monospace',
        fontSize: '26px',
        fontWeight: 600,
        color: '#ffffff',
        letterSpacing: '-0.02em',
        lineHeight: 1.1,
        marginBottom: '6px',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {prefix}{value}{suffix}
      </p>

      {/* Label */}
      <p style={{
        fontSize: '12px',
        color: '#555555',
        lineHeight: 1.5,
        fontFamily: '"Syne", system-ui, sans-serif',
      }}>
        {label}
      </p>

      {/* Barre de progression qui se trace en 800ms */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'rgba(255,255,255,0.04)',
      }}>
        <div style={{
          height: '100%',
          width: triggered ? '100%' : '0%',
          background: '#22c55e',
          borderRadius: '1px',
          transition: triggered ? 'width 800ms cubic-bezier(0.22,1,0.36,1) 200ms' : 'none',
        }} />
      </div>
    </div>
  )
}
