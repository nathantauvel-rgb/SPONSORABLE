'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/button'
import Footer from '@/components/layout/Footer'
import Navbar from '@/components/layout/Navbar'
import Reveal, { useInView } from '@/components/ui/Reveal'
import { exampleCreators } from '@/data/mockData'

/* ── Palette Neon Arena ─────────────────────────────────── */
const INK = '#07090f'          // base sombre
const INK2 = '#0a0d16'         // surface élevée
const INK_DEEP = '#090711'     // Problème (teinté corail froid)
const PAPER = '#f6f5f1'        // papier chaud
const PAPER_VIOLET = '#f1eff7' // papier teinté violet
const GREEN = '#16a34a'        // action + marque
const GREEN_BRIGHT = '#34d399' // glow / accent vif
const VIOLET = '#7c5cff'       // atmosphère (halos) — ressenti, pas vu
const CORAL = '#fb7185'        // la perte
const GOLD = '#f5b544'         // micro-valeur / deal
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

/* ── Halo atmosphérique ─────────────────────────────────── */
const Halo = ({ color, size, opacity = 0.12, anim = 'haloDrift', dur = '22s', ...pos }: {
  color: string; size: string; opacity?: number; anim?: string; dur?: string
  top?: string; left?: string; right?: string; bottom?: string
}) => (
  <div aria-hidden style={{ position: 'absolute', width: size, height: size, borderRadius: '50%', background: `radial-gradient(circle, ${color} 0%, transparent 70%)`, opacity, filter: 'blur(24px)', pointerEvents: 'none', animation: `${anim} ${dur} ease-in-out infinite`, zIndex: 0, ...pos }} />
)

