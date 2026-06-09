'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Footer from '@/components/layout/Footer'
import Navbar from '@/components/layout/Navbar'
import Reveal, { useInView } from '@/components/ui/Reveal'
import StatCard from '@/components/ui/StatCard'
import { exampleCreators } from '@/data/mockData'

/* ── Palette ──────────────────────────────────────────────── */
const BG      = '#0d0d0f'
const SURFACE = '#111318'
const CARD    = '#1c1f26'
const ACCENT  = '#22c55e'
const TEXT    = '#ffffff'
const MUTED   = '#888888' /* #555555 d'origine → fail WCAG AA (2.7:1). #888 = 4.8:1 sur BG et SURFACE ✓ */
const BORDER  = '#222222'
const VIOLET  = '#7c5cff'
const CORAL   = '#fb7185'
const GOLD    = '#f5b544'
const MONO    = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
const SYNE    = '"Syne", var(--font-syne), system-ui, sans-serif'
const SANS    = '"Space Grotesk", var(--font-sans), system-ui, sans-serif'
const DISPLAY = '"Cabinet Grotesk", var(--font-display), system-ui, sans-serif'
const NUM     = '"Martian Mono", var(--font-num), ui-monospace, monospace'

/* ── Surfaces premium pricing (dégradé + profondeur) ──────── */
const CARD_GRAD   = `linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.008) 100%), ${SURFACE}`
const CARD_BORDER = '1px solid rgba(255,255,255,0.09)'
const PRO_GRAD    = `radial-gradient(125% 85% at 50% -12%, rgba(34,197,94,0.16) 0%, transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.012) 100%), ${CARD}`

/* ── Halo atmosphérique ───────────────────────────────────── */
const Halo = ({ color, size, opacity = 0.12, anim = 'haloDrift', dur = '22s', ...pos }: {
  color: string; size: string; opacity?: number; anim?: string; dur?: string
  top?: string; left?: string; right?: string; bottom?: string
}) => (
  <div aria-hidden style={{
    position: 'absolute', width: size, height: size, borderRadius: '50%',
    background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
    opacity, filter: 'blur(24px)', pointerEvents: 'none',
    animation: `${anim} ${dur} ease-in-out infinite`, zIndex: 0, ...pos,
  }} />
)

/* ── Label de section ─────────────────────────────────────── */
/* Eyebrow sans numéro : max ceil(sections/3) = 4 sur toute la page (règle taste-skill §9.F) */
const SectionLabel = ({ children }: { children: string }) => (
  <div style={{
    fontFamily: MONO, fontSize: '11px', letterSpacing: '0.14em',
    textTransform: 'uppercase', marginBottom: '20px',
    display: 'flex', alignItems: 'center', gap: '10px',
  }}>
    <span style={{ width: '16px', height: '1px', background: ACCENT }} />
    <span style={{ color: MUTED }}>{children}</span>
  </div>
)

/* ── Coche features pricing (cercle stroke, style réf) ───────── */
const Check = () => (
  <span aria-hidden style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke={ACCENT} strokeWidth="1.2" />
      <path d="M5 8.2L7 10.2L11 6" stroke={ACCENT} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </span>
)

/* ── Prix d'un plan (gère mensuel / annuel -17%) ──────────── */
const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })
const PlanPrice = ({ monthly, yearly }: { monthly: number; yearly: boolean }) => {
  const Num = ({ children }: { children: React.ReactNode }) => (
    <span style={{ fontFamily: SANS, fontSize: '52px', fontWeight: 700, color: TEXT, letterSpacing: '-0.02em', lineHeight: 1 }}>{children}</span>
  )
  const Cur = () => <span style={{ fontFamily: SANS, fontSize: '24px', fontWeight: 600, color: TEXT, letterSpacing: '-0.01em' }}>€</span>
  const Per = () => <span style={{ fontFamily: MONO, fontSize: '13px', color: MUTED, marginLeft: '6px' }}>/mois</span>
  const note = (txt: string) => <p style={{ fontFamily: MONO, fontSize: '12px', color: MUTED, margin: '6px 0 22px', minHeight: '16px' }}>{txt}</p>
  if (monthly === 0) return (<><div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}><Num>0</Num><Cur /></div>{note('gratuit, pour toujours')}</>)
  const yearTotal = monthly * 10 /* 2 mois offerts → ~-17% */
  const eq = yearTotal / 12
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}><Num>{yearly ? fmt(eq) : monthly}</Num><Cur /><Per /></div>
      {note(yearly ? `soit ${fmt(yearTotal)}€ facturés par an` : 'facturé chaque mois')}
    </>
  )
}

