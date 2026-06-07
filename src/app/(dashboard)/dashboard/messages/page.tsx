'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import { Mail, MailOpen, Building2 } from 'lucide-react'
import { BG, SURFACE, CARD, ACCENT, TEXT, MUTED, BORDER, SYNE, DISPLAY } from '@/lib/ds'

type Message = {
  id: string
  company: string
  budget: string
  type: string
  message: string
  read: boolean
  createdAt: string
}

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  return `il y a ${days}j`
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Message | null>(null)

  useEffect(() => {
    fetch('/api/messages')
      .then(r => r.ok ? r.json() : { messages: [] })
      .then(data => { setMessages(data.messages ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const markRead = async (msg: Message) => {
    if (!msg.read) {
      await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: msg.id, read: true }),
      }).catch(() => {})
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m))
    }
    setSelected({ ...msg, read: true })
  }

  const unread = messages.filter(m => !m.read).length

  return (
    <div style={{ background: BG, minHeight: '100vh' }}>
      <Sidebar />
      <main className="dash-main" style={{ marginLeft: '240px', padding: '40px 48px' }}>

        {/* En-tête */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: TEXT, letterSpacing: '-0.02em', fontFamily: DISPLAY }}>Messages</h1>
            {unread > 0 && (
              <span style={{
                background: ACCENT,
                color: BG,
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '9999px',
                padding: '2px 10px',
                fontFamily: SYNE,
              }}>
                {unread} nouveau{unread > 1 ? 'x' : ''}
              </span>
            )}
          </div>
          <p style={{ fontSize: '14px', color: MUTED, fontFamily: SYNE }}>Propositions de partenariat reçues via ton media kit</p>
        </div>

        {loading ? (
          <p style={{ color: MUTED, fontSize: '14px', fontFamily: SYNE }}>Chargement...</p>
        ) : messages.length === 0 ? (
          /* État vide */
          <div style={{ textAlign: 'center', padding: '80px 0', background: SURFACE, borderRadius: '16px', border: `1px solid ${BORDER}` }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: `${ACCENT}14`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', color: ACCENT,
            }}>
              <Mail size={24} />
            </div>
            <p style={{ fontSize: '16px', fontWeight: 600, color: MUTED, marginBottom: '6px', fontFamily: SYNE }}>Aucun message pour l&apos;instant</p>
            <p style={{ fontSize: '14px', color: MUTED, fontFamily: SYNE }}>Les marques qui remplissent le formulaire sur ton media kit apparaîtront ici</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: selected ? '380px 1fr' : '1fr', gap: '20px', alignItems: 'start' }}>

            {/* Liste des messages */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {messages.map(msg => (
                <button
                  key={msg.id}
                  onClick={() => markRead(msg)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '16px 20px', borderRadius: '12px',
                    border: `1px solid ${selected?.id === msg.id ? ACCENT : BORDER}`,
                    background: selected?.id === msg.id ? CARD : SURFACE,
                    cursor: 'pointer', transition: 'all 150ms',
                    fontFamily: SYNE,
                  }}
                  onMouseEnter={e => {
                    if (selected?.id !== msg.id) {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (selected?.id !== msg.id) {
                      (e.currentTarget as HTMLButtonElement).style.background = SURFACE
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {!msg.read && (
                        <span style={{
                          width: '8px', height: '8px', borderRadius: '50%',
                          background: ACCENT, flexShrink: 0, display: 'inline-block',
                        }} />
                      )}
                      <span style={{ fontSize: '14px', fontWeight: msg.read ? 500 : 700, color: TEXT, fontFamily: SYNE }}>{msg.company}</span>
                    </div>
                    <span style={{ fontSize: '11px', color: MUTED, fontFamily: SYNE }}>{timeAgo(msg.createdAt)}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: MUTED, margin: 0, fontFamily: SYNE }}>{msg.type} · {msg.budget}</p>
                  <p style={{ fontSize: '12px', color: MUTED, margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: SYNE }}>{msg.message}</p>
                </button>
              ))}
            </div>

            {/* Panneau détail */}
            {selected && (
              <div style={{
                background: CARD,
                border: `1px solid ${BORDER}`,
                borderRadius: '16px', padding: '28px',
                position: 'sticky', top: '24px',
              }}>
                {/* Header société */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: `${ACCENT}14`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: ACCENT, flexShrink: 0,
                  }}>
                    <Building2 size={20} />
                  </div>
                  <div>
                    <p style={{ fontSize: '16px', fontWeight: 700, color: TEXT, margin: 0, fontFamily: SYNE }}>{selected.company}</p>
                    <p style={{ fontSize: '12px', color: MUTED, margin: 0, fontFamily: SYNE }}>{timeAgo(selected.createdAt)}</p>
                  </div>
                  <MailOpen size={16} style={{ marginLeft: 'auto', color: ACCENT }} />
                </div>

                {/* Badges budget / type */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '12px', fontWeight: 600, padding: '4px 12px',
                    borderRadius: '9999px',
                    background: `${ACCENT}14`,
                    color: ACCENT,
                    border: `1px solid ${ACCENT}33`,
                    fontFamily: SYNE,
                  }}>{selected.budget}</span>
                  <span style={{
                    fontSize: '12px', fontWeight: 600, padding: '4px 12px',
                    borderRadius: '9999px',
                    background: 'rgba(255,255,255,0.06)',
                    color: MUTED,
                    border: `1px solid ${BORDER}`,
                    fontFamily: SYNE,
                  }}>{selected.type}</span>
                </div>

                {/* Corps du message */}
                <div style={{ background: SURFACE, borderRadius: '10px', padding: '16px', marginBottom: '20px', border: `1px solid ${BORDER}` }}>
                  <p style={{ fontSize: '14px', color: TEXT, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap', fontFamily: SYNE }}>{selected.message}</p>
                </div>

                {/* CTA répondre */}
                <a
                  href={`mailto:?subject=Re: Partenariat ${selected.company}&body=${encodeURIComponent(`Bonjour,\n\nMerci pour votre proposition de partenariat...\n`)}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '10px 20px', borderRadius: '10px',
                    background: ACCENT, color: BG,
                    fontSize: '14px', fontWeight: 600,
                    textDecoration: 'none', fontFamily: SYNE,
                  }}
                >
                  Répondre par email
                </a>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
