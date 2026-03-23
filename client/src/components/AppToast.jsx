function SuccessIcon() {
  return (
    <svg viewBox="0 0 24 24" className="app-toast-icon-svg" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="m8.4 12.3 2.3 2.3 4.9-5.1"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function ErrorIcon() {
  return (
    <svg viewBox="0 0 24 24" className="app-toast-icon-svg" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 8v5.1"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="16.4" r="1" fill="currentColor" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="app-toast-icon-svg" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 10.1v5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="7.6" r="1" fill="currentColor" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="app-toast-close-svg" aria-hidden="true">
      <path
        d="m7 7 10 10M17 7 7 17"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

const toneIconMap = {
  success: SuccessIcon,
  error: ErrorIcon,
  info: InfoIcon,
}

function AppToast({ title, message, tone = 'info', visible = true, onDismiss }) {
  const Icon = toneIconMap[tone] || InfoIcon

  return (
    <div
      className={`app-toast app-toast-${tone}${visible ? ' is-visible' : ' is-leaving'}`}
      role="status"
      aria-live="polite"
    >
      <div className="app-toast-icon-wrap">
        <Icon />
      </div>
      <div className="app-toast-copy">
        <p className="app-toast-title">{title}</p>
        {message ? <p className="app-toast-message">{message}</p> : null}
      </div>
      <button
        type="button"
        className="app-toast-dismiss"
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        <CloseIcon />
      </button>
    </div>
  )
}

export default AppToast
