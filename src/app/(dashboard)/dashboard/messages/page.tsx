'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import { Mail, MailOpen, Building2 } from 'lucide-react'

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
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ marginLeft: '240px', padding: '40px 48px' }}>

        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>Messages</h1>
            {unread > 0 && (
              <span style={{ background: '#16a34a', color: 'white', fontSize: '12px', fontWeight: 700, borderRadius: '9999px', padding: '2px 10px' }}>
                {unread} nouveau{unread > 1 ? 'x' : ''}
              </span>
            )}
          </div>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>Propositions de partenariat reçues via ton media kit</p>
        </div>

        {loading ? (
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Chargement...</p>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(22,163,74,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#16a34a' }}>
              <Mail size={24} />
            </div>
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>Aucun message pour l&apos;instant</p>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>Les marques qui remplissent le formulaire sur ton media kit apparaîtront ici</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: selected ? '380px 1fr' : '1fr', gap: '20px', alignItems: 'start' }}>

            {/* Liste */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {messages.map(msg => (
                <button
                  key={msg.id}
                  onClick={() => markRead(msg)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '16px 20px', borderRadius: '12px',
                    border: `1px solid ${selected?.id === msg.id ? '#16a34a' : 'rgba(0,0,0,0.08)'}`,
                    background: selected?.id === msg.id ? 'rgba(22,163,74,0.04)' : 'white',
                    cursor: 'pointer', transition: 'all 150ms',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {!msg.read && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a', flexShrink: 0, display: 'inline-block' }} />}
                      <span style={{ fontSize: '14px', fontWeight: msg.read ? 500 : 700, color: '#0f172a' }}>{msg.company}</span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{timeAgo(msg.createdAt)}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{msg.type} · {msg.budget}</p>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.message}</p>
                </button>
              ))}
            </div>

            {/* Détail */}
            {selected && (
              <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '16px', padding: '28px', position: 'sticky', top: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(22,163,74,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', flexShrink: 0 }}>
                    <Building2 size={20} />
                  </div>
                  <div>
                    <p style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{selected.company}</p>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>{timeAgo(selected.createdAt)}</p>
                  </div>
                  <MailOpen size={16} style={{ marginLeft: 'auto', color: '#94a3b8' }} />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '9999px', background: 'rgba(22,163,74,0.08)', color: '#16a34a', border: '1px solid rgba(22,163,74,0.2)' }}>{selected.budget}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '9999px', background: '#f1f5f9', color: '#475569', border: '1px solid rgba(0,0,0,0.08)' }}>{selected.type}</span>
                </div>

                <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
                  <p style={{ fontSize: '14px', color: '#0f172a', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{selected.message}</p>
                </div>

                <a
                  href={`mailto:?subject=Re: Partenariat ${selected.company}&body=${encodeURIComponent(`Bonjour,\n\nMerci pour votre proposition de partenariat...\n`)}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', background: '#16a34a', color: 'white', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}
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
