const HeroOrbs = () => (
  <div
    aria-hidden="true"
    style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      pointerEvents: 'none',
      zIndex: 0,
      overflow: 'hidden',
    }}
  >
    <svg
      width="900"
      height="680"
      viewBox="0 0 900 680"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', top: 0 }}
    >
      <defs>
        <radialGradient id="orbGreen" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4ade80" stopOpacity="0.55" />
          <stop offset="45%" stopColor="#86efac" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#86efac" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="orbBlue" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
          <stop offset="45%" stopColor="#7dd3fc" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="orbCenter" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
          <stop offset="60%" stopColor="#d1fae5" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#d1fae5" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ringGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#16a34a" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
        </radialGradient>
      </defs>
      {[220, 290, 360, 430, 510].map((r, i) => (
        <circle
          key={i}
          cx="450"
          cy="220"
          r={r}
          stroke="#16a34a"
          strokeWidth="1"
          strokeOpacity={0.045 - i * 0.006}
          fill="none"
        />
      ))}
      <ellipse cx="390" cy="200" rx="280" ry="260" fill="url(#orbBlue)" />
      <ellipse cx="510" cy="190" rx="300" ry="270" fill="url(#orbGreen)" />
      <ellipse cx="450" cy="200" rx="160" ry="140" fill="url(#orbCenter)" />
    </svg>
  </div>
)

export default HeroOrbs
