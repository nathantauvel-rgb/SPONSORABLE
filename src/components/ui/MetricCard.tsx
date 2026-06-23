import { SURFACE, BORDER, MUTED, ACCENT, SYNE, NUM } from '@/lib/ds'

interface MetricCardProps {
  label: string
  value: string
  change: string
  positive?: boolean
}

const MetricCard = ({ label, value, change, positive = true }: MetricCardProps) => (
  <div
    style={{
      background: SURFACE,
      border: `1px solid ${BORDER}`,
      borderRadius: '12px',
      padding: '20px 24px',
      transition: 'border-color 200ms ease, box-shadow 200ms ease',
      cursor: 'default',
    }}
    onMouseEnter={e => {
      const el = e.currentTarget as HTMLDivElement
      el.style.borderColor = `rgba(29,170,80,0.3)`
      el.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)'
    }}
    onMouseLeave={e => {
      const el = e.currentTarget as HTMLDivElement
      el.style.borderColor = BORDER
      el.style.boxShadow = 'none'
    }}
  >
    <p style={{ fontFamily: SYNE, fontSize: '12px', color: MUTED, marginBottom: '8px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {label}
    </p>
    <p style={{ fontFamily: NUM, fontSize: '24px', fontWeight: 600, color: ACCENT, lineHeight: 1.2, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
      {value}
    </p>
    <p style={{ fontFamily: SYNE, fontSize: '12px', color: positive ? ACCENT : '#fb7185', marginTop: '6px', fontWeight: 500 }}>
      {change}
    </p>
  </div>
)

export default MetricCard
