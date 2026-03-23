import ThemeToggle from './ThemeToggle'

function AuthCardIntro({ eyebrow, title, description }) {
  return (
    <>
      <div className="theme-toggle-row">
        <ThemeToggle />
      </div>

      <div className="login-brand">
        <span className="brand-mark auth-brand-mark">VP</span>
        <div className="auth-copy">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="auth-kicker">Enterprise workspace access</p>
        </div>
      </div>

      <p className="login-copy">{description}</p>
    </>
  )
}

export default AuthCardIntro