/* ── Label de section ───────────────────────────────────── */
const SectionLabel = ({ n, children, dark = false }: { n: string; children: string; dark?: boolean }) => (
  <div style={{ fontFamily: MONO, fontSize: '12px', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
    <span style={{ color: GREEN_BRIGHT }}>{n}</span>
    <span style={{ width: '24px', height: '1px', background: dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.18)' }} />
    <span style={{ color: dark ? 'rgba(255,255,255,0.45)' : '#94a3b8' }}>{children}</span>
  </div>
)

/* ── Browser mockup (Hero) ──────────────────────────────── */
const BrowserMockup = () => (
  <div style={{ borderRadius: '10px', overflow: 'hidden', boxShadow: '0 24px 70px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', background: 'white', width: '100%', maxWidth: '520px' }}>
    <div style={{ background: '#f1f5f9', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', gap: '5px' }}>
        {['#ef4444', '#f59e0b', '#22c55e'].map(c => <div key={c} style={{ width: '9px', height: '9px', borderRadius: '50%', background: c }} />)}
      </div>
      <div style={{ flex: 1, background: 'white', borderRadius: '5px', padding: '4px 12px', fontSize: '11px', color: '#94a3b8', border: '1px solid rgba(0,0,0,0.08)' }}>sponsorable.gg/tonpseudo</div>
    </div>
    <div style={{ height: '380px', overflow: 'hidden' }}>
      <div style={{ animation: 'scrollMockup 7s ease-in-out infinite' }}>
        <div style={{ padding: '28px 24px 20px', textAlign: 'center', background: 'white' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: GREEN, color: 'white', fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 0 0 3px rgba(22,163,74,0.15)' }}>AP</div>
          <p style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>AlexPlays</p>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '10px' }}>
            {['Gaming', 'Minecraft', 'FPS'].map(n => <span key={n} style={{ background: 'rgba(134,239,172,0.2)', color: '#15803d', border: '1px solid rgba(134,239,172,0.4)', borderRadius: '9999px', padding: '3px 10px', fontSize: '11px', fontWeight: 500 }}>{n}</span>)}
          </div>
          <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5, maxWidth: '300px', margin: '0 auto' }}>Créateur gaming FR depuis 2019. Minecraft, FPS compétitif et streams quotidiens.</p>
        </div>
        <div style={{ padding: '0 16px 16px', background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: GREEN }} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#15803d' }}>Stats en direct</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderTop: '3px solid #ef4444', borderRadius: '8px', padding: '16px' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', fontWeight: 500 }}>YouTube</p>
              <p style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', lineHeight: 1, letterSpacing: '-0.03em' }}>87 400</p>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>abonnés</p>
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', gap: '12px' }}>
                <div><p style={{ fontSize: '13px', fontWeight: 700, color: GREEN }}>54 000</p><p style={{ fontSize: '10px', color: '#94a3b8' }}>vues / vidéo</p></div>
                <div><p style={{ fontSize: '13px', fontWeight: 700, color: GREEN }}>+18%</p><p style={{ fontSize: '10px', color: '#94a3b8' }}>croissance</p></div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[{ name: 'Twitch', color: '#9146ff', value: '12 300', label: 'viewers' }, { name: 'TikTok', color: '#000', value: '34 200', label: 'abonnés' }, { name: 'Instagram', color: '#e1306c', value: '18 500', label: 'abonnés' }].map(p => (
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
        <div style={{ padding: '16px', background: '#f8fafc', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Audience</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[{ label: '18–24 ans', pct: 38 }, { label: '25–34 ans', pct: 24 }, { label: '35–44 ans', pct: 18 }].map(a => (
              <div key={a.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ fontSize: '11px', color: '#475569' }}>{a.label}</span>
                  <span style={{ fontSize: '11px', color: GREEN, fontWeight: 600 }}>{a.pct}%</span>
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

/* ── Faux PDF Canva (AVANT — figé, désaturé) ────────────── */
const StalePdfMock = () => (
  <div style={{ position: 'relative', transform: 'rotate(-1.6deg)', filter: 'saturate(0.55)' }}>
    <div style={{ position: 'absolute', top: '-10px', right: '14px', zIndex: 2, background: '#475569', color: 'white', fontFamily: MONO, fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', padding: '4px 9px', borderRadius: '3px', transform: 'rotate(3deg)', boxShadow: '0 2px 6px rgba(0,0,0,0.25)' }}>mediakit_final_V3.pdf</div>
    <div style={{ background: '#e9e7df', border: '1px solid rgba(0,0,0,0.14)', borderRadius: '2px', padding: '26px 24px', boxShadow: '0 12px 30px rgba(0,0,0,0.3)', maxWidth: '380px', width: '100%' }}>
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
          <span style={{ fontWeight: 700 }}><span style={{ textDecoration: 'line-through', color: '#b0b7b4', marginRight: '6px' }}>71 200</span>87 400</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569' }}><span>Vues / vidéo</span><span style={{ fontWeight: 700 }}>~50 000 ?</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569' }}><span>Engagement</span><span style={{ fontWeight: 700 }}>« bon »</span></div>
      </div>
      <div style={{ background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.3)', borderRadius: '4px', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '7px' }}>
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#d97706', flexShrink: 0 }} />
        <span style={{ fontSize: '11px', color: '#b45309', fontWeight: 500 }}>Dernière mise à jour : il y a 6 mois</span>
      </div>
    </div>
  </div>
)

/* ── Carte "ton lien" (APRÈS — vivant) ──────────────────── */
const LiveKitCard = () => (
  <div style={{ position: 'relative', background: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '26px 24px', boxShadow: '0 18px 50px rgba(22,163,74,0.22)', maxWidth: '380px', width: '100%' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: GREEN, flexShrink: 0, animation: 'livePulse 2s ease-out infinite' }} />
      <span style={{ fontFamily: MONO, fontSize: '12px', color: '#64748b' }}>sponsorable.gg/alexplays</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
      <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: GREEN, color: 'white', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>AP</div>
      <div>
        <p style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>AlexPlays</p>
        <div style={{ display: 'flex', gap: '4px', marginTop: '3px' }}>
          {['Gaming', 'FPS'].map(n => <span key={n} style={{ fontSize: '10px', fontWeight: 500, color: '#15803d', background: 'rgba(134,239,172,0.2)', border: '1px solid rgba(134,239,172,0.4)', borderRadius: '9999px', padding: '2px 8px' }}>{n}</span>)}
        </div>
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
      {[{ k: 'Abonnés YouTube', v: '87 400' }, { k: 'Vues / vidéo', v: '54 000' }, { k: 'Engagement', v: '4,2 %' }].map(s => (
        <div key={s.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
          <span style={{ color: '#475569' }}>{s.k}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#0f172a' }}>
            {s.v}
            <span style={{ fontFamily: MONO, fontSize: '9px', color: '#a16207', background: 'rgba(245,181,68,0.16)', border: '1px solid rgba(245,181,68,0.4)', borderRadius: '3px', padding: '1px 5px' }}>vérifié</span>
          </span>
        </div>
      ))}
    </div>
    <div style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.22)', borderRadius: '4px', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '7px' }}>
      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: GREEN, flexShrink: 0 }} />
      <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 500 }}>Synchronisé via API · à jour il y a 2 min</span>
    </div>
  </div>
)

/* ── Données ────────────────────────────────────────────── */
const leaks = [
  { t: 'Des chiffres invérifiables', d: 'La marque ne peut pas confirmer tes stats. Donc elle en doute. Donc elle négocie à la baisse.' },
  { t: 'Un document déjà périmé', d: 'Tes chiffres ont bougé la semaine d\'après. Ton PDF, lui, te sous-estime pour les 6 prochains mois.' },
  { t: 'Du temps à chaque demande', d: 'Refaire le même export, le réuploader, renvoyer le mail. À chaque marque. À chaque fois.' },
]
const steps = [
  { num: '01', title: 'Connecte tes plateformes', desc: 'YouTube, Twitch, TikTok, Instagram. Tes stats rentrent toutes seules — rien à saisir à la main.' },
  { num: '02', title: 'Ton kit se génère', desc: 'Design pro, stats vérifiées via API, données structurées. Prêt en moins de 2 minutes.' },
  { num: '03', title: 'Tu envoies un lien', desc: 'Pas un PDF. Quand tes stats bougent, le lien se met à jour seul. Jamais besoin de le refaire.' },
]
const diffAxes = [
  { n: '01', t: 'Vérifié, pas recopié', d: 'Tes stats viennent direct des API YouTube et Twitch. La marque sait qu\'elles sont réelles — elle arrête de négocier dans le doute.', c: GREEN },
  { n: '02', t: 'Vivant, pas figé', d: 'Ton lien se met à jour seul. Tu ne renverras plus jamais des chiffres d\'il y a 6 mois. Ta croissance joue pour toi.', c: VIOLET },
  { n: '03', t: 'Tu choisis ce que tu montres', d: 'Tu mets en avant tes meilleures plateformes et métriques. Le reste, tu le masques. Plus de contrôle qu\'un screenshot, pas moins.', c: GREEN },
  { n: '04', t: 'Zéro admin', d: 'Une marque te DM ? Tu envoies un lien. Pas de PDF à rouvrir, réexporter, réuploader. Tu récupères ce temps.', c: VIOLET },
]
const profiles = [
  { tag: 'Demandes régulières', title: 'Tu reçois des sponsors régulièrement', desc: 'Réponds vite et bien, sans bricoler un PDF à chaque fois. Un lien, et c\'est réglé.', accent: GREEN, glow: 'rgba(22,163,74,0.18)', pad: '32px 28px' },
  { tag: 'Marques premium', title: 'Tu veux démarcher du premium', desc: 'Les équipes marketing ont un niveau d\'exigence. Présente-toi à leur hauteur, pas en dessous.', accent: VIOLET, glow: 'rgba(124,92,255,0.2)', pad: '44px 28px' },
  { tag: 'Gain de temps', title: 'Tu veux arrêter l\'admin sponsor', desc: 'Le va-et-vient emails / exports / relances te bouffe des heures. Sponsorable t\'en rend une partie.', accent: GOLD, glow: 'rgba(245,181,68,0.2)', pad: '32px 28px' },
]
const faqs = [
  { q: 'Et si la marque veut un PDF, pas un lien ?', a: 'Tu peux exporter ton kit en PDF (offre Pro) — mais généré depuis tes vraies stats, pas tapé à la main. Tu gardes le lien pour ceux qui le préfèrent, et le PDF pour les autres.' },
  { q: 'Quelles plateformes, et c\'est vraiment vérifié ?', a: 'YouTube et Twitch sont connectés via OAuth officiel : les stats viennent directement de leurs API, pas de scraping. TikTok et Instagram complètent ton profil.' },
  { q: 'Je garde le contrôle de ce qui s\'affiche ?', a: 'Oui. Tu choisis quelles plateformes et quelles métriques apparaissent. Tu mets en avant tes points forts, tu masques ce que tu ne veux pas montrer.' },
  { q: 'Ça me prend combien de temps de migrer ?', a: 'Environ 2 minutes. Tu connectes tes comptes, l\'import est automatique, ton kit se génère. Pas de saisie manuelle, pas de mise en page à refaire.' },
  { q: 'C\'est vraiment gratuit ?', a: 'Oui, un palier gratuit te laisse créer ton lien avec une plateforme connectée. Tu passes Pro quand tu veux le multi-plateformes, le sans-watermark et la synchro automatique.' },
]

/* ── Page ───────────────────────────────────────────────── */
export default function LandingPage() {
  const [email, setEmail] = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const router = useRouter()
  const steps_iv = useInView<HTMLDivElement>(0.3)

  const goRegister = () => router.push('/login?register=1')

  return (
    <div style={{ background: PAPER, minHeight: '100vh' }}>
      <Navbar dark />

      {/* ═══ 01 · HERO ═══ */}
      <section style={{ position: 'relative', paddingTop: '120px', paddingBottom: '88px', overflow: 'hidden', background: INK }}>
        <Halo color={GREEN} size="620px" opacity={0.16} anim="haloDrift" dur="24s" bottom="-180px" left="-160px" />
        <Halo color={VIOLET} size="560px" opacity={0.11} anim="haloDriftAlt" dur="28s" top="-160px" right="-120px" />
        <div className="hero-grid">
          <div>
            <div style={{ marginBottom: '22px', fontFamily: MONO, fontSize: '12px', letterSpacing: '0.16em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: GREEN_BRIGHT, fontWeight: 600 }}>Deviens Sponsorable</span>
              <span style={{ width: '20px', height: '1px', background: 'rgba(255,255,255,0.25)' }} />
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>bêta privée · gaming FR</span>
            </div>
            <h1 className="font-hero" style={{ marginBottom: '24px', textAlign: 'left', lineHeight: 1.02 }}>
              <span style={{ color: '#ffffff' }}>Arrête de négocier tes deals</span>{' '}
              <span style={{ color: GREEN_BRIGHT, textShadow: '0 0 32px rgba(52,211,153,0.35)' }}>avec un PDF Canva.</span>
            </h1>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.55)', marginBottom: '40px', lineHeight: 1.75, maxWidth: '460px' }}>
              Connecte tes plateformes, on génère ton media kit gaming à partir de tes vraies stats. Un lien sponsor-ready, toujours à jour — à la hauteur de ton audience, pas en dessous.
            </p>
            <form
              onSubmit={e => { e.preventDefault(); const p = email ? `?email=${encodeURIComponent(email)}&register=1` : '?register=1'; router.push(`/login${p}`) }}
              style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', maxWidth: '460px' }}
            >
              <input type="email" placeholder="ton@email.com" value={email} onChange={e => setEmail(e.target.value)}
                style={{ flex: 1, minWidth: '180px', background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.11)', borderRadius: '8px', padding: '12px 16px', fontSize: '15px', color: 'white', outline: 'none', transition: 'all 150ms ease' }}
                onFocus={e => { e.target.style.borderColor = 'rgba(52,211,153,0.55)'; e.target.style.background = 'rgba(52,211,153,0.06)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.11)'; e.target.style.background = 'rgba(255,255,255,0.06)' }}
              />
              <button type="submit"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: GREEN, color: 'white', border: 'none', borderRadius: '8px', padding: '12px 22px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 6px 20px rgba(22,163,74,0.35)', transition: 'all 150ms ease' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#15803d'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(22,163,74,0.5)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = GREEN; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(22,163,74,0.35)' }}
              >Créer mon lien →</button>
            </form>
            <p style={{ fontFamily: MONO, fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '16px', letterSpacing: '0.03em' }}>Sans CB · 2 min · YouTube · Twitch · TikTok · Instagram</p>
          </div>
          <div className="hero-mockup">
            <div style={{ width: '100%', maxWidth: '520px', animation: 'floatY 6s ease-in-out infinite' }}><BrowserMockup /></div>
          </div>
        </div>
      </section>

      {/* ═══ 02 · PROBLÈME ═══ */}
      <section style={{ position: 'relative', background: INK_DEEP, padding: '96px 24px', overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <Halo color={CORAL} size="500px" opacity={0.08} anim="haloDriftAlt" dur="26s" top="40px" right="-140px" />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto' }}>
          <Reveal>
            <SectionLabel n="02" dark>Le vrai coût de ton PDF</SectionLabel>
            <h2 style={{ fontSize: 'clamp(30px, 4vw, 46px)', fontWeight: 700, letterSpacing: '-0.025em', color: '#fff', lineHeight: 1.12, marginBottom: '28px', maxWidth: '720px' }}>
              Tu signes des deals.<br />Mais tu les pitches avec quoi ?
            </h2>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, maxWidth: '600px', marginBottom: '12px' }}>
              Un PDF Canva monté à la main. Un Drive avec trois captures. Des stats recopiées il y a six mois qui ne ressemblent plus à ton compte d&apos;aujourd&apos;hui.
            </p>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, maxWidth: '600px', marginBottom: '48px' }}>
              Le problème, c&apos;est pas que ça marche pas. Ça marche — un peu. Le problème, c&apos;est <strong style={{ color: '#fff', fontWeight: 600 }}>tout ce que tu laisses sur la table</strong>&nbsp;:
            </p>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {leaks.map((l, i) => (
              <Reveal key={i} delay={i * 80}>
                <div style={{ background: 'rgba(251,113,133,0.04)', border: '1px solid rgba(251,113,133,0.16)', borderLeft: `2px solid ${CORAL}`, borderRadius: '10px', padding: '28px 26px', height: '100%' }}>
                  <div style={{ fontFamily: MONO, fontSize: '13px', color: CORAL, marginBottom: '14px' }}>— {String(i + 1).padStart(2, '0')}</div>
                  <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#fff', marginBottom: '10px' }}>{l.t}</h3>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>{l.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={120}>
            <p style={{ fontSize: '20px', color: '#fff', fontWeight: 600, lineHeight: 1.5, maxWidth: '640px', marginTop: '48px' }}>
              Tu fais un contenu de pro. Au moment où tu parles d&apos;argent, tu te présentes comme un amateur.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ═══ 03 · SOLUTION (slab vert) ═══ */}
      <section style={{ position: 'relative', background: `linear-gradient(110deg, #15803d 0%, ${GREEN} 55%, #15a34a 100%)`, padding: '68px 24px', overflow: 'hidden' }}>
        <Halo color={GREEN_BRIGHT} size="480px" opacity={0.4} anim="haloBreathe" dur="9s" top="-160px" left="40%" />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto' }}>
          <Reveal>
            <p style={{ fontSize: 'clamp(24px, 3.2vw, 36px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff', lineHeight: 1.25, maxWidth: '900px' }}>
              Sponsorable transforme tes vraies stats en un media kit que les marques prennent au sérieux. <span style={{ color: 'rgba(255,255,255,0.72)' }}>Un lien. Toujours à jour.</span>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ═══ 04 · EXEMPLES ═══ */}
      <section id="exemples" style={{ position: 'relative', background: PAPER, padding: '96px 24px', overflow: 'hidden' }}>
        <Halo color={VIOLET} size="600px" opacity={0.07} anim="haloDrift" dur="30s" top="120px" left="50%" />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto' }}>
          <Reveal>
            <SectionLabel n="04">Exemples réels</SectionLabel>
            <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#0f172a', marginBottom: '14px', lineHeight: 1.18 }}>
              Voilà ce qu&apos;une marque voit<br />quand tu envoies ton lien.
            </h2>
            <p style={{ fontSize: '17px', color: '#475569', maxWidth: '520px', marginBottom: '52px' }}>
              Des profils de démonstration, dans plusieurs styles. Le tien ressemblera à ça — avec tes vraies stats.
            </p>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            {exampleCreators.map((c, i) => {
              const t = c.theme
              return (
                <Reveal key={c.id} delay={i * 70}>
                  <div
                    style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: '10px', overflow: 'hidden', boxShadow: t.boxShadow || '0 2px 12px rgba(0,0,0,0.06)', transition: 'transform 200ms ease, box-shadow 200ms ease', height: '100%' }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = `0 16px 36px ${t.accent}33` }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = t.boxShadow || '0 2px 12px rgba(0,0,0,0.06)' }}
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
                            {c.niches.slice(0, 2).map(n => <span key={n} style={{ fontSize: '10px', fontWeight: 500, color: t.subtext, background: t.statBg, border: `1px solid ${t.statBorder}`, borderRadius: '9999px', padding: '2px 8px' }}>{n}</span>)}
                          </div>
                        </div>
                      </div>
                      <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderLeft: `3px solid ${t.accent}`, borderRadius: '8px', padding: '14px 16px', marginBottom: '10px' }}>
                        <p style={{ fontSize: '10px', fontWeight: 500, color: t.subtext, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px' }}>{c.platform}</p>
                        <p style={{ fontSize: '26px', fontWeight: 800, color: t.text, letterSpacing: '-0.03em', lineHeight: 1 }}>{c.mainStat.value}</p>
                        <p style={{ fontSize: '10px', color: t.subtext, marginTop: '2px' }}>{c.mainStat.label}</p>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                        {c.stats.slice(0, 2).map(s => (
                          <div key={s.label} style={{ background: t.statBg, border: `1px solid ${t.statBorder}`, borderRadius: '8px', padding: '10px 12px' }}>
                            <p style={{ fontSize: '14px', fontWeight: 700, color: t.accent, letterSpacing: '-0.01em' }}>{s.value}</p>
                            <p style={{ fontSize: '9px', color: t.subtext, marginTop: '2px' }}>{s.label}</p>
                          </div>
                        ))}
                      </div>
                      <a href={`/${c.pseudo}`}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: t.accent, textDecoration: 'none', background: `${t.accent}14`, border: `1px solid ${t.accent}30`, borderRadius: '8px', padding: '8px 14px', transition: 'background 150ms' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${t.accent}22` }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${t.accent}14` }}
                      >Voir le kit →</a>
                    </div>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══ 05 · COMMENT ÇA MARCHE ═══ */}
      <section id="comment-ca-marche" style={{ background: '#fff', padding: '96px 24px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <Reveal>
            <SectionLabel n="05">Comment ça marche</SectionLabel>
            <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#0f172a', marginBottom: '12px' }}>Simple comme envoyer un lien.</h2>
            <p style={{ fontSize: '17px', color: '#475569', lineHeight: 1.7, maxWidth: '460px', marginBottom: '56px' }}>Trois étapes. Pas d&apos;export, pas de mise à jour manuelle, pas de mise en page à refaire.</p>
          </Reveal>
          <div className="steps-wrap" ref={steps_iv.ref}>
            <div className={`steps-line${steps_iv.inView ? ' steps-line--in' : ''}`} />
            <div className="steps-grid">
              {steps.map((s, i) => (
                <Reveal key={i} delay={i * 130} style={{ background: '#fff' }}>
                  <div style={{ padding: '34px 28px 12px', borderRight: i < steps.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none', position: 'relative', zIndex: 1 }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#fff', border: `1.5px solid ${i === 1 ? VIOLET : GREEN}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: '17px', fontWeight: 700, color: i === 1 ? VIOLET : GREEN, marginBottom: '22px', boxShadow: `0 6px 18px ${i === 1 ? 'rgba(124,92,255,0.18)' : 'rgba(22,163,74,0.18)'}` }}>{s.num}</div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>{s.title}</h3>
                    <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.65 }}>{s.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 06 · DIFFÉRENCIATION ═══ */}
      <section style={{ position: 'relative', background: INK, padding: '96px 24px', overflow: 'hidden' }}>
        <Halo color={VIOLET} size="540px" opacity={0.1} anim="haloDriftAlt" dur="26s" top="80px" right="-120px" />
        <Halo color={GREEN} size="520px" opacity={0.1} anim="haloDrift" dur="30s" bottom="-160px" left="-120px" />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto' }}>
          <Reveal>
            <SectionLabel n="06" dark>PDF vs lien vivant</SectionLabel>
            <h2 style={{ fontSize: 'clamp(28px, 3.8vw, 44px)', fontWeight: 700, letterSpacing: '-0.025em', color: '#fff', lineHeight: 1.15, marginBottom: '14px', maxWidth: '760px' }}>
              Un PDF, c&apos;est une photo.<br />Sponsorable, c&apos;est ton compte en direct.
            </h2>
            <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.5)', maxWidth: '560px', marginBottom: '56px' }}>La différence n&apos;est pas esthétique. Elle est dans ce qu&apos;une marque peut faire avec.</p>
          </Reveal>
          <Reveal>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', alignItems: 'center', marginBottom: '64px' }}>
              <div>
                <p style={{ fontFamily: MONO, fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '24px' }}>Avant — ton PDF</p>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '0 10px' }}><StalePdfMock /></div>
              </div>
              <div>
                <p style={{ fontFamily: MONO, fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', color: GREEN_BRIGHT, marginBottom: '24px' }}>Après — ton lien</p>
                <div style={{ display: 'flex', justifyContent: 'center' }}><LiveKitCard /></div>
              </div>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            {diffAxes.map((a, i) => (
              <Reveal key={a.n} delay={i * 70}>
                <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderTop: `2px solid ${a.c}`, borderRadius: '10px', padding: '28px 26px', height: '100%', transition: 'background 200ms ease' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.025)' }}
                >
                  <div style={{ fontFamily: MONO, fontSize: '13px', color: a.c, marginBottom: '14px' }}>{a.n}</div>
                  <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#fff', marginBottom: '10px' }}>{a.t}</h3>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>{a.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={100}>
            <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.6)', marginTop: '40px', maxWidth: '640px' }}>
              Tu peux continuer avec ton Canva. Il marchera. <span style={{ color: '#fff', fontWeight: 600 }}>Juste un peu moins bien que toi.</span>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ═══ 07 · POUR QUI ═══ */}
      <section style={{ position: 'relative', background: PAPER_VIOLET, padding: '96px 24px', overflow: 'hidden' }}>
        <Halo color={VIOLET} size="560px" opacity={0.08} anim="haloDrift" dur="28s" top="-120px" right="10%" />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto' }}>
          <Reveal>
            <SectionLabel n="07">Pour qui c&apos;est</SectionLabel>
            <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#0f172a', marginBottom: '52px', lineHeight: 1.18 }}>
              T&apos;as l&apos;audience.<br />Il te manque l&apos;outil.
            </h2>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', alignItems: 'start' }}>
            {profiles.map((p, i) => (
              <Reveal key={p.title} delay={i * 80}>
                <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderTop: `2px solid ${p.accent}`, borderRadius: '10px', padding: p.pad, transition: 'transform 200ms ease, box-shadow 200ms ease', height: '100%' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = `0 18px 40px ${p.glow}` }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none' }}
                >
                  <span style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 600, color: p.accent, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '14px' }}>{p.tag}</span>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '12px', lineHeight: 1.3 }}>{p.title}</h3>
                  <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.75 }}>{p.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 08 · POURQUOI ═══ */}
      <section style={{ background: '#efeef6', padding: '96px 24px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <Reveal>
            <SectionLabel n="08">Notre constat</SectionLabel>
            <h2 style={{ fontSize: 'clamp(26px, 3vw, 36px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#0f172a', marginBottom: '32px', lineHeight: 1.2 }}>Pourquoi on a construit Sponsorable</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <p style={{ fontSize: '18px', color: '#334155', lineHeight: 1.8 }}>
                On a vu des créateurs qui font des centaines de milliers de vues envoyer des <strong style={{ color: '#0f172a' }}>captures d&apos;écran dans des emails</strong>. Des PDF Canva avec les chiffres d&apos;il y a six mois. Des Drive partagés à la va-vite.
              </p>
              <p style={{ fontSize: '18px', color: '#334155', lineHeight: 1.8 }}>
                Des créateurs établis, qui signent déjà des deals — et qui se présentent quand même comme s&apos;ils débutaient. <strong style={{ color: GREEN, fontWeight: 700 }}>Ça nous a paru absurde.</strong>
              </p>
              <p style={{ fontSize: '18px', color: '#334155', lineHeight: 1.8 }}>
                Un lien. Des stats vérifiées via API officielle. Un design qui ne fait pas amateur. C&apos;est tout ce qu&apos;il faut pour négocier à la hauteur de ce que tu vaux vraiment.
              </p>
            </div>
            <div style={{ marginTop: '40px', paddingTop: '32px', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
              <p style={{ fontSize: '14px', color: '#64748b', fontStyle: 'italic', lineHeight: 1.65 }}>
                Sponsorable est en bêta privée. On le construit avec des créateurs qui font déjà des partenariats, pas pour eux. Si t&apos;as des retours, on lit tout.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ 09 · FAQ ═══ */}
      <section id="faq" style={{ background: PAPER, padding: '96px 24px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <Reveal>
            <SectionLabel n="09">Objections légitimes</SectionLabel>
            <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#0f172a', marginBottom: '48px' }}>Ce que tu te demandes sûrement.</h2>
          </Reveal>
          <Reveal>
            <div style={{ borderTop: '1px solid rgba(0,0,0,0.1)' }}>
              {faqs.map((f, i) => {
                const open = openFaq === i
                return (
                  <div key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.1)', background: open ? 'rgba(124,92,255,0.03)' : 'transparent', transition: 'background 200ms ease' }}>
                    <button onClick={() => setOpenFaq(open ? null : i)}
                      style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', background: 'none', border: 'none', cursor: 'pointer', padding: '22px 12px', textAlign: 'left' }}>
                      <span style={{ fontSize: '17px', fontWeight: 600, color: '#0f172a' }}>{f.q}</span>
                      <span style={{ fontFamily: MONO, fontSize: '20px', color: open ? VIOLET : GREEN, flexShrink: 0, transition: 'transform 240ms ease, color 240ms ease', transform: open ? 'rotate(45deg)' : 'none', lineHeight: 1 }}>+</span>
                    </button>
                    <div style={{ maxHeight: open ? '240px' : '0', overflow: 'hidden', transition: 'max-height 240ms ease' }}>
                      <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.75, padding: '0 12px 24px', maxWidth: '620px' }}>{f.a}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ 10 · PRICING ═══ */}
      <section id="tarifs" style={{ background: '#fff', padding: '96px 24px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <Reveal>
            <SectionLabel n="10">Tarifs</SectionLabel>
            <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#0f172a', marginBottom: '12px' }}>Commence gratuitement.</h2>
            <p style={{ fontSize: '17px', color: '#475569', marginBottom: '52px' }}>Passe au niveau supérieur quand tes deals le justifient.</p>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px', alignItems: 'start' }}>
            <Reveal delay={0}>
              <div style={{ background: PAPER, border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', padding: '32px', height: '100%' }}>
                <p style={{ fontFamily: MONO, fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Gratuit</p>
                <p style={{ marginBottom: '10px' }}><span style={{ fontSize: '36px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>0€</span></p>
                <p style={{ fontSize: '14px', color: '#475569', marginBottom: '24px', lineHeight: 1.65 }}>Pour créer ton lien et voir ce que ça donne.</p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {['1 plateforme connectée (YouTube ou Twitch)', 'Page publique avec watermark', 'Lien sponsorable.gg/tonpseudo', 'Stats mises à jour manuellement'].map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '14px', color: '#475569' }}><span style={{ color: GREEN, fontWeight: 700, marginTop: '1px', flexShrink: 0 }}>✓</span>{f}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={90}>
              <div style={{ position: 'relative', background: '#fff', border: `2px solid ${GREEN}`, borderRadius: '12px', padding: '32px', boxShadow: '0 12px 40px rgba(22,163,74,0.12)', height: '100%' }}>
                <span style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: `linear-gradient(100deg, ${GREEN}, ${VIOLET})`, color: 'white', borderRadius: '9999px', padding: '4px 16px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>Le plus complet</span>
                <p style={{ fontFamily: MONO, fontSize: '12px', fontWeight: 600, color: GREEN, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Pro</p>
                <p style={{ marginBottom: '10px' }}><span style={{ fontSize: '36px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>19€</span><span style={{ fontSize: '14px', color: '#94a3b8', marginLeft: '4px' }}>/mois</span></p>
                <p style={{ fontSize: '14px', color: '#475569', marginBottom: '24px', lineHeight: 1.65 }}>Pour négocier tes deals avec des chiffres vérifiés, sans bricoler.</p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {['YouTube + Twitch + TikTok + Instagram', 'Page sans watermark, design personnalisé', 'Stats synchronisées automatiquement (API)', 'Analytics kit : qui visite, quand, combien de fois', 'Export PDF pour les marques qui le demandent'].map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '14px', color: '#475569' }}><span style={{ color: GREEN, fontWeight: 700, marginTop: '1px', flexShrink: 0 }}>✓</span>{f}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={180}>
              <div style={{ background: PAPER, border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', padding: '32px', height: '100%' }}>
                <p style={{ fontFamily: MONO, fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Agence</p>
                <p style={{ marginBottom: '10px' }}><span style={{ fontSize: '36px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>49€</span><span style={{ fontSize: '14px', color: '#94a3b8', marginLeft: '4px' }}>/mois</span></p>
                <p style={{ fontSize: '14px', color: '#475569', marginBottom: '24px', lineHeight: 1.65 }}>Pour les managers et agences multi-créateurs.</p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {["Jusqu'à 20 créateurs gérés", 'Dashboard manager centralisé', 'White-label (votre domaine)', 'Priorité support'].map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '14px', color: '#475569' }}><span style={{ color: GREEN, fontWeight: 700, marginTop: '1px', flexShrink: 0 }}>✓</span>{f}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══ 11 · CTA FINAL (bookend) ═══ */}
      <section style={{ position: 'relative', background: INK, padding: '120px 24px', textAlign: 'center', overflow: 'hidden' }}>
        <Halo color={GREEN} size="640px" opacity={0.18} anim="haloBreathe" dur="10s" top="-180px" left="50%" />
        <Halo color={VIOLET} size="420px" opacity={0.1} anim="haloDriftAlt" dur="24s" bottom="-120px" left="20%" />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '720px', margin: '0 auto' }}>
          <Reveal>
            <h2 className="font-hero" style={{ marginBottom: '20px', lineHeight: 1.05 }}>
              <span style={{ color: 'rgba(255,255,255,0.78)', fontWeight: 500 }}>Deviens</span>{' '}
              <span style={{ color: GREEN_BRIGHT, textShadow: '0 0 40px rgba(52,211,153,0.45)' }}>Sponsorable.</span>
            </h2>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, maxWidth: '520px', margin: '0 auto 36px' }}>
              La prochaine fois qu&apos;une marque te contacte, t&apos;as un lien à la hauteur de ton audience à lui envoyer. En 2 minutes.
            </p>
            <Button variant="primary" arrow onClick={goRegister}>Créer mon lien gratuitement</Button>
            <p style={{ fontFamily: MONO, fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '18px', letterSpacing: '0.03em' }}>Sans carte bancaire · Annulable à tout moment</p>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  )
}
