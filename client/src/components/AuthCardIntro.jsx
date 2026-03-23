import ThemeToggle from './ThemeToggle'

function AuthCardIntro({ eyebrow, title, description }) {
  return (
    <>
      <div className="theme-toggle-row">
        <ThemeToggle />
      </div>

      <div className="login-brand">
        <span className="brand-mark">VP</span>
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
        </div>
      </div>

      <p className="login-copy">{description}</p>
    </>
  )
}

export default AuthCardIntro
