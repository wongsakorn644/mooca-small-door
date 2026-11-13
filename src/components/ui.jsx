export function Header({ title, onSkip, skipLabel = 'ข้าม', light = false }) {
  return (
    <header className={`header ${light ? 'header--light' : ''}`}>
      <span className="header__side" />
      <h1 className="header__title">{title}</h1>
      <span className="header__side header__side--right">
        {onSkip && (
          <button type="button" className="link" onClick={onSkip}>
            {skipLabel}
          </button>
        )}
      </span>
    </header>
  )
}

export function Bubble({ children, className = '', tail = 'center' }) {
  return (
    <div className={`bubble bubble--tail-${tail} ${className}`} role="status" aria-live="polite">
      {children}
    </div>
  )
}

export function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button type="button" className={`btn-primary ${className}`} {...props}>
      {children}
    </button>
  )
}

export function Icon({ name, className = '', label }) {
  return (
    <img
      src={`/icon/${name}.svg`}
      className={`icon ${className}`}
      alt={label || ''}
      aria-hidden={label ? undefined : 'true'}
      draggable="false"
    />
  )
}
