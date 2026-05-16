'use client'

import { Link as LinkIcon, Plug, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import HeroOrbs from '@/components/hero/HeroOrbs'
import Button from '@/components/ui/Button'
import Footer from '@/components/layout/Footer'
import Navbar from '@/components/layout/Navbar'
import { plans, exampleCreators } from '@/data/mockData'

/* ── Browser mockup ─────────────────────────────────────── */
const BrowserMockup = () => (
  <div
    style={{
      borderRadius: '14px',
      overflow: 'hidden',
      boxShadow: '0 32px 80px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
      border: '1px solid rgba(0,0,0,0.10)',
      background: 'white',
      width: '100%',
      maxWidth: '520px',
    }}
  >
    {/* Chrome bar */}
    <div
      style={{
        background: '#f1f5f9',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ display: 'flex', gap: '5px' }}>
        {['#ef4444', '#f59e0b', '#22c55e'].map(c => (
          <div key={c} style={{ width: '9px', height: '9px', borderRadius: '50%', background: c }} />
        ))}
      </div>
      <div
        style={{
          flex: 1,
          background: 'white',
          borderRadius: '6px',
          padding: '4px 12px',
          fontSize: '11px',
          color: '#94a3b8',
          border: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        sponsorable.gg/tonpseudo
      </div>
    </div>

    {/* Scrolling content */}
    <div style={{ height: '380px', overflow: 'hidden' }}>
      <div style={{ animation: 'scrollMockup 7s ease-in-out infinite' }}>

        {/* Mini hero */}
        <div style={{ padding: '28px 24px 20px', textAlign: 'center', background: 'white' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#16a34a', color: 'white', fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 0 0 3px rgba(22,163,74,0.15)' }}>
            AP
          </div>
          <p style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>AlexPlays</p>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '10px' }}>
            {['Gaming', 'Minecraft', 'FPS'].map(n => (
              <span key={n} style={{ background: 'rgba(134,239,172,0.2)', color: '#15803d', border: '1px solid rgba(134,239,172,0.4)', borderRadius: '9999px', padding: '3px 10px', fontSize: '11px', fontWeight: 500 }}>{n}</span>
            ))}
          </div>
          <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5, maxWidth: '300px', margin: '0 auto' }}>
            Créateur gaming FR depuis 2019. Minecraft, FPS compétitif et streams quotidiens.
          </p>
        </div>

        {/* Mini stats */}
        <div style={{ padding: '0 16px 16px', background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#16a34a', display: 'block' }} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#15803d' }}>Stats en direct</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {/* YouTube */}
            <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderTop: '3px solid #ef4444', borderRadius: '10px', padding: '16px' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', fontWeight: 500 }}>YouTube</p>
              <p style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', lineHeight: 1, letterSpacing: '-0.03em' }}>87 400</p>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>abonnés</p>
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', gap: '12px' }}>
                <div><p style={{ fontSize: '13px', fontWeight: 700, color: '#16a34a' }}>54 000</p><p style={{ fontSize: '10px', color: '#94a3b8' }}>vues / vidéo</p></div>
                <div><p style={{ fontSize: '13px', fontWeight: 700, color: '#16a34a' }}>+18%</p><p style={{ fontSize: '10px', color: '#94a3b8' }}>croissance</p></div>
              </div>
            </div>
            {/* Other platforms stacked */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { name: 'Twitch', color: '#9146ff', value: '12 300', label: 'viewers' },
                { name: 'TikTok', color: '#000', value: '34 200', label: 'abonnés' },
                { name: 'Instagram', color: '#e1306c', value: '18 500', label: 'abonnés' },
              ].map(p => (
                <div key={p.name} style={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderLeft: `3px solid ${p.color}`, borderRadius: '8px', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500 }}>{p.name}</p>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{p.value}</p>
                    <p style={{ fontSize: '9px', color: '#94a3b8' }}>{p.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mini audience */}
        <div style={{ padding: '16px', background: '#f8fafc', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Audience</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[{ label: '18–24 ans', pct: 38 }, { label: '25–34 ans', pct: 24 }, { label: '35–44 ans', pct: 18 }].map(a => (
              <div key={a.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ fontSize: '11px', color: '#475569' }}>{a.label}</span>
                  <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>{a.pct}%</span>
                </div>
                <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '9999px' }}>
                  <div style={{ height: '100%', width: `${a.pct}%`, background: 'linear-gradient(90deg,#4ade80,#16a34a)', borderRadius: '9999px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
)

/* ── Steps ──────────────────────────────────────────────── */
const steps = [
  {
    num: '01',
    icon: Plug,
    title: 'Connecte',
    desc: 'YouTube, Twitch, TikTok, Instagram. Tes stats rentrent automatiquement — rien à saisir.',
  },
  {
    num: '02',
    icon: Sparkles,
    title: 'On génère',
    desc: 'Ton media kit complet se crée tout seul. Design pro, stats en direct, données structurées.',
  },
  {
    num: '03',
    icon: LinkIcon,
    title: 'Tu envoies',
    desc: 'Un lien, pas un PDF. Quand tes stats évoluent, le lien se met à jour tout seul.',
  },
]

/* ── Pour qui ───────────────────────────────────────────── */
const profiles = [
  {
    emoji: '🎮',
    title: 'Tu reçois tes premières DM',
    sub: '1 000 – 20 000 abonnés',
    desc: 'Une marque t\'a contacté et tu sais pas quoi répondre. Sponsorable te donne quelque chose de pro à envoyer en 2 minutes.',
  },
  {
    emoji: '📈',
    title: 'Tu veux scaler tes partenariats',
    sub: '20 000 – 100 000 abonnés',
    desc: 'T\'as déjà fait des deals mais tout est bricolé — emails, Canva, tableurs. Il te faut un système.',
  },
  {
    emoji: '🏆',
    title: 'Tu signes des deals réguliers',
    sub: '100 000+ abonnés',
    desc: 'Les équipes marketing attendent un dossier structuré. Ton media kit doit être aussi pro que ton contenu.',
  },
]

/* ── Page ───────────────────────────────────────────────── */
const LandingPage = () => {
  const [email, setEmail] = useState('')
  const router = useRouter()

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh' }}>
      <Navbar dark />

      {/* ── HERO ─────────────────────────────── */}
      <section
        style={{
          position: 'relative',
          paddingTop: '120px',
          paddingBottom: '96px',
          overflow: 'hidden',
          background: '#080d14',
          backgroundImage: 'radial-gradient(rgba(74,222,128,0.10) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      >
        <HeroOrbs />

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: '1100px',
            margin: '0 auto',
            padding: '0 40px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '72px',
            alignItems: 'center',
          }}
        >
          {/* Left: text */}
          <div>
            <div style={{ marginBottom: '24px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: '9999px', padding: '5px 14px', fontSize: '12px', fontWeight: 600, color: '#4ade80', letterSpacing: '0.02em' }}>
                ✦ En bêta privée
              </span>
            </div>

            <h1
              className="font-hero"
              style={{ marginBottom: '24px', textAlign: 'left', lineHeight: 1.0 }}
            >
              <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>Deviens</span>
              <br />
              <span style={{ color: '#4ade80' }}>Sponsorable.</span>
            </h1>

            <p
              style={{
                fontSize: '18px',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '40px',
                lineHeight: 1.7,
                maxWidth: '420px',
              }}
            >
              La prochaine fois qu'un sponsor te contacte, t'as quelque chose de pro à lui envoyer en 2 minutes.
            </p>

            <form
              onSubmit={e => { e.preventDefault(); router.push('/dashboard') }}
              style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', maxWidth: '420px' }}
            >
              <input
                type="email"
                placeholder="ton@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: '180px',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1.5px solid rgba(255,255,255,0.12)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  fontSize: '15px',
                  color: 'white',
                  outline: 'none',
                  transition: 'all 150ms ease',
                }}
                onFocus={e => { e.target.style.borderColor = '#4ade80'; e.target.style.background = 'rgba(74,222,128,0.08)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.background = 'rgba(255,255,255,0.07)' }}
              />
              <button
                type="submit"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 22px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 0 24px rgba(74,222,128,0.35)',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#15803d'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 36px rgba(74,222,128,0.5)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#16a34a'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 24px rgba(74,222,128,0.35)' }}
              >
                Commencer →
              </button>
            </form>

            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '14px' }}>
              Gratuit · Sans carte bancaire
            </p>
          </div>

          {/* Right: browser mockup */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ filter: 'drop-shadow(0 0 40px rgba(74,222,128,0.15))', width: '100%', maxWidth: '520px' }}>
              <BrowserMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ───────────────── */}
      <section id="comment-ca-marche" style={{ background: '#ffffff', padding: '96px 24px' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', textAlign: 'center', marginBottom: '64px' }}>
          <h2 style={{ fontSize: '38px', fontWeight: 700, letterSpacing: '-0.02em', color: '#0f172a', marginBottom: '12px' }}>
            Simple comme envoyer un lien.
          </h2>
          <p style={{ fontSize: '17px', color: '#475569', lineHeight: 1.7 }}>
            Arrête de répondre aux sponsors avec un email bricolé.
          </p>
        </div>

        <div style={{ maxWidth: '560px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0' }}>
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={i} style={{ display: 'flex', gap: '20px', position: 'relative' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '48px', flexShrink: 0 }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1.5px solid rgba(22,163,74,0.25)', background: 'rgba(134,239,172,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={16} color="#16a34a" />
                  </div>
                  {i < steps.length - 1 && (
                    <div style={{ width: '1px', flex: 1, minHeight: '40px', borderLeft: '1.5px dashed rgba(22,163,74,0.2)', margin: '8px 0' }} />
                  )}
                </div>
                <div style={{ paddingBottom: i < steps.length - 1 ? '32px' : 0 }}>
                  <span style={{ fontSize: '11px', fontWeight: 500, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{step.num}</span>
                  <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', marginTop: '4px', marginBottom: '6px' }}>{step.title}</h3>
                  <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.6 }}>{step.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── POUR QUI C'EST ──────────────────── */}
      <section style={{ background: '#0f172a', padding: '96px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#4ade80', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Pour qui c'est ?
            </span>
            <h2 style={{ fontSize: '38px', fontWeight: 700, letterSpacing: '-0.02em', color: '#ffffff', marginTop: '12px', marginBottom: '0' }}>
              T'es créateur gaming FR.<br />C'est fait pour toi.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {profiles.map(p => (
              <div
                key={p.title}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                  padding: '32px',
                  transition: 'border-color 200ms ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(74,222,128,0.3)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
              >
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>{p.emoji}</div>
                <p style={{ fontSize: '11px', fontWeight: 500, color: '#4ade80', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }}>{p.sub}</p>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '12px', lineHeight: 1.3 }}>{p.title}</h3>
                <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.7 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EXEMPLES ────────────────────────── */}
      <section id="exemples" style={{ background: '#0f172a', padding: '96px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#4ade80', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Exemples
            </span>
            <h2 style={{ fontSize: '38px', fontWeight: 700, letterSpacing: '-0.02em', color: '#ffffff', marginTop: '12px', marginBottom: '12px' }}>
              Voir à quoi ça ressemble
            </h2>
            <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.5)' }}>
              Des media kits générés par Sponsorable. Le tien peut ressembler à ça.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', alignItems: 'start' }}>

            {/* ── Carte 1 : Esport — avatar centré + stat géante ── */}
            {(() => { const c = exampleCreators[0]; return (
              <div key={c.id} style={{ background: '#0a0a0a', border: '1.5px solid rgba(145,70,255,0.35)', borderRadius: '20px', overflow: 'hidden', transition: 'transform 200ms ease' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
              >
                <div style={{ padding: '28px 28px 20px', textAlign: 'center', borderBottom: '1px solid rgba(145,70,255,0.12)' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#9146ff', color: 'white', fontSize: '17px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 0 0 4px rgba(145,70,255,0.2), 0 0 24px rgba(145,70,255,0.4)' }}>{c.initials}</div>
                  <p style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', marginBottom: '10px', letterSpacing: '-0.01em' }}>{c.pseudo}</p>
                  <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {c.niches.map(n => <span key={n} style={{ background: 'rgba(145,70,255,0.14)', color: '#9146ff', border: '1px solid rgba(145,70,255,0.28)', borderRadius: '9999px', padding: '2px 9px', fontSize: '11px', fontWeight: 500 }}>{n}</span>)}
                  </div>
                </div>
                <div style={{ textAlign: 'center', padding: '24px 28px 20px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>{c.platform}</p>
                  <p style={{ fontSize: '56px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.04em', lineHeight: 1 }}>{c.mainStat.value}</p>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginTop: '6px' }}>{c.mainStat.label}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: '1px solid rgba(145,70,255,0.12)' }}>
                  {c.stats.map((s, i) => (
                    <div key={s.label} style={{ textAlign: 'center', padding: '14px 8px', borderRight: i < 2 ? '1px solid rgba(145,70,255,0.12)' : 'none' }}>
                      <p style={{ fontSize: '15px', fontWeight: 800, color: '#9146ff', lineHeight: 1 }}>{s.value}</p>
                      <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )})()}

            {/* ── Carte 2 : Kiro — monochrome, stat qui domine, Solenne Capital ── */}
            {(() => { const c = exampleCreators[1]; return (
              <div key={c.id} style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', overflow: 'hidden', transition: 'transform 200ms ease' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
              >
                {/* Top bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '22px 22px 0' }}>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', marginBottom: '3px' }}>{c.pseudo}</p>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>{c.niches.join(' · ')}</p>
                  </div>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: '0.03em' }}>{c.initials}</div>
                </div>
                {/* Stat géante */}
                <div style={{ padding: '18px 22px 22px' }}>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 600 }}>{c.platform}</p>
                  <p style={{ fontSize: '62px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.05em', lineHeight: 1 }}>{c.mainStat.value}</p>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.28)', marginTop: '6px', letterSpacing: '0.02em' }}>{c.mainStat.label}</p>
                </div>
                {/* Stats row — pur monochrome */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                  {c.stats.map((s, i) => (
                    <div key={s.label} style={{ padding: '14px 10px', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', lineHeight: 1 }}>{s.value}</p>
                      <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', marginTop: '4px' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )})()}

            {/* ── Carte 3 : Dread.gg — forêt sombre, tons crème/sauge, Arcana ── */}
            {(() => { const c = exampleCreators[2]; return (
              <div key={c.id} style={{ background: '#1a2b18', border: '1px solid rgba(122,179,86,0.2)', borderRadius: '20px', overflow: 'hidden', transition: 'transform 200ms ease' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
              >
                {/* Header */}
                <div style={{ padding: '24px 22px 18px', borderBottom: '1px solid rgba(122,179,86,0.12)' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(122,179,86,0.15)', color: '#7ab356', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(122,179,86,0.3)' }}>{c.initials}</div>
                    <div>
                      <p style={{ fontSize: '16px', fontWeight: 700, color: '#e8ddc8', marginBottom: '4px' }}>{c.pseudo}</p>
                      <p style={{ fontSize: '11px', color: 'rgba(232,221,200,0.45)', fontWeight: 400 }}>{c.niches.join(' · ')}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: '12px', color: 'rgba(232,221,200,0.5)', lineHeight: 1.7 }}>{c.bio}</p>
                </div>
                {/* Stat principale */}
                <div style={{ padding: '20px 22px 16px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(232,221,200,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>{c.platform}</p>
                  <p style={{ fontSize: '44px', fontWeight: 900, color: '#e8ddc8', letterSpacing: '-0.03em', lineHeight: 1 }}>{c.mainStat.value}</p>
                  <p style={{ fontSize: '12px', color: 'rgba(232,221,200,0.4)', marginTop: '4px' }}>{c.mainStat.label}</p>
                </div>
                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: '1px solid rgba(122,179,86,0.12)' }}>
                  {c.stats.map((s, i) => (
                    <div key={s.label} style={{ padding: '14px 10px', borderRight: i < 2 ? '1px solid rgba(122,179,86,0.12)' : 'none' }}>
                      <p style={{ fontSize: '14px', fontWeight: 800, color: '#7ab356', lineHeight: 1 }}>{s.value}</p>
                      <p style={{ fontSize: '10px', color: 'rgba(232,221,200,0.38)', marginTop: '4px' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )})()}

            {/* ── Carte 4 : AlexPlays — fond blanc, 2 colonnes, bio visible ── */}
            {(() => { const c = exampleCreators[3]; return (
              <div key={c.id} style={{ background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.07)', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 16px 56px rgba(0,0,0,0.45)', transition: 'transform 200ms ease' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
              >
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '24px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#ef4444', color: 'white', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '5px' }}>{c.pseudo}</p>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '9px' }}>
                      {c.niches.map(n => <span key={n} style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.18)', borderRadius: '9999px', padding: '2px 7px', fontSize: '11px', fontWeight: 500 }}>{n}</span>)}
                    </div>
                    <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.6 }}>{c.bio}</p>
                  </div>
                </div>
                <div style={{ margin: '16px 20px 0', background: '#f8fafc', borderRadius: '0 12px 12px 0', borderLeft: '3px solid #ef4444', padding: '14px 18px' }}>
                  <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>{c.platform}</p>
                  <p style={{ fontSize: '30px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1 }}>{c.mainStat.value}</p>
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>{c.mainStat.label}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: '1px solid rgba(0,0,0,0.06)', marginTop: '16px' }}>
                  {c.stats.map((s, i) => (
                    <div key={s.label} style={{ textAlign: 'center', padding: '14px 8px', borderRight: i < 2 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                      <p style={{ fontSize: '15px', fontWeight: 800, color: '#ef4444', lineHeight: 1 }}>{s.value}</p>
                      <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )})()}

          </div>
        </div>
      </section>

      {/* ── OFFRES ──────────────────────────── */}
      <section id="tarifs" style={{ background: '#f8fafc', padding: '96px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ fontSize: '38px', fontWeight: 700, letterSpacing: '-0.02em', color: '#0f172a', marginBottom: '12px' }}>
              Prêt à décrocher ton premier partenariat ?
            </h2>
            <p style={{ fontSize: '17px', color: '#475569' }}>
              Commence gratuitement. Passe au niveau supérieur quand tu veux.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '48px' }}>
            {plans.map(plan => (
              <div
                key={plan.name}
                style={{
                  background: 'white',
                  border: plan.highlight ? '2px solid #16a34a' : '1px solid rgba(0,0,0,0.08)',
                  borderRadius: '20px',
                  padding: '32px',
                  position: 'relative',
                  boxShadow: plan.highlight ? '0 8px 32px rgba(22,163,74,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                {plan.badge && (
                  <span style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: '#16a34a', color: 'white', borderRadius: '9999px', padding: '4px 16px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {plan.badge}
                  </span>
                )}
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>{plan.name}</p>
                <p style={{ marginBottom: '24px' }}>
                  <span style={{ fontSize: '36px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>{plan.price}</span>
                  {plan.period && <span style={{ fontSize: '14px', color: '#94a3b8', marginLeft: '4px' }}>{plan.period}</span>}
                </p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '14px', color: '#475569' }}>
                      <span style={{ color: '#16a34a', fontWeight: 700, marginTop: '1px', flexShrink: 0 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <Button variant="primary" arrow onClick={() => router.push('/dashboard')}>
              Commencer gratuitement
            </Button>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '14px' }}>
              Sans carte bancaire · Annulable à tout moment
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default LandingPage
