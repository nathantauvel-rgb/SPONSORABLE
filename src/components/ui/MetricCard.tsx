interface MetricCardProps {
  label: string
  value: string
  change: string
  positive?: boolean
}

const MetricCard = ({ label, value, change, positive = true }: MetricCardProps) => (
  <div
    className="card-standard p-6 cursor-default"
    style={{ transition: 'all 200ms ease' }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLDivElement).style.boxShadow =
        '0 0 0 2px rgba(22,163,74,0.15), 0 8px 24px rgba(0,0,0,0.08)'
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
    }}
  >
    <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px', fontWeight: 500 }}>
      {label}
    </p>
    <p style={{ fontSize: '28px', fontWeight: 700, color: '#16a34a', lineHeight: 1.2 }}>
      {value}
    </p>
    <p
      style={{
        fontSize: '12px',
        color: positive ? '#16a34a' : '#ef4444',
        marginTop: '6px',
        fontWeight: 500,
      }}
    >
      {change}
    </p>
  </div>
)

export default MetricCard
