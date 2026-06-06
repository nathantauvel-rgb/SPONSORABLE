'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getConsent, setConsent } from '@/lib/consent'

// Bandeau de consentement cookies conforme CNIL :
// - n'apparaît que si aucun choix n'a encore été fait
// - "Accepter" et "Refuser" ont le MÊME poids visuel (refus aussi simple que l'accord)
// - aucun traceur non essentiel ne se déclenche avant un consentement explicite
export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (getConsent() === null) setVisible(true)
  }, [])

  if (!visible) return null

  const choose = (value: 'accepted' | 'refused') => {
    setConsent(value)
    setVisible(false)
  }

  const btn: React.CSSProperties = {
    flex: '1 1 0',
    padding: '10px 18px',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    background: '#ffffff',
    color: '#0f172a',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    minWidth: '120px',
  }

  return (
    <div
      role="dialog"
      aria-label="Consentement aux cookies"
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '16px',
        right: '16px',
        maxWidth: '720px',
        margin: '0 auto',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.18)',
        padding: '20px 22px',
        zIndex: 9999,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <p style={{ margin: '0 0 14px', fontSize: '14px', lineHeight: 1.6, color: '#334155' }}>
        On utilise des cookies de mesure d'audience pour comprendre le trafic de ton media kit.
        Tu peux accepter ou refuser. Les cookies nécessaires au fonctionnement du site restent actifs.{' '}
        <Link href="/confidentialite" style={{ color: '#16a34a', fontWeight: 600 }}>
          En savoir plus
        </Link>
        .
      </p>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button style={btn} onClick={() => choose('refused')}>Refuser</button>
        <button style={btn} onClick={() => choose('accepted')}>Accepter</button>
      </div>
    </div>
  )
}