/* ── Browser mockup (Hero) ───────────────────────────────── */
const BrowserMockup = () => (
  <div style={{
    borderRadius: '10px', overflow: 'hidden',
    boxShadow: '0 24px 70px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.4)',
    border: `1px solid ${BORDER}`, background: 'white', width: '100%', maxWidth: '520px',
  }}>
    <div style={{ background: '#f1f5f9', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', gap: '5px' }}>
        {['#ef4444', '#f59e0b', '#22c55e'].map(c => (
          <div key={c} style={{ width: '9px', height: '9px', borderRadius: '50%', background: c }} />
        ))}
      </div>
      <div style={{ flex: 1, background: 'white', borderRadius: '5px', padding: '4px 12px', fontSize: '11px', color: '#94a3b8', border: '1px solid rgba(0,0,0,0.08)' }}>
        sponsorable.gg/tonpseudo
      </div>
    </div>
    <div style={{ height: '380px', overflow: 'hidden' }}>
      <div style={{ animation: 'scrollMockup 7s ease-in-out infinite' }}>
        {/* Profil */}
        <div style={{ padding: '28px 24px 20px', textAlign: 'center', background: 'white' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: ACCENT, color: 'white', fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 0 0 3px rgba(34,197,94,0.15)' }}>AP</div>
          <p style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>AlexPlays</p>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '10px' }}>
            {['Gaming', 'Minecraft', 'FPS'].map(n => (
              <span key={n} style={{ background: 'rgba(134,239,172,0.2)', color: '#15803d', border: '1px solid rgba(134,239,172,0.4)', borderRadius: '9999px', padding: '3px 10px', fontSize: '11px', fontWeight: 500 }}>{n}</span>
            ))}
          </div>
          <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5, maxWidth: '300px', margin: '0 auto' }}>Créateur gaming FR depuis 2019. Minecraft, FPS compétitif et streams quotidiens.</p>
        </div>
        {/* Stats */}
        <div style={{ padding: '0 16px 16px', background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: ACCENT }} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#15803d' }}>Stats en direct</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderTop: '3px solid #ef4444', borderRadius: '8px', padding: '16px' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', fontWeight: 500 }}>YouTube</p>
              <p style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', lineHeight: 1, letterSpacing: '-0.03em' }}>87 400</p>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>abonnés</p>
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', gap: '12px' }}>
                <div><p style={{ fontSize: '13px', fontWeight: 700, color: ACCENT }}>54 000</p><p style={{ fontSize: '10px', color: '#94a3b8' }}>vues / vidéo</p></div>
                <div><p style={{ fontSize: '13px', fontWeight: 700, color: ACCENT }}>+18%</p><p style={{ fontSize: '10px', color: '#94a3b8' }}>croissance</p></div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { name: 'Twitch',    color: '#9146ff', value: '12 300', label: 'viewers' },
                { name: 'TikTok',   color: '#000000', value: '34 200', label: 'abonnés' },
                { name: 'Instagram',color: '#e1306c', value: '18 500', label: 'abonnés' },
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
        {/* Audience */}
        <div style={{ padding: '16px', background: '#f8fafc', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Audience</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[{ label: '18–24 ans', pct: 38 }, { label: '25–34 ans', pct: 24 }, { label: '35–44 ans', pct: 18 }].map(a => (
              <div key={a.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ fontSize: '11px', color: '#475569' }}>{a.label}</span>
                  <span style={{ fontSize: '11px', color: ACCENT, fontWeight: 600 }}>{a.pct}%</span>
                </div>
                <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '9999px' }}>
                  <div style={{ height: '100%', width: `${a.pct}%`, background: `linear-gradient(90deg,#4ade80,${ACCENT})`, borderRadius: '9999px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
)

/* ── Faux PDF Canva (AVANT) ───────────────────────────────── */
const StalePdfMock = () => (
  <div style={{ position: 'relative', transform: 'rotate(-1.6deg)', filter: 'saturate(0.55)' }}>
    <div style={{ position: 'absolute', top: '-10px', right: '14px', zIndex: 2, background: '#475569', color: 'white', fontFamily: MONO, fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', padding: '4px 9px', borderRadius: '3px', transform: 'rotate(3deg)', boxShadow: '0 2px 6px rgba(0,0,0,0.25)' }}>
      mediakit_final_V3.pdf
    </div>
    <div style={{ background: '#e9e7df', border: '1px solid rgba(0,0,0,0.14)', borderRadius: '2px', padding: '26px 24px', boxShadow: '0 12px 30px rgba(0,0,0,0.35)', maxWidth: '380px', width: '100%' }}>
      <div style={{ borderBottom: '2px solid #94a3b8', paddingBottom: '12px', marginBottom: '16px' }}>
        <p style={{ fontFamily: MONO, fontSize: '20px', fontWeight: 700, color: '#334155', letterSpacing: '0.02em' }}>MEDIA KIT 2024</p>
        <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Présentation partenariats</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
        <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: '#cbd1cf', border: '1px solid #b0b7b4' }} />
        <div>
          <p style={{ fontSize: '15px', fontWeight: 700, color: '#334155' }}>AlexPlays</p>
          <p style={{ fontSize: '11px', color: '#94a3b8' }}>Gaming · FR</p>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569' }}>
          <span>Abonnés YouTube</span>
          <span style={{ fontWeight: 700 }}>
            <span style={{ textDecoration: 'line-through', color: '#b0b7b4', marginRight: '6px' }}>71 200</span>87 400
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569' }}>
          <span>Vues / vidéo</span><span style={{ fontWeight: 700 }}>~50 000 ?</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569' }}>
          <span>Engagement</span><span style={{ fontWeight: 700 }}>« bon »</span>
        </div>
      </div>
      <div style={{ background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.3)', borderRadius: '4px', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '7px' }}>
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#d97706', flexShrink: 0 }} />
        <span style={{ fontSize: '11px', color: '#b45309', fontWeight: 500 }}>Dernière mise à jour : il y a 6 mois</span>
      </div>
    </div>
  </div>
)

/* ── Carte lien vivant (APRÈS) ────────────────────────────── */
const LiveKitCard = () => (
  <div style={{ position: 'relative', background: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '26px 24px', boxShadow: '0 18px 50px rgba(34,197,94,0.22)', maxWidth: '380px', width: '100%' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: ACCENT, flexShrink: 0, animation: 'livePulse 2s ease-out infinite' }} />
      <span style={{ fontFamily: MONO, fontSize: '12px', color: '#64748b' }}>sponsorable.gg/alexplays</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
      <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: ACCENT, color: 'white', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>AP</div>
      <div>
        <p style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>AlexPlays</p>
        <div style={{ display: 'flex', gap: '4px', marginTop: '3px' }}>
          {['Gaming', 'FPS'].map(n => (
            <span key={n} style={{ fontSize: '10px', fontWeight: 500, color: '#15803d', background: 'rgba(134,239,172,0.2)', border: '1px solid rgba(134,239,172,0.4)', borderRadius: '9999px', padding: '2px 8px' }}>{n}</span>
          ))}
        </div>
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
      {[
        { k: 'Abonnés YouTube', v: '87 400' },
        { k: 'Vues / vidéo',    v: '54 000' },
        { k: 'Engagement',      v: '4,2 %'  },
      ].map(s => (
        <div key={s.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
          <span style={{ color: '#475569' }}>{s.k}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#0f172a' }}>
            {s.v}
            <span style={{ fontFamily: MONO, fontSize: '9px', color: '#a16207', background: 'rgba(245,181,68,0.16)', border: '1px solid rgba(245,181,68,0.4)', borderRadius: '3px', padding: '1px 5px' }}>vérifié</span>
          </span>
        </div>
      ))}
    </div>
    <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.22)', borderRadius: '4px', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '7px' }}>
      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: ACCENT, flexShrink: 0 }} />
      <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 500 }}>Synchronisé via API · à jour il y a 2 min</span>
    </div>
  </div>
)

