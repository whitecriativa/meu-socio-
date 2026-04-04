interface LogoProps {
  size?: number
  showText?: boolean
  variant?: 'default' | 'white' | 'dark'
}

export function LogoIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="80" rx="18" fill="#0F40CB"/>
      <rect x="16" y="14" width="48" height="22" rx="11" fill="#B6F273"/>
      <path d="M16 44 Q16 38 22 38 H52 Q58 38 58 44 V56 Q58 62 52 62 H28 L20 70 V62 Q16 62 16 56 Z" fill="#B8DFFB"/>
    </svg>
  )
}

export function Logo({ size = 40, showText = true, variant = 'default' }: LogoProps) {
  const textColor = variant === 'white' ? 'text-white' : 'text-[#161921] dark:text-white'

  return (
    <div className="flex items-center gap-2.5">
      <LogoIcon size={size} />
      {showText && (
        <div className="leading-none">
          <div className={`font-bold text-xl leading-tight ${textColor}`}>
            Meu <span className="text-[10px] font-semibold uppercase tracking-widest opacity-50">APP</span>
          </div>
          <div className={`font-bold text-xl leading-tight -mt-0.5 ${textColor}`}>Sócio</div>
        </div>
      )}
    </div>
  )
}
