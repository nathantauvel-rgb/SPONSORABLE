import * as Flags from 'country-flag-icons/react/3x2'

const codeMap: Record<string, keyof typeof Flags> = {
  fr: 'FR', be: 'BE', ch: 'CH', ca: 'CA',
  de: 'DE', us: 'US', gb: 'GB', es: 'ES',
  it: 'IT', pt: 'PT', nl: 'NL',
}

const Flag = ({ code, size = 20 }: { code: string; size?: number }) => {
  const key = codeMap[code.toLowerCase()]
  const FlagSvg = key ? (Flags as Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>>)[key] : null

  if (!FlagSvg) {
    return (
      <span style={{ fontSize: `${size}px`, lineHeight: 1, display: 'inline-block' }}>🌍</span>
    )
  }

  return (
    <FlagSvg
      style={{
        width: `${size}px`,
        height: `${Math.round(size * 0.67)}px`,
        borderRadius: '3px',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.10)',
        flexShrink: 0,
        display: 'inline-block',
      }}
    />
  )
}

export default Flag