/* ── Données statiques ────────────────────────────────────── */
const leaks = [
  { t: 'Des chiffres invérifiables',  d: 'La marque ne peut pas confirmer tes stats. Donc elle en doute. Donc elle négocie à la baisse.' },
  { t: 'Un document déjà périmé',     d: 'Tes chiffres ont bougé la semaine d\'après. Ton PDF, lui, te sous-estime pour les 6 prochains mois.' },
  { t: 'Du temps à chaque demande',   d: 'Refaire le même export, le réuploader, renvoyer le mail. À chaque marque. À chaque fois.' },
]

const marketStats = [
  { target: 87, suffix: '%',  prefix: '',  label: 'des marques exigent un media kit avant tout partenariat' },
  { target: 3,  suffix: '×',  prefix: '',  label: 'plus d\'opportunités avec un media kit professionnel' },
  { target: 54, suffix: '%',  prefix: '+', label: 'de vidéos sponsorisées YouTube en H1 2025' },
]

const steps = [
  { num: '01', title: 'Connecte tes plateformes',  desc: 'YouTube, Twitch, TikTok, Instagram. Tes stats rentrent toutes seules, rien à saisir à la main.' },
  { num: '02', title: 'Ton kit se génère',         desc: 'Design pro, stats vérifiées via API, données structurées. Prêt en moins de 2 minutes.' },
  { num: '03', title: 'Tu envoies un lien',        desc: 'Pas un PDF. Quand tes stats bougent, le lien se met à jour seul. Jamais besoin de le refaire.' },
]

const diffAxes = [
  { n: '01', t: 'Vérifié, pas recopié',          d: 'Tes stats viennent direct des API YouTube et Twitch. La marque sait qu\'elles sont réelles, elle arrête de négocier dans le doute.',          c: ACCENT  },
  { n: '02', t: 'Vivant, pas figé',              d: 'Ton lien se met à jour seul. Tu ne renverras plus jamais des chiffres d\'il y a 6 mois. Ta croissance joue pour toi.',                        c: VIOLET  },
  { n: '03', t: 'Tu choisis ce que tu montres',  d: 'Tu mets en avant tes meilleures plateformes et métriques. Le reste, tu le masques. Plus de contrôle qu\'un screenshot, pas moins.',           c: ACCENT  },
  { n: '04', t: 'Zéro admin',                    d: 'Une marque te DM ? Tu envoies un lien. Pas de PDF à rouvrir, réexporter, réuploader. Tu récupères ce temps.',                                c: VIOLET  },
]

const profiles = [
  { tag: 'Demandes régulières', title: 'Tu reçois des sponsors régulièrement', desc: 'Réponds vite et bien, sans bricoler un PDF à chaque fois. Un lien, et c\'est réglé.',                     accent: ACCENT, glow: 'rgba(34,197,94,0.18)',   tall: false },
  { tag: 'Marques premium',     title: 'Tu veux démarcher du premium',         desc: 'Les équipes marketing ont un niveau d\'exigence. Présente-toi à leur hauteur, pas en dessous.',           accent: VIOLET, glow: 'rgba(124,92,255,0.2)',  tall: true  },
  { tag: 'Gain de temps',       title: 'Tu veux arrêter l\'admin sponsor',     desc: 'Le va-et-vient emails / exports / relances te bouffe des heures. Sponsorable t\'en rend une partie.',     accent: GOLD,   glow: 'rgba(245,181,68,0.2)', tall: false },
]

const faqs = [
  { q: 'Et si la marque veut un PDF, pas un lien ?',       a: 'Tu peux exporter ton kit en PDF (offre Pro), généré depuis tes vraies stats, pas tapé à la main. Tu gardes le lien pour ceux qui le préfèrent, et le PDF pour les autres.' },
  { q: 'Quelles plateformes, et c\'est vraiment vérifié ?', a: 'YouTube et Twitch sont connectés via OAuth officiel : les stats viennent directement de leurs API, pas de scraping. TikTok et Instagram complètent ton profil.' },
  { q: 'Je garde le contrôle de ce qui s\'affiche ?',      a: 'Oui. Tu choisis quelles plateformes et quelles métriques apparaissent. Tu mets en avant tes points forts, tu masques ce que tu ne veux pas montrer.' },
  { q: 'Ça me prend combien de temps de migrer ?',         a: 'Environ 2 minutes. Tu connectes tes comptes, l\'import est automatique, ton kit se génère. Pas de saisie manuelle, pas de mise en page à refaire.' },
  { q: 'C\'est vraiment gratuit ?',                        a: 'Oui, un palier gratuit te laisse créer ton lien avec une plateforme connectée. Tu passes Pro quand tu veux le multi-plateformes, le sans-watermark et la synchro automatique.' },
]

