'use client'

import { Bell, ChevronRight, Globe, Lock, Shield, Trash2, User, Zap } from 'lucide-react'
import { useEffect, useRef, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import Sidebar from '@/components/layout/Sidebar'

// Palette dark
const BG = '#0d0d0f'
const SURFACE = '#111318'
const CARD = '#1c1f26'
const ACCENT = '#22c55e'
const TEXT = '#ffffff'
const MUTED = '#888888'
const BORDER = '#222222'
const SYNE = 'var(--font-syne), system-ui, sans-serif'
const DISPLAY = 'var(--font-display), system-ui, sans-serif'

const loadPlan = () => { try { return localStorage.getItem('sponsorable_plan') || 'free' } catch { return 'free' } }

const loadProfile = () => {
  try {
    const saved = localStorage.getItem('sponsorable_profile')
    if (!saved) return { pseudo: '', email: '', bio: '', niche: '' }
    const p = JSON.parse(saved)
    return {
      pseudo: p.pseudo || '',
      email: p.email || '',
      bio: p.bio || '',
      niche: p.niche || '',
    }
  } catch {
    return { pseudo: '', email: '', bio: '', niche: '' }
  }
}

const SectionCard = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '16px', overflow: 'hidden' }}>
    {children}
  </div>
)

const SectionHeader = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div style={{ padding: '20px 24px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(29,170,80,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ACCENT, flexShrink: 0 }}>
      {icon}
    </div>
    <div>
      <p style={{ fontSize: '14px', fontWeight: 600, color: TEXT }}>{title}</p>
      <p style={{ fontSize: '12px', color: MUTED, marginTop: '1px' }}>{desc}</p>
    </div>
  </div>
)

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
  <button
    onClick={() => onChange(!checked)}
    style={{
      width: '42px', height: '24px', borderRadius: '9999px', border: 'none', cursor: 'pointer',
      background: checked ? ACCENT : BORDER,
      position: 'relative', transition: 'background 200ms ease', flexShrink: 0,
    }}
  >
    <span style={{
      position: 'absolute', top: '3px',
      left: checked ? '21px' : '3px',
      width: '18px', height: '18px', borderRadius: '50%',
      background: checked ? BG : MUTED,
      boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
      transition: 'left 200ms ease',
      display: 'block',
    }} />
  </button>
)

