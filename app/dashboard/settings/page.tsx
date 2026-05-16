'use client'

import { Bell, ChevronRight, Globe, Lock, Shield, Trash2, User, Zap } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/layout/Sidebar'

const loadPlan = () => { try { return localStorage.getItem('sponsorable_plan') || 'free' } catch { return 'free' } }

const loadProfile = () => {
  try {
    const saved = localStorage.getItem('sponsorable_profile')
    if (!saved) return { pseudo: 'AlexPlays', email: 'alex@alexplays.fr', bio: '', niche: 'Gaming · Minecraft · FPS' }
    const p = JSON.parse(saved)
    return {
      pseudo: p.pseudo || 'AlexPlays',
      email: p.email || 'alex@alexplays.fr',
      bio: p.bio || '',
      niche: p.niche || 'Gaming · Minecraft · FPS',
    }
  } catch {
    return { pseudo: 'AlexPlays', email: 'alex@alexplays.fr', bio: '', niche: 'Gaming · Minecraft · FPS' }
  }
}

const SectionCard = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
    {children}
  </div>
)

const SectionHeader = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '12px' }}>
    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(22,163,74,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', flexShrink: 0 }}>
      {icon}
    </div>
    <div>
      <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{title}</p>
      <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '1px' }}>{desc}</p>
    </div>
  </div>
)

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
  <button
    onClick={() => onChange(!checked)}
    style={{
      width: '42px', height: '24px', borderRadius: '9999px', border: 'none', cursor: 'pointer',
      background: checked ? '#16a34a' : '#e2e8f0',
      position: 'relative', transition: 'background 200ms ease', flexShrink: 0,
    }}
  >
    <span style={{
      position: 'absolute', top: '3px',
      left: checked ? '21px' : '3px',
      width: '18px', height: '18px', borderRadius: '50%',
      background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      transition: 'left 200ms ease',
      display: 'block',
    }} />
  </button>
)