/* ── Page ─────────────────────────────────────────────────── */
export default function LandingPage() {
  const [email, setEmail]     = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [yearly, setYearly]   = useState(false) /* toggle pricing : false = mensuel, true = annuel (-17%) */
  const router                = useRouter()
  const goRegister = () => router.push('/login?register=1')

  /* Style bouton CTA primaire réutilisable */
  const ctaPrimary: React.CSSProperties = {
    fontFamily: SYNE, background: ACCENT, color: BG,
    border: 'none', borderRadius: '8px', padding: '14px 28px',
    fontSize: '16px', fontWeight: 700, cursor: 'pointer',
    whiteSpace: 'nowrap', boxShadow: '0 6px 24px rgba(34,197,94,0.35)',
    transition: 'all 150ms ease', display: 'inline-flex', alignItems: 'center', gap: '6px',
  }

  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: SYNE }}>
      <Navbar dark />

      {/* ═══ 01 · HERO ═══════════════════════════════════════ */}
      <section style={{ position: 'relative', paddingTop: '96px', paddingBottom: '88px', overflow: 'hidden', background: BG }}>
        <Halo color={ACCENT}  size="620px" opacity={0.15} anim="haloDrift"    dur="24s" bottom="-180px" left="-160px" />
        <Halo color={VIOLET}  size="560px" opacity={0.09} anim="haloDriftAlt" dur="28s" top="-160px"    right="-120px" />
        <div className="hero-grid">
          {/* Colonne texte — stagger 0 / 150 / 300ms */}
          <div>
            <Reveal delay={0}>
              <div style={{ marginBottom: '22px', fontFamily: MONO, fontSize: '12px', letterSpacing: '0.16em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: ACCENT, fontWeight: 600 }}>Deviens Sponsorable</span>
                <span style={{ width: '20px', height: '1px', background: 'rgba(255,255,255,0.2)' }} />
                <span style={{ color: 'rgba(255,255,255,0.35)' }}>bêta privée · gaming FR</span>
              </div>
            </Reveal>

            <Reveal delay={150}>
              <h1 style={{ fontFamily: DISPLAY, fontSize: 'clamp(48px, 6vw, 72px)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: '24px', color: TEXT, textWrap: 'balance' } as React.CSSProperties}>
                Arrête de négocier tes deals{' '}
                <span style={{ color: ACCENT }}>avec un PDF Canva.</span>
              </h1>
            </Reveal>

            <Reveal delay={300}>
              <p style={{ fontFamily: SYNE, fontSize: '18px', color: MUTED, marginBottom: '40px', lineHeight: 1.75, maxWidth: '460px' }}>
                Connecte tes plateformes, on génère ton media kit gaming à partir de tes vraies stats.
                Un lien sponsor-ready, toujours à jour. À la hauteur de ton audience, pas en dessous.
              </p>
            </Reveal>

            <Reveal delay={300}>
              <form
                onSubmit={e => {
                  e.preventDefault()
                  const p = email ? `?email=${encodeURIComponent(email)}&register=1` : '?register=1'
                  router.push(`/login${p}`)
                }}
                style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', maxWidth: '460px' }}
              >
                <input
                  type="email"
                  placeholder="ton@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ flex: 1, minWidth: '180px', background: 'rgba(255,255,255,0.05)', border: `1.5px solid ${BORDER}`, borderRadius: '8px', padding: '14px 16px', fontSize: '15px', fontFamily: SYNE, color: TEXT, outline: 'none', transition: 'all 150ms ease' }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(34,197,94,0.5)'; e.target.style.background = 'rgba(34,197,94,0.05)' }}
                  onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.background = 'rgba(255,255,255,0.05)' }}
                />
                <button
                  type="submit"
                  style={{ ...ctaPrimary, fontSize: '15px', padding: '14px 22px' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#1daa50'; el.style.boxShadow = '0 8px 28px rgba(34,197,94,0.5)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = ACCENT; el.style.boxShadow = '0 6px 24px rgba(34,197,94,0.35)' }}
                >
                  Créer mon lien →
                </button>
              </form>
            </Reveal>

          </div>

          {/* Colonne mockup */}
          <div className="hero-mockup">
            <div style={{ width: '100%', maxWidth: '520px', animation: 'floatY 6s ease-in-out infinite' }}>
              <BrowserMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 02 · PROBLÈME ═══════════════════════════════════ */}
      <section style={{ position: 'relative', background: BG, padding: '96px 24px', overflow: 'hidden', borderTop: `1px solid ${BORDER}` }}>
        <Halo color={CORAL} size="500px" opacity={0.07} anim="haloDriftAlt" dur="26s" top="40px" right="-140px" />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto' }}>
          <Reveal>
            <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(30px, 4vw, 46px)', fontWeight: 700, letterSpacing: '-0.02em', color: TEXT, lineHeight: 1.12, marginBottom: '28px', maxWidth: '720px', textWrap: 'balance' } as React.CSSProperties}>
              Tu signes des deals.<br />Mais tu les pitches avec quoi ?
            </h2>
            <p style={{ fontFamily: SYNE, fontSize: '18px', color: MUTED, lineHeight: 1.75, maxWidth: '600px', marginBottom: '12px' }}>
              Un PDF Canva monté à la main. Un Drive avec trois captures. Des stats recopiées il y a six mois qui ne ressemblent plus à ton compte d&apos;aujourd&apos;hui.
            </p>
            <p style={{ fontFamily: SYNE, fontSize: '18px', color: MUTED, lineHeight: 1.75, maxWidth: '600px', marginBottom: '48px' }}>
              Le problème, c&apos;est pas que ça marche pas. Ça marche, un peu. Le problème, c&apos;est{' '}
              <strong style={{ color: TEXT, fontWeight: 600 }}>tout ce que tu laisses sur la table</strong>&nbsp;:
            </p>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {leaks.map((l, i) => (
              <Reveal key={i} delay={i * 80}>
                {/* borderLeft > 1px = ban absolu Impeccable §skill-ban-side-stripe-borders → remplacé par bg tint + border uniforme */}
                <div style={{ background: 'rgba(251,113,133,0.06)', border: `1px solid rgba(251,113,133,0.22)`, borderRadius: '10px', padding: '28px 26px', height: '100%' }}>
                  <div style={{ fontFamily: MONO, fontSize: '13px', color: CORAL, marginBottom: '14px' }}>{String(i + 1).padStart(2, '0')}</div>
                  <h3 style={{ fontFamily: SYNE, fontSize: '17px', fontWeight: 600, color: TEXT, marginBottom: '10px' }}>{l.t}</h3>
                  <p style={{ fontFamily: SYNE, fontSize: '14px', color: MUTED, lineHeight: 1.7 }}>{l.d}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={120}>
            <p style={{ fontFamily: SYNE, fontSize: '20px', color: TEXT, fontWeight: 600, lineHeight: 1.5, maxWidth: '640px', marginTop: '48px' }}>
              Tu fais un contenu de pro. Au moment où tu parles d&apos;argent, tu te présentes comme un amateur.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ═══ 03 · SOLUTION + STATS ═══════════════════════════ */}
      <section style={{ position: 'relative', background: `linear-gradient(110deg, #15803d 0%, ${ACCENT} 55%, #15a34a 100%)`, padding: '72px 24px', overflow: 'hidden' }}>
        <Halo color="#4ade80" size="480px" opacity={0.4} anim="haloBreathe" dur="9s" top="-160px" left="40%" />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto' }}>
          <Reveal>
            <p style={{ fontFamily: DISPLAY, fontSize: 'clamp(24px, 3.2vw, 36px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff', lineHeight: 1.25, maxWidth: '900px', marginBottom: '52px' }}>
              Sponsorable transforme tes vraies stats en un media kit que les marques prennent au sérieux.{' '}
              <span style={{ color: 'rgba(255,255,255,0.72)' }}>Un lien. Toujours à jour.</span>
            </p>
          </Reveal>

          {/* StatCards animées */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {marketStats.map((s, i) => (
              <Reveal key={i} delay={i * 120}>
                <StatCard target={s.target} suffix={s.suffix} prefix={s.prefix} label={s.label} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 04 · EXEMPLES ═══════════════════════════════════ */}
      <section id="exemples" style={{ position: 'relative', background: SURFACE, padding: '96px 24px', overflow: 'hidden', borderTop: `1px solid ${BORDER}` }}>
        <Halo color={VIOLET} size="600px" opacity={0.07} anim="haloDrift" dur="30s" top="120px" left="50%" />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto' }}>
          <Reveal>
            <SectionLabel>Exemples réels</SectionLabel>
            <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 700, letterSpacing: '-0.02em', color: TEXT, marginBottom: '14px', lineHeight: 1.18 }}>
              Voilà ce qu&apos;une marque voit<br />quand tu envoies ton lien.
            </h2>
            <p style={{ fontFamily: SYNE, fontSize: '17px', color: MUTED, maxWidth: '520px', marginBottom: '52px' }}>
              Des profils de démonstration, dans plusieurs styles. Le tien ressemblera à ça, avec tes vraies stats.
            </p>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            {exampleCreators.map((c, i) => {
              const t = c.theme
              return (
                <Reveal key={c.id} delay={i * 70}>
                  <div
                    style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: '10px', overflow: 'hidden', boxShadow: t.boxShadow || '0 2px 12px rgba(0,0,0,0.3)', transition: 'transform 200ms ease, box-shadow 200ms ease', height: '100%' }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = `0 16px 36px ${t.accent}33` }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = t.boxShadow || '0 2px 12px rgba(0,0,0,0.3)' }}
                  >
                    <div style={{ padding: '24px' }}>
                      {t.styleLabel && (
                        <div style={{ marginBottom: '16px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 600, color: t.accent, letterSpacing: '0.08em', textTransform: 'uppercase', background: `${t.accent}18`, border: `1px solid ${t.accent}30`, borderRadius: '9999px', padding: '3px 10px' }}>{t.styleLabel}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: c.avatarColor, color: c.id === 'mono' ? '#000' : 'white', fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: t.avatarGlow !== 'none' ? t.avatarGlow : undefined }}>{c.initials}</div>
                        <div>
                          <p style={{ fontSize: '15px', fontWeight: 700, color: t.text, marginBottom: '3px' }}>{c.pseudo}</p>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {c.niches.slice(0, 2).map(n => (
                              <span key={n} style={{ fontSize: '10px', fontWeight: 500, color: t.subtext, background: t.statBg, border: `1px solid ${t.statBorder}`, borderRadius: '9999px', padding: '2px 8px' }}>{n}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderLeft: `3px solid ${t.accent}`, borderRadius: '8px', padding: '14px 16px', marginBottom: '10px' }}>
                        <p style={{ fontSize: '10px', fontWeight: 500, color: t.subtext, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px' }}>{c.platform}</p>
                        <p style={{ fontFamily: NUM, fontSize: '24px', fontWeight: 600, color: t.text, letterSpacing: '-0.03em', lineHeight: 1.05, fontVariantNumeric: 'tabular-nums' }}>{c.mainStat.value}</p>
                        <p style={{ fontSize: '10px', color: t.subtext, marginTop: '2px' }}>{c.mainStat.label}</p>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                        {c.stats.slice(0, 2).map(s => (
                          <div key={s.label} style={{ background: t.statBg, border: `1px solid ${t.statBorder}`, borderRadius: '8px', padding: '10px 12px' }}>
                            <p style={{ fontFamily: NUM, fontSize: '13px', fontWeight: 600, color: t.accent, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums' }}>{s.value}</p>
                            <p style={{ fontSize: '9px', color: t.subtext, marginTop: '2px' }}>{s.label}</p>
                          </div>
                        ))}
                      </div>
                      <a
                        href={`/${c.pseudo}`}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: t.accent, textDecoration: 'none', background: `${t.accent}14`, border: `1px solid ${t.accent}30`, borderRadius: '8px', padding: '8px 14px', transition: 'background 150ms' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${t.accent}22` }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${t.accent}14` }}
                      >
                        Voir le kit →
                      </a>
                    </div>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══ 05 · COMMENT ÇA MARCHE ═════════════════════════ */}
      <section id="comment-ca-marche" style={{ background: SURFACE, padding: '96px 24px', borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <Reveal>
            <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 700, letterSpacing: '-0.02em', color: TEXT, marginBottom: '12px' }}>
              Simple comme envoyer un lien.
            </h2>
            <p style={{ fontFamily: SYNE, fontSize: '17px', color: MUTED, lineHeight: 1.7, maxWidth: '460px', marginBottom: '56px' }}>
              Trois étapes. Pas d&apos;export, pas de mise à jour manuelle, pas de mise en page à refaire.
            </p>
          </Reveal>

          {/* Timeline verticale — remplace les 3 colonnes égales (pattern interdit §9.C) */}
          <div style={{ maxWidth: '560px' }}>
            {steps.map((s, i) => {
              const accent = i === 1 ? VIOLET : ACCENT
              const glow   = i === 1 ? 'rgba(124,92,255,0.18)' : 'rgba(34,197,94,0.18)'
              return (
                <Reveal key={i} delay={i * 200}>
                  <div style={{ display: 'flex', gap: '28px', alignItems: 'flex-start', position: 'relative', paddingBottom: i < steps.length - 1 ? '48px' : '0' }}>
                    {/* Connecteur vertical — masqué sur mobile via classe CSS */}
                    {i < steps.length - 1 && (
                      <div className="steps-timeline-connector" style={{ position: 'absolute', left: '25px', top: '52px', width: '1px', bottom: '0', background: `linear-gradient(180deg, ${accent}50 0%, transparent 100%)`, pointerEvents: 'none' }} />
                    )}
                    {/* Numéro */}
                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: CARD, border: `1.5px solid ${accent}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: '17px', fontWeight: 700, color: accent, boxShadow: `0 6px 18px ${glow}` }}>
                      {s.num}
                    </div>
                    {/* Contenu */}
                    <div style={{ paddingTop: '14px' }}>
                      <h3 style={{ fontFamily: SYNE, fontSize: '19px', fontWeight: 600, color: TEXT, marginBottom: '8px' }}>{s.title}</h3>
                      <p style={{ fontFamily: SYNE, fontSize: '15px', color: MUTED, lineHeight: 1.7, maxWidth: '440px' }}>{s.desc}</p>
                    </div>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══ 06 · DIFFÉRENCIATION ═══════════════════════════ */}
      <section style={{ position: 'relative', background: BG, padding: '96px 24px', overflow: 'hidden', borderTop: `1px solid ${BORDER}` }}>
        <Halo color={VIOLET} size="540px" opacity={0.10} anim="haloDriftAlt" dur="26s" top="80px"     right="-120px" />
        <Halo color={ACCENT} size="520px" opacity={0.09} anim="haloDrift"    dur="30s" bottom="-160px" left="-120px" />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto' }}>
          <Reveal>
            <SectionLabel>PDF vs lien vivant</SectionLabel>
            <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(28px, 3.8vw, 44px)', fontWeight: 700, letterSpacing: '-0.02em', color: TEXT, lineHeight: 1.15, marginBottom: '14px', maxWidth: '760px' }}>
              Un PDF, c&apos;est une photo.<br />Sponsorable, c&apos;est ton compte en direct.
            </h2>
            <p style={{ fontFamily: SYNE, fontSize: '17px', color: MUTED, maxWidth: '560px', marginBottom: '56px' }}>
              La différence n&apos;est pas esthétique. Elle est dans ce qu&apos;une marque peut faire avec.
            </p>
          </Reveal>

          {/* PDF (slide depuis la gauche) vs carte live (fade + rise) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', alignItems: 'center', marginBottom: '64px' }}>
            <Reveal direction="left">
              <div>
                <p style={{ fontFamily: MONO, fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', color: MUTED, marginBottom: '24px' }}>Avant : ton PDF</p>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '0 10px' }}><StalePdfMock /></div>
              </div>
            </Reveal>
            <Reveal delay={150}>
              <div>
                <p style={{ fontFamily: MONO, fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', color: ACCENT, marginBottom: '24px' }}>Après : ton lien vivant</p>
                <div style={{ display: 'flex', justifyContent: 'center' }}><LiveKitCard /></div>
              </div>
            </Reveal>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            {diffAxes.map((a, i) => (
              <Reveal key={a.n} delay={i * 70}>
                <div
                  style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER}`, borderTop: `2px solid ${a.c}`, borderRadius: '10px', padding: '28px 26px', height: '100%', transition: 'background 200ms ease' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)' }}
                >
                  <div style={{ fontFamily: MONO, fontSize: '13px', color: a.c, marginBottom: '14px' }}>{a.n}</div>
                  <h3 style={{ fontFamily: SYNE, fontSize: '17px', fontWeight: 600, color: TEXT, marginBottom: '10px' }}>{a.t}</h3>
                  <p style={{ fontFamily: SYNE, fontSize: '14px', color: MUTED, lineHeight: 1.7 }}>{a.d}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={100}>
            <p style={{ fontFamily: SYNE, fontSize: '17px', color: MUTED, marginTop: '40px', maxWidth: '640px' }}>
              Tu peux continuer avec ton Canva. Il marchera.{' '}
              <span style={{ color: TEXT, fontWeight: 600 }}>Juste un peu moins bien que toi.</span>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ═══ 07 · POUR QUI ═══════════════════════════════════ */}
      <section style={{ position: 'relative', background: SURFACE, padding: '96px 24px', overflow: 'hidden', borderTop: `1px solid ${BORDER}` }}>
        <Halo color={VIOLET} size="560px" opacity={0.08} anim="haloDrift" dur="28s" top="-120px" right="10%" />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto' }}>
          <Reveal>
            <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 700, letterSpacing: '-0.02em', color: TEXT, marginBottom: '52px', lineHeight: 1.18 }}>
              T&apos;as l&apos;audience.<br />Il te manque l&apos;outil.
            </h2>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', alignItems: 'start' }}>
            {profiles.map((p, i) => (
              <Reveal key={p.title} delay={i * 80}>
                <div
                  style={{ background: CARD, border: `0.5px solid ${BORDER}`, borderTop: `2px solid ${p.accent}`, borderRadius: '10px', padding: p.tall ? '44px 28px' : '32px 28px', transition: 'transform 200ms ease, box-shadow 200ms ease', height: '100%' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = `0 18px 40px ${p.glow}` }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none' }}
                >
                  <span style={{ fontFamily: SYNE, fontSize: '11px', fontWeight: 600, color: p.accent, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '14px' }}>{p.tag}</span>
                  <h3 style={{ fontFamily: SYNE, fontSize: '18px', fontWeight: 700, color: TEXT, marginBottom: '12px', lineHeight: 1.3 }}>{p.title}</h3>
                  <p style={{ fontFamily: SYNE, fontSize: '14px', color: MUTED, lineHeight: 1.75 }}>{p.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 08 · POURQUOI ═══════════════════════════════════ */}
      <section style={{ background: BG, padding: '96px 24px', borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <Reveal>
            <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(26px, 3vw, 36px)', fontWeight: 700, letterSpacing: '-0.02em', color: TEXT, marginBottom: '32px', lineHeight: 1.2 }}>
              Pourquoi on a construit Sponsorable
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <p style={{ fontFamily: SYNE, fontSize: '18px', color: MUTED, lineHeight: 1.8 }}>
                On a vu des créateurs qui font des centaines de milliers de vues envoyer des{' '}
                <strong style={{ color: TEXT }}>captures d&apos;écran dans des emails</strong>. Des PDF Canva avec les chiffres d&apos;il y a six mois. Des Drive partagés à la va-vite.
              </p>
              <p style={{ fontFamily: SYNE, fontSize: '18px', color: MUTED, lineHeight: 1.8 }}>
                Des créateurs établis, qui signent déjà des deals, et qui se présentent quand même comme s&apos;ils débutaient.{' '}
                <strong style={{ color: ACCENT, fontWeight: 700 }}>Ça nous a paru absurde.</strong>
              </p>
              <p style={{ fontFamily: SYNE, fontSize: '18px', color: MUTED, lineHeight: 1.8 }}>
                Un lien. Des stats vérifiées via API officielle. Un design qui ne fait pas amateur. C&apos;est tout ce qu&apos;il faut pour négocier à la hauteur de ce que tu vaux vraiment.
              </p>
            </div>
            <div style={{ marginTop: '40px', paddingTop: '32px', borderTop: `1px solid ${BORDER}` }}>
              <p style={{ fontFamily: SYNE, fontSize: '14px', color: '#3a3a3a', fontStyle: 'italic', lineHeight: 1.65 }}>
                Sponsorable est en bêta privée. On le construit avec des créateurs qui font déjà des partenariats, pas pour eux. Si t&apos;as des retours, on lit tout.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ 09 · FAQ ════════════════════════════════════════ */}
      <section id="faq" style={{ background: SURFACE, padding: '96px 24px', borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <Reveal>
            <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 700, letterSpacing: '-0.02em', color: TEXT, marginBottom: '48px' }}>
              Ce que tu te demandes sûrement.
            </h2>
          </Reveal>

          {/* Chaque item avec delay progressif */}
          <div style={{ borderTop: `1px solid ${BORDER}` }}>
            {faqs.map((f, i) => {
              const open = openFaq === i
              return (
                <Reveal key={i} delay={i * 60}>
                  <div style={{ borderBottom: `1px solid ${BORDER}`, background: open ? 'rgba(34,197,94,0.03)' : 'transparent', transition: 'background 200ms ease' }}>
                    <button
                      onClick={() => setOpenFaq(open ? null : i)}
                      style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', background: 'none', border: 'none', cursor: 'pointer', padding: '22px 12px', textAlign: 'left', outline: 'none', borderRadius: '4px' }}
                      onFocus={e => { (e.currentTarget as HTMLElement).style.outline = `2px solid ${ACCENT}`; (e.currentTarget as HTMLElement).style.outlineOffset = '-2px' }}
                      onBlur={e => { (e.currentTarget as HTMLElement).style.outline = 'none' }}
                    >
                      <span style={{ fontFamily: SYNE, fontSize: '17px', fontWeight: 600, color: TEXT }}>{f.q}</span>
                      <span style={{ fontFamily: MONO, fontSize: '20px', color: open ? ACCENT : MUTED, flexShrink: 0, transition: 'transform 240ms ease, color 240ms ease', transform: open ? 'rotate(45deg)' : 'none', lineHeight: 1 }}>+</span>
                    </button>
                    <div style={{ maxHeight: open ? '240px' : '0', overflow: 'hidden', transition: 'max-height 240ms ease' }}>
                      <p style={{ fontFamily: SYNE, fontSize: '15px', color: MUTED, lineHeight: 1.75, padding: '0 12px 24px', maxWidth: '620px' }}>{f.a}</p>
                    </div>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══ 10 · PRICING ════════════════════════════════════ */}
      <section id="tarifs" style={{ background: BG, padding: '96px 24px', borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <Reveal>
            <SectionLabel>Tarifs</SectionLabel>
            <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 700, letterSpacing: '-0.02em', color: TEXT, marginBottom: '12px' }}>
              Commence gratuitement.
            </h2>
            <p style={{ fontFamily: SYNE, fontSize: '17px', color: MUTED, marginBottom: '52px' }}>
              Passe au niveau supérieur quand tes deals le justifient.
            </p>
          </Reveal>

          {/* Toggle global Mensuel / Annuel (-17%) */}
          <Reveal>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '48px' }}>
              <div role="group" aria-label="Période de facturation" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '9999px', padding: '5px' }}>
                <button
                  onClick={() => setYearly(false)}
                  style={{ fontFamily: SYNE, fontSize: '14px', fontWeight: 600, padding: '9px 20px', borderRadius: '9999px', border: 'none', cursor: 'pointer', transition: 'background 200ms ease, color 200ms ease', background: !yearly ? ACCENT : 'transparent', color: !yearly ? BG : MUTED }}
                >Mensuel</button>
                <button
                  onClick={() => setYearly(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: SYNE, fontSize: '14px', fontWeight: 600, padding: '9px 20px', borderRadius: '9999px', border: 'none', cursor: 'pointer', transition: 'background 200ms ease, color 200ms ease', background: yearly ? ACCENT : 'transparent', color: yearly ? BG : MUTED }}
                >
                  Annuel
                  <span style={{ fontFamily: SYNE, fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '6px', background: yearly ? 'rgba(13,13,15,0.18)' : 'rgba(34,197,94,0.16)', color: yearly ? BG : ACCENT }}>-17%</span>
                </button>
              </div>
            </div>
          </Reveal>

          {/* Grille 3 cartes — même fond, Pro distingué par contour vert uniquement */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px', alignItems: 'stretch' }}>
            {/* ── GRATUIT ── */}
            <Reveal delay={0}>
              <div style={{ display: 'flex', flexDirection: 'column', background: SURFACE, border: `1px solid rgba(255,255,255,0.08)`, borderRadius: '16px', padding: '32px', height: '100%' }}>
                <p style={{ fontFamily: SANS, fontSize: '20px', fontWeight: 700, color: TEXT, marginBottom: '6px' }}>Gratuit</p>
                <p style={{ fontFamily: SYNE, fontSize: '13px', color: MUTED, marginBottom: '20px', lineHeight: 1.5 }}>Pour créer ton lien et voir ce que ça donne.</p>
                <PlanPrice monthly={0} yearly={yearly} />
                <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.07)', margin: '4px 0 20px' }} />
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '11px', marginBottom: '28px' }}>
                  {['1 plateforme connectée (YouTube ou Twitch)', 'Page publique avec watermark', 'Lien sponsorable.gg/tonpseudo', 'Stats mises à jour manuellement'].map(feat => (
                    <li key={feat} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontFamily: SYNE, fontSize: '14px', color: MUTED, lineHeight: 1.4 }}>
                      <Check />{feat}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={goRegister}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
                  style={{ marginTop: 'auto', width: '100%', padding: '13px', borderRadius: '10px', border: `1px solid rgba(255,255,255,0.12)`, background: 'rgba(255,255,255,0.05)', color: TEXT, fontFamily: SYNE, fontSize: '15px', fontWeight: 600, cursor: 'pointer', transition: 'background 180ms ease' }}
                >Commencer gratuitement</button>
              </div>
            </Reveal>

            {/* ── PRO — contour vert uniquement, même fond ── */}
            <Reveal delay={200}>
              <div style={{ display: 'flex', flexDirection: 'column', background: SURFACE, border: `1px solid ${ACCENT}`, borderRadius: '16px', padding: '32px', height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <p style={{ fontFamily: SANS, fontSize: '20px', fontWeight: 700, color: ACCENT, margin: 0 }}>Pro</p>
                  <span style={{ fontFamily: SYNE, fontSize: '11px', fontWeight: 700, color: '#0d0d0f', background: ACCENT, padding: '3px 10px', borderRadius: '6px', letterSpacing: '0.04em' }}>Le plus populaire</span>
                </div>
                <p style={{ fontFamily: SYNE, fontSize: '13px', color: MUTED, marginBottom: '20px', lineHeight: 1.5 }}>Pour négocier tes deals avec des chiffres vérifiés, sans bricoler.</p>
                <PlanPrice monthly={19} yearly={yearly} />
                <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.07)', margin: '4px 0 20px' }} />
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '11px', marginBottom: '28px' }}>
                  {['YouTube + Twitch + TikTok + Instagram', 'Page sans watermark, design personnalisé', 'Stats synchronisées automatiquement (API)', 'Analytics kit : qui visite, quand, combien de fois', 'Export PDF pour les marques qui le demandent'].map(feat => (
                    <li key={feat} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontFamily: SYNE, fontSize: '14px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>
                      <Check />{feat}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={goRegister}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
                  style={{ marginTop: 'auto', width: '100%', padding: '13px', borderRadius: '10px', border: `1px solid rgba(255,255,255,0.12)`, background: 'rgba(255,255,255,0.05)', color: TEXT, fontFamily: SYNE, fontSize: '15px', fontWeight: 600, cursor: 'pointer', transition: 'background 180ms ease' }}
                >S&apos;abonner</button>
              </div>
            </Reveal>

          </div>
        </div>
      </section>

      {/* ═══ 11 · CTA FINAL ══════════════════════════════════ */}
      <section style={{ position: 'relative', background: BG, padding: '120px 24px', textAlign: 'center', overflow: 'hidden', borderTop: `1px solid ${BORDER}` }}>
        <Halo color={ACCENT}  size="640px" opacity={0.18} anim="haloBreathe"  dur="10s" top="-180px"   left="50%" />
        <Halo color={VIOLET}  size="420px" opacity={0.09} anim="haloDriftAlt" dur="24s" bottom="-120px" left="20%" />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '720px', margin: '0 auto' }}>
          <Reveal>
            <h2 style={{ fontFamily: DISPLAY, fontSize: 'clamp(48px, 6vw, 72px)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: '20px' }}>
              <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>Deviens</span>{' '}
              <span style={{ color: ACCENT }}>Sponsorable.</span>
            </h2>
            <p style={{ fontFamily: SYNE, fontSize: '18px', color: MUTED, lineHeight: 1.7, maxWidth: '520px', margin: '0 auto 36px' }}>
              La prochaine fois qu&apos;une marque te contacte, t&apos;as un lien à la hauteur de ton audience à lui envoyer. En 2 minutes.
            </p>
            <button
              onClick={goRegister}
              style={ctaPrimary}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#1daa50'; el.style.boxShadow = '0 8px 32px rgba(34,197,94,0.5)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = ACCENT; el.style.boxShadow = '0 6px 24px rgba(34,197,94,0.35)' }}
            >
              Créer mon lien gratuitement →
            </button>
            <p style={{ fontFamily: MONO, fontSize: '11px', color: '#333', marginTop: '18px', letterSpacing: '0.03em' }}>
              Sans carte bancaire · Annulable à tout moment
            </p>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  )
}