function SettingsContent() {
  const profile = loadProfile()
  const searchParams = useSearchParams()

  const [pseudo, setPseudo] = useState(profile.pseudo)
  const [email, setEmail] = useState(profile.email)
  const [bio, setBio] = useState(profile.bio)
  const [niche, setNiche] = useState(profile.niche)

  const [currentPlan, setCurrentPlan] = useState(loadPlan)
  const [isPaid, setIsPaid] = useState(false)
  const [inTrial, setInTrial] = useState(false)
  const [trialDaysLeft, setTrialDaysLeft] = useState(0)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [planLoading, setPlanLoading] = useState(true)

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

  const [portalLoading, setPortalLoading] = useState(false)

  const handlePortal = async () => {
    setPortalLoading(true)
    setCheckoutError('')
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setCheckoutError(data.error || "Impossible d'ouvrir le portail de facturation")
      }
    } catch {
      setCheckoutError('Impossible de joindre le serveur de paiement')
    } finally {
      setPortalLoading(false)
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

  // Charger le plan réel depuis la DB
  useEffect(() => {
    fetch('/api/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setCurrentPlan(data.isPro ? 'pro' : 'free')
          setIsPaid(!!data.isPaid)
          setInTrial(!!data.inTrial)
          setTrialDaysLeft(data.trialDaysLeft ?? 0)
        }
      })
      .catch(() => {})
      .finally(() => setPlanLoading(false))
  }, [])

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      // Stripe vient de confirmer le paiement — on recharge depuis la DB après quelques secondes
      // (le webhook peut prendre un peu de temps)
      setTimeout(() => {
        fetch('/api/me')
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data?.isPro) setCurrentPlan('pro')
            if (data?.isPaid) { setIsPaid(true); setInTrial(false) }
          }).catch(() => {})
      }, 2000)
      setTimeout(() => {
        planRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [searchParams])

  const [notifNewMessage, setNotifNewMessage] = useState(true)
  const [notifWeeklyReport, setNotifWeeklyReport] = useState(true)
  const [notifTips, setNotifTips] = useState(false)
  const [notifSaving, setNotifSaving] = useState(false)

  // Changement de mot de passe
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdError, setPwdError] = useState('')
  const [pwdSuccess, setPwdSuccess] = useState(false)
  const [pwdLoading, setPwdLoading] = useState(false)
  const [hasPassword, setHasPassword] = useState(false)

  const [pagePublic, setPagePublic] = useState(true)
  const [publicSlug, setPublicSlug] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

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

  // Charger isPublic + slug depuis la DB
  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.profile) {
          setPagePublic(data.profile.isPublic ?? true)
          setPublicSlug(data.profile.slug ?? '')
        }
      }).catch(() => {})
  }, [])

  // Charger les préférences de notification
  useEffect(() => {
    fetch('/api/notifications')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.prefs) {
          setNotifNewMessage(data.prefs.notifNewMessage ?? true)
          setNotifWeeklyReport(data.prefs.notifWeeklyReport ?? true)
          setNotifTips(data.prefs.notifProductUpdates ?? false)
        }
      }).catch(() => {})
  }, [])

  // Détecter si l'user a un mot de passe (compte Sponsorable)
  useEffect(() => {
    fetch('/api/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.hasPassword !== undefined) setHasPassword(data.hasPassword) })
      .catch(() => {})
  }, [])

  const handleTogglePublic = async (val: boolean) => {
    setPagePublic(val)
    try {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: publicSlug || pseudo.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'me', isPublic: val }),
      })
    } catch {}
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', fontSize: '14px', color: TEXT,
    border: `1px solid ${BORDER}`, borderRadius: '10px', outline: 'none',
    boxSizing: 'border-box' as const, background: CARD, transition: 'border 150ms',
  }

  const labelStyle = { fontSize: '12px', fontWeight: 600, color: MUTED, marginBottom: '6px', display: 'block', letterSpacing: '0.03em', textTransform: 'uppercase' as const }

  return (
    <div style={{ background: BG, minHeight: '100vh' }}>
      <Sidebar />
      <main className="dash-main" style={{ marginLeft: '240px', padding: '40px 48px', maxWidth: '800px' }}>

        <div style={{ marginBottom: '36px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: TEXT, marginBottom: '6px', letterSpacing: '-0.02em', fontFamily: DISPLAY }}>Paramètres</h1>
          <p style={{ fontSize: '14px', color: MUTED }}>Gère ton compte, ta page publique et tes préférences</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Section Profil */}
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
                    onFocus={e => (e.target.style.border = `1px solid ${ACCENT}`)}
                    onBlur={e => (e.target.style.border = `1px solid ${BORDER}`)}
                    placeholder="Ton pseudo"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Niche</label>
                  <input
                    style={inputStyle}
                    value={niche}
                    onChange={e => setNiche(e.target.value)}
                    onFocus={e => (e.target.style.border = `1px solid ${ACCENT}`)}
                    onBlur={e => (e.target.style.border = `1px solid ${BORDER}`)}
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
                  onFocus={e => (e.target.style.border = `1px solid ${ACCENT}`)}
                  onBlur={e => (e.target.style.border = `1px solid ${BORDER}`)}
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
                  onFocus={e => (e.target.style.border = `1px solid ${ACCENT}`)}
                  onBlur={e => (e.target.style.border = `1px solid ${BORDER}`)}
                  placeholder="Décris-toi en 1-2 phrases pour les marques..."
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '12px', color: MUTED }}>Ces infos sont aussi modifiables depuis l'éditeur media kit</p>
                <button
                  onClick={handleSaveProfile}
                  style={{
                    padding: '10px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                    fontSize: '14px', fontWeight: 600,
                    background: saved ? 'rgba(29,170,80,0.15)' : ACCENT,
                    color: saved ? ACCENT : BG,
                    transition: 'all 200ms ease',
                  }}
                >
                  {saved ? '✓ Sauvegardé' : 'Sauvegarder'}
                </button>
              </div>
            </div>
          </SectionCard>

          {/* Section Plan */}
          <div ref={planRef} id="plan">
          <SectionCard>
            <SectionHeader icon={<Shield size={16} />} title="Mon plan" desc="Abonnement actuel et fonctionnalités" />
            <div style={{ padding: '20px 24px' }}>
              {planLoading ? (
                <div aria-hidden style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ height: '64px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', opacity: 0.5 }} />
                  <div style={{ height: '180px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: '14px', opacity: 0.5 }} />
                </div>
              ) : (
              <>
              {/* Carte plan actuel */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: CARD, border: `1px solid ${ACCENT}`, borderRadius: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: ACCENT }} />
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT }}>
                      {inTrial ? 'Pro — Essai gratuit' : currentPlan === 'pro' ? 'Plan Pro' : 'Plan Gratuit'}
                    </p>
                    <p style={{ fontSize: '12px', color: MUTED, marginTop: '1px' }}>
                      {inTrial
                        ? `Il te reste ${trialDaysLeft} jour${trialDaysLeft > 1 ? 's' : ''} d'essai — toutes les fonctions Pro débloquées`
                        : currentPlan === 'pro'
                        ? 'Toutes les plateformes · Templates · Analytics · PDF · Calendly'
                        : '1 plateforme · Template par défaut · Pas d\'accès aux stats'}
                    </p>
                  </div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: ACCENT, background: 'rgba(29,170,80,0.12)', padding: '4px 10px', borderRadius: '9999px' }}>
                  {inTrial ? 'Essai' : currentPlan === 'pro' ? 'Actif' : 'Gratuit'}
                </span>
              </div>

              {/* Abonné payant : gérer son abonnement via le portail Stripe */}
              {isPaid && (
                <>
                  <button
                    onClick={handlePortal}
                    disabled={portalLoading}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${BORDER}`, cursor: portalLoading ? 'wait' : 'pointer', background: CARD, color: TEXT, fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: portalLoading ? 0.8 : 1 }}
                  >
                    {portalLoading ? 'Ouverture…' : 'Gérer mon abonnement'}
                  </button>
                  <p style={{ textAlign: 'center', fontSize: '11px', color: MUTED, marginTop: '10px' }}>
                    Annuler, changer de carte ou consulter tes factures via Stripe.
                  </p>
                  {checkoutError && (
                    <p style={{ textAlign: 'center', fontSize: '12px', color: '#fca5a5', marginTop: '8px' }}>⚠️ {checkoutError}</p>
                  )}
                </>
              )}

              {!isPaid && (
                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '24px', color: TEXT }}>
                  {inTrial && (
                    <div style={{ marginBottom: '16px', padding: '10px 14px', background: 'rgba(29,170,80,0.08)', border: `1px solid ${ACCENT}`, borderRadius: '10px' }}>
                      <p style={{ fontSize: '12px', color: ACCENT, fontWeight: 600 }}>
                        🎁 Tu profites de l&apos;essai Pro gratuit — {trialDaysLeft} jour{trialDaysLeft > 1 ? 's' : ''} restant{trialDaysLeft > 1 ? 's' : ''}. Abonne-toi pour ne pas perdre l&apos;accès.
                      </p>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Zap size={16} color={ACCENT} />
                    <p style={{ fontSize: '15px', fontWeight: 700, fontFamily: SYNE }}>Plan Pro — 19€/mois</p>
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
                        <span style={{ color: ACCENT, fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>✓</span>
                        <span style={{ fontSize: '12px', color: MUTED }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', cursor: checkoutLoading ? 'wait' : 'pointer', background: checkoutLoading ? 'rgba(29,170,80,0.7)' : ACCENT, color: BG, fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 150ms', opacity: checkoutLoading ? 0.8 : 1 }}
                  >
                    {checkoutLoading ? (
                      <>
                        <span style={{ width: '15px', height: '15px', border: `2px solid rgba(0,0,0,0.2)`, borderTopColor: BG, borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                        Redirection vers Stripe…
                      </>
                    ) : (
                      <><Zap size={15} /> Passer au Pro — 19€/mois</>
                    )}
                  </button>
                  {checkoutError && (
                    <p style={{ textAlign: 'center', fontSize: '12px', color: '#fca5a5', marginTop: '8px' }}>⚠️ {checkoutError}</p>
                  )}
                  <p style={{ textAlign: 'center', fontSize: '11px', color: MUTED, marginTop: '10px' }}>Sans engagement · Annulable à tout moment · Paiement sécurisé Stripe</p>
                </div>
              )}
              </>
              )}
            </div>
          </SectionCard>
          </div>

          {/* Section Page publique */}
          <SectionCard>
            <SectionHeader icon={<Globe size={16} />} title="Page publique" desc="Visibilité et lien de ton media kit" />
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: `1px solid ${BORDER}` }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: TEXT }}>Page visible publiquement</p>
                  <p style={{ fontSize: '12px', color: MUTED, marginTop: '2px' }}>Les marques peuvent accéder à ton media kit via le lien</p>
                </div>
                <Toggle checked={pagePublic} onChange={handleTogglePublic} />
              </div>
              <div style={{ padding: '14px 0' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: MUTED, letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: '8px' }}>Lien public</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ flex: 1, padding: '10px 14px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', fontSize: '13px', color: MUTED, fontFamily: 'monospace' }}>
                    sponsorable.fr/<strong style={{ color: TEXT }}>{publicSlug || pseudo.toLowerCase().replace(/\s+/g, '-')}</strong>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(`https://sponsorable.fr/${publicSlug || pseudo.toLowerCase().replace(/\s+/g, '-')}`)}
                    style={{ padding: '10px 16px', borderRadius: '10px', border: `1px solid ${BORDER}`, cursor: 'pointer', background: CARD, fontSize: '13px', fontWeight: 500, color: TEXT, whiteSpace: 'nowrap' }}
                  >
                    Copier
                  </button>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Section Notifications */}
          <SectionCard>
            <SectionHeader icon={<Bell size={16} />} title="Notifications" desc="Emails que tu reçois de Sponsorable" />
            <div style={{ padding: '0 24px' }}>
              {[
                { key: 'notifNewMessage' as const, label: 'Nouveau message d\'une marque', desc: 'Quand une marque t\'envoie un message via ton media kit', checked: notifNewMessage, set: setNotifNewMessage },
                { key: 'notifWeeklyReport' as const, label: 'Rapport hebdomadaire', desc: 'Résumé des vues, clics et visites de ta page chaque lundi', checked: notifWeeklyReport, set: setNotifWeeklyReport },
                { key: 'notifProductUpdates' as const, label: 'Nouveautés produit', desc: 'Nouveaux templates, nouvelles fonctionnalités et améliorations de la plateforme', checked: notifTips, set: setNotifTips },
              ].map((item, i, arr) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: TEXT }}>{item.label}</p>
                    <p style={{ fontSize: '12px', color: MUTED, marginTop: '2px' }}>{item.desc}</p>
                  </div>
                  <Toggle checked={item.checked} onChange={val => {
                    item.set(val)
                    setNotifSaving(true)
                    fetch('/api/notifications', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ [item.key]: val }),
                    }).catch(() => {}).finally(() => setNotifSaving(false))
                  }} />
                </div>
              ))}
              {notifSaving && <p style={{ fontSize: '11px', color: MUTED, paddingBottom: '12px' }}>Sauvegarde…</p>}
            </div>
          </SectionCard>

          {/* Section Sécurité */}
          <SectionCard>
            <SectionHeader icon={<Lock size={16} />} title="Sécurité" desc="Mot de passe et authentification" />
            <div style={{ padding: '20px 24px' }}>
              {!hasPassword ? (
                <p style={{ fontSize: '13px', color: MUTED }}>
                  Ton compte utilise Google ou Twitch pour se connecter — aucun mot de passe Sponsorable.
                </p>
              ) : !showPasswordForm ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: TEXT }}>Mot de passe</p>
                    <p style={{ fontSize: '12px', color: MUTED, marginTop: '2px' }}>Modifier ton mot de passe de connexion</p>
                  </div>
                  <button
                    onClick={() => { setShowPasswordForm(true); setPwdError(''); setPwdSuccess(false) }}
                    style={{ padding: '9px 18px', borderRadius: '10px', border: `1px solid ${BORDER}`, cursor: 'pointer', background: CARD, fontSize: '13px', fontWeight: 500, color: TEXT }}
                  >
                    Changer
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: TEXT }}>Changer le mot de passe</p>
                  {pwdSuccess ? (
                    <div style={{ background: 'rgba(29,170,80,0.08)', border: '1px solid rgba(29,170,80,0.2)', borderRadius: '10px', padding: '14px 16px' }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: ACCENT }}>✓ Mot de passe modifié avec succès</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label style={labelStyle}>Mot de passe actuel</label>
                        <input type="password" style={inputStyle} value={currentPwd} onChange={e => setCurrentPwd(e.target.value)}
                          onFocus={e => (e.target.style.border = `1px solid ${ACCENT}`)} onBlur={e => (e.target.style.border = `1px solid ${BORDER}`)}
                          placeholder="••••••••" />
                      </div>
                      <div>
                        <label style={labelStyle}>Nouveau mot de passe</label>
                        <input type="password" style={inputStyle} value={newPwd} onChange={e => setNewPwd(e.target.value)}
                          onFocus={e => (e.target.style.border = `1px solid ${ACCENT}`)} onBlur={e => (e.target.style.border = `1px solid ${BORDER}`)}
                          placeholder="8 caractères minimum" />
                      </div>
                      <div>
                        <label style={labelStyle}>Confirmer le nouveau mot de passe</label>
                        <input type="password" style={inputStyle} value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                          onFocus={e => (e.target.style.border = `1px solid ${ACCENT}`)} onBlur={e => (e.target.style.border = `1px solid ${BORDER}`)}
                          placeholder="••••••••" />
                      </div>
                      {pwdError && <p style={{ fontSize: '12px', color: '#ef4444' }}>⚠️ {pwdError}</p>}
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => { setShowPasswordForm(false); setCurrentPwd(''); setNewPwd(''); setConfirmPwd(''); setPwdError('') }}
                          style={{ flex: 1, padding: '10px', borderRadius: '10px', border: `1px solid ${BORDER}`, cursor: 'pointer', background: CARD, fontSize: '13px', fontWeight: 500, color: MUTED }}>
                          Annuler
                        </button>
                        <button
                          disabled={pwdLoading}
                          onClick={async () => {
                            setPwdError('')
                            if (newPwd !== confirmPwd) { setPwdError('Les mots de passe ne correspondent pas'); return }
                            if (newPwd.length < 8) { setPwdError('Le mot de passe doit faire au moins 8 caractères'); return }
                            setPwdLoading(true)
                            try {
                              const res = await fetch('/api/auth/change-password', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
                              })
                              const data = await res.json()
                              if (!res.ok) { setPwdError(data.error ?? 'Erreur'); return }
                              setPwdSuccess(true)
                              setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
                            } catch { setPwdError('Erreur réseau') } finally { setPwdLoading(false) }
                          }}
                          style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: pwdLoading ? 'wait' : 'pointer', background: ACCENT, color: BG, fontSize: '13px', fontWeight: 600, opacity: pwdLoading ? 0.7 : 1 }}>
                          {pwdLoading ? 'En cours…' : 'Confirmer'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </SectionCard>

          {/* Section Zone de danger */}
          <SectionCard>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}>
                <Trash2 size={16} />
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#ef4444' }}>Zone de danger</p>
                <p style={{ fontSize: '12px', color: MUTED, marginTop: '1px' }}>Actions irréversibles sur ton compte</p>
              </div>
            </div>
            <div style={{ padding: '20px 24px', background: 'rgba(239,68,68,0.06)', border: '0', borderRadius: '0 0 16px 16px' }}>
              {!showDeleteConfirm ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: TEXT }}>Supprimer mon compte</p>
                    <p style={{ fontSize: '12px', color: MUTED, marginTop: '2px' }}>Supprime définitivement ton compte et toutes tes données</p>
                  </div>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    style={{ padding: '9px 18px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', background: 'rgba(239,68,68,0.08)', fontSize: '13px', fontWeight: 600, color: '#ef4444' }}
                  >
                    Supprimer
                  </button>
                </div>
              ) : (
                <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '20px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: TEXT, marginBottom: '8px' }}>Tu es sûr·e ?</p>
                  <p style={{ fontSize: '13px', color: MUTED, marginBottom: '14px' }}>
                    Cette action est <strong style={{ color: TEXT }}>irréversible</strong>. Tape ton pseudo <strong style={{ color: TEXT }}>{pseudo}</strong> pour confirmer.
                  </p>
                  <input
                    style={{ ...inputStyle, marginBottom: '14px' }}
                    value={deleteInput}
                    onChange={e => setDeleteInput(e.target.value)}
                    placeholder={`Tape "${pseudo}" pour confirmer`}
                    onFocus={e => (e.target.style.border = '1px solid #ef4444')}
                    onBlur={e => (e.target.style.border = `1px solid ${BORDER}`)}
                  />
                  {deleteError && <p style={{ fontSize: '12px', color: '#ef4444', marginBottom: '8px' }}>⚠️ {deleteError}</p>}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); setDeleteError('') }}
                      style={{ flex: 1, padding: '10px', borderRadius: '10px', border: `1px solid ${BORDER}`, cursor: 'pointer', background: CARD, fontSize: '13px', fontWeight: 500, color: MUTED }}
                    >
                      Annuler
                    </button>
                    <button
                      disabled={deleteInput !== pseudo || deleteLoading}
                      onClick={async () => {
                        setDeleteLoading(true)
                        setDeleteError('')
                        try {
                          const res = await fetch('/api/me', { method: 'DELETE' })
                          if (!res.ok) { setDeleteError('Erreur lors de la suppression'); return }
                          // Vider le localStorage et déconnecter
                          localStorage.clear()
                          await signOut({ callbackUrl: '/' })
                        } catch {
                          setDeleteError('Erreur réseau, réessaie')
                        } finally {
                          setDeleteLoading(false)
                        }
                      }}
                      style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: (deleteInput === pseudo && !deleteLoading) ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: 600, background: (deleteInput === pseudo && !deleteLoading) ? '#ef4444' : 'rgba(239,68,68,0.25)', color: 'white', transition: 'background 200ms', opacity: deleteLoading ? 0.7 : 1 }}
                    >
                      {deleteLoading ? 'Suppression…' : 'Supprimer définitivement'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: MUTED, marginTop: '40px', marginBottom: '20px' }}>
          Sponsorable v1.0 · Fait avec ❤️ pour les créateurs FR
        </p>

      </main>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsContent />
    </Suspense>
  )
}