export default function SettingsPage() {
  const profile = loadProfile()
  const searchParams = useSearchParams()

  const [pseudo, setPseudo] = useState(profile.pseudo)
  const [email, setEmail] = useState(profile.email)
  const [bio, setBio] = useState(profile.bio)
  const [niche, setNiche] = useState(profile.niche)

  const [currentPlan, setCurrentPlan] = useState(loadPlan)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')

  const handleCheckout = async () => {
    setCheckoutLoading(true)
    setCheckoutError('')
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setCheckoutError(data.error || 'Erreur lors de la création du paiement')
      }
    } catch {
      setCheckoutError('Impossible de joindre le serveur de paiement')
    } finally {
      setCheckoutLoading(false)
    }
  }

  const planRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.location.hash === '#plan') {
      setTimeout(() => {
        planRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [])

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      localStorage.setItem('sponsorable_plan', 'pro')
      setCurrentPlan('pro')
      setTimeout(() => {
        planRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [searchParams])

  const [notifNewMessage, setNotifNewMessage] = useState(true)
  const [notifWeeklyReport, setNotifWeeklyReport] = useState(true)
  const [notifTips, setNotifTips] = useState(false)

  const [pagePublic, setPagePublic] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')

  const [saved, setSaved] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSaveProfile = () => {
    try {
      const existing = localStorage.getItem('sponsorable_profile')
      const base = existing ? JSON.parse(existing) : {}
      localStorage.setItem('sponsorable_profile', JSON.stringify({ ...base, pseudo, email, bio, niche }))
    } catch {}
    setSaved(true)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => setSaved(false), 2500)
  }

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current) }, [])

  const inputStyle = {
    width: '100%', padding: '10px 14px', fontSize: '14px', color: '#0f172a',
    border: '1px solid rgba(0,0,0,0.12)', borderRadius: '10px', outline: 'none',
    boxSizing: 'border-box' as const, background: '#fafafa', transition: 'border 150ms',
  }

  const labelStyle = { fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px', display: 'block', letterSpacing: '0.03em', textTransform: 'uppercase' as const }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ marginLeft: '240px', padding: '40px 48px', maxWidth: '800px' }}>

        <div style={{ marginBottom: '36px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>Paramètres</h1>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>Gère ton compte, ta page publique et tes préférences</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <SectionCard>
            <SectionHeader icon={<User size={16} />} title="Profil" desc="Informations affichées sur ton media kit" />
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Pseudo</label>
                  <input
                    style={inputStyle}
                    value={pseudo}
                    onChange={e => setPseudo(e.target.value)}
                    onFocus={e => (e.target.style.border = '1px solid #16a34a')}
                    onBlur={e => (e.target.style.border = '1px solid rgba(0,0,0,0.12)')}
                    placeholder="Ton pseudo"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Niche</label>
                  <input
                    style={inputStyle}
                    value={niche}
                    onChange={e => setNiche(e.target.value)}
                    onFocus={e => (e.target.style.border = '1px solid #16a34a')}
                    onBlur={e => (e.target.style.border = '1px solid rgba(0,0,0,0.12)')}
                    placeholder="Gaming · Minecraft · FPS"
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Email de contact</label>
                <input
                  style={inputStyle}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={e => (e.target.style.border = '1px solid #16a34a')}
                  onBlur={e => (e.target.style.border = '1px solid rgba(0,0,0,0.12)')}
                  placeholder="ton@email.com"
                  type="email"
                />
              </div>
              <div>
                <label style={labelStyle}>Bio courte</label>
                <textarea
                  style={{ ...inputStyle, resize: 'vertical', minHeight: '80px', fontFamily: 'inherit', lineHeight: '1.5' }}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  onFocus={e => (e.target.style.border = '1px solid #16a34a')}
                  onBlur={e => (e.target.style.border = '1px solid rgba(0,0,0,0.12)')}
                  placeholder="Décris-toi en 1-2 phrases pour les marques..."
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>Ces infos sont aussi modifiables depuis l'éditeur media kit</p>
                <button
                  onClick={handleSaveProfile}
                  style={{
                    padding: '10px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                    fontSize: '14px', fontWeight: 600,
                    background: saved ? '#dcfce7' : '#16a34a',
                    color: saved ? '#16a34a' : 'white',
                    transition: 'all 200ms ease',
                  }}
                >
                  {saved ? '✓ Sauvegardé' : 'Sauvegarder'}
                </button>
              </div>
            </div>
          </SectionCard>

          <div ref={planRef} id="plan">
          <SectionCard>
            <SectionHeader icon={<Shield size={16} />} title="Mon plan" desc="Abonnement actuel et fonctionnalités" />
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(22,163,74,0.05)', border: '1px solid rgba(22,163,74,0.15)', borderRadius: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#16a34a' }} />
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Plan {currentPlan === 'pro' ? 'Pro' : 'Gratuit'}</p>
                    <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '1px' }}>
                      {currentPlan === 'pro'
                        ? 'Toutes les plateformes · Templates · Analytics · PDF · Calendly'
                        : '1 plateforme · Template par défaut · Pas d\'accès aux stats'}
                    </p>
                  </div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a', background: 'rgba(22,163,74,0.1)', padding: '4px 10px', borderRadius: '9999px' }}>Actif</span>
              </div>

              <div style={{ marginBottom: '16px', padding: '10px 14px', background: '#fffbeb', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '12px', color: '#92400e' }}>🧪 Mode démo — simule le plan pour tester l'app</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => { setCurrentPlan('free'); localStorage.setItem('sponsorable_plan', 'free') }} style={{ padding: '5px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, background: currentPlan === 'free' ? '#0f172a' : '#f1f5f9', color: currentPlan === 'free' ? 'white' : '#64748b' }}>Gratuit</button>
                  <button onClick={() => { setCurrentPlan('pro'); localStorage.setItem('sponsorable_plan', 'pro') }} style={{ padding: '5px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, background: currentPlan === 'pro' ? '#16a34a' : '#f1f5f9', color: currentPlan === 'pro' ? 'white' : '#64748b' }}>Pro</button>
                </div>
              </div>

              {currentPlan !== 'pro' && (
                <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: '14px', padding: '24px', color: 'white' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Zap size={16} color="#4ade80" />
                    <p style={{ fontSize: '15px', fontWeight: 700 }}>Plan Pro — 19€/mois</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
                    {[
                      'YouTube + Twitch + TikTok + Instagram',
                      'Tous les templates de design',
                      'Import photo de profil automatique',
                      'Page sans watermark Sponsorable',
                      'Statistiques & analytics complètes',
                      'Bannière personnalisée',
                      'Réorganisation des blocs',
                      'Intégration Calendly',
                      'Export PDF proposition commerciale',
                      'Notifications de visite',
                      'Tarifs cachés sur demande',
                    ].map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ color: '#4ade80', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>✓</span>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)' }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', cursor: checkoutLoading ? 'wait' : 'pointer', background: checkoutLoading ? '#15803d' : '#16a34a', color: 'white', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 150ms', opacity: checkoutLoading ? 0.8 : 1 }}
                  >
                    {checkoutLoading ? (
                      <>
                        <span style={{ width: '15px', height: '15px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                        Redirection vers Stripe…
                      </>
                    ) : (
                      <><Zap size={15} /> Passer au Pro — 19€/mois</>
                    )}
                  </button>
                  {checkoutError && (
                    <p style={{ textAlign: 'center', fontSize: '12px', color: '#fca5a5', marginTop: '8px' }}>⚠️ {checkoutError}</p>
                  )}
                  <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '10px' }}>Sans engagement · Annulable à tout moment · Paiement sécurisé Stripe</p>
                </div>
              )}
            </div>
          </SectionCard>
          </div>

          <SectionCard>
            <SectionHeader icon={<Globe size={16} />} title="Page publique" desc="Visibilité et lien de ton media kit" />
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>Page visible publiquement</p>
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Les marques peuvent accéder à ton media kit via le lien</p>
                </div>
                <Toggle checked={pagePublic} onChange={setPagePublic} />
              </div>
              <div style={{ padding: '14px 0' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#475569', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: '8px' }}>Lien public</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ flex: 1, padding: '10px 14px', background: '#f1f5f9', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '10px', fontSize: '13px', color: '#475569', fontFamily: 'monospace' }}>
                    sponsorable.gg/<strong style={{ color: '#0f172a' }}>{pseudo.toLowerCase().replace(/\s+/g, '')}</strong>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(`https://sponsorable.gg/${pseudo.toLowerCase().replace(/\s+/g, '')}`)}
                    style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', background: 'white', fontSize: '13px', fontWeight: 500, color: '#475569', whiteSpace: 'nowrap' }}
                  >
                    Copier
                  </button>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard>
            <SectionHeader icon={<Bell size={16} />} title="Notifications" desc="Emails que tu reçois de Sponsorable" />
            <div style={{ padding: '0 24px' }}>
              {[
                { label: 'Nouveau message d\'une marque', desc: 'Quand une marque t\'envoie un message via ton media kit', checked: notifNewMessage, set: setNotifNewMessage },
                { label: 'Rapport hebdomadaire', desc: 'Résumé des vues, clics et visites de ta page chaque lundi', checked: notifWeeklyReport, set: setNotifWeeklyReport },
                { label: 'Nouveautés produit', desc: 'Nouveaux templates, nouvelles fonctionnalités et améliorations de la plateforme', checked: notifTips, set: setNotifTips },
              ].map((item, i, arr) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>{item.label}</p>
                    <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{item.desc}</p>
                  </div>
                  <Toggle checked={item.checked} onChange={item.set} />
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard>
            <SectionHeader icon={<Lock size={16} />} title="Sécurité" desc="Mot de passe et authentification" />
            <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>Mot de passe</p>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Dernière modification il y a 3 mois</p>
              </div>
              <button
                style={{ padding: '9px 18px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', background: 'white', fontSize: '13px', fontWeight: 500, color: '#0f172a' }}
              >
                Changer
              </button>
            </div>
          </SectionCard>

          <SectionCard>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}>
                <Trash2 size={16} />
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#ef4444' }}>Zone de danger</p>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '1px' }}>Actions irréversibles sur ton compte</p>
              </div>
            </div>
            <div style={{ padding: '20px 24px' }}>
              {!showDeleteConfirm ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>Supprimer mon compte</p>
                    <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Supprime définitivement ton compte et toutes tes données</p>
                  </div>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    style={{ padding: '9px 18px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', background: 'rgba(239,68,68,0.05)', fontSize: '13px', fontWeight: 600, color: '#ef4444' }}
                  >
                    Supprimer
                  </button>
                </div>
              ) : (
                <div style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '12px', padding: '20px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>Tu es sûr·e ?</p>
                  <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px' }}>
                    Cette action est <strong>irréversible</strong>. Tape ton pseudo <strong>{pseudo}</strong> pour confirmer.
                  </p>
                  <input
                    style={{ ...inputStyle, marginBottom: '14px' }}
                    value={deleteInput}
                    onChange={e => setDeleteInput(e.target.value)}
                    placeholder={`Tape "${pseudo}" pour confirmer`}
                    onFocus={e => (e.target.style.border = '1px solid #ef4444')}
                    onBlur={e => (e.target.style.border = '1px solid rgba(0,0,0,0.12)')}
                  />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => { setShowDeleteConfirm(false); setDeleteInput('') }}
                      style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', background: 'white', fontSize: '13px', fontWeight: 500, color: '#475569' }}
                    >
                      Annuler
                    </button>
                    <button
                      disabled={deleteInput !== pseudo}
                      style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: deleteInput === pseudo ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: 600, background: deleteInput === pseudo ? '#ef4444' : '#fecaca', color: 'white', transition: 'background 200ms' }}
                    >
                      Supprimer définitivement
                    </button>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#cbd5e1', marginTop: '40px', marginBottom: '20px' }}>
          Sponsorable v1.0 · Fait avec ❤️ pour les créateurs FR
        </p>

      </main>
    </div>
  )
}
