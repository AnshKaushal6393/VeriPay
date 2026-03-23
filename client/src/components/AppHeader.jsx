import { NavLink } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

function AppHeader({
  eyebrow,
  title,
  subtitle,
  navLinks = [],
  primaryAction,
  user,
  isAuthenticated,
  onLogout,
  fallbackTitle = 'Locked Workspace',
  fallbackMeta = 'Authentication required',
}) {
  return (
    <header className="topbar">
      <div className="topbar-main">
        <div className="brand-block">
          <span className="brand-mark">VP</span>
          <div className="brand-copy">
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            {subtitle ? <p className="brand-subtitle">{subtitle}</p> : null}
          </div>
        </div>

        <div className="topbar-actions">
          {primaryAction ? <div className="header-cta">{primaryAction}</div> : null}
          <ThemeToggle />
          {isAuthenticated ? (
            <div className="session-cluster">
              <div className="session-card">
                <p className="session-name">{user?.name}</p>
                <p className="session-meta">
                  {user?.role} / {user?.email}
                </p>
                <button type="button" className="session-logout-link" onClick={onLogout}>
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="session-card">
              <p className="session-name">{fallbackTitle}</p>
              <p className="session-meta">{fallbackMeta}</p>
            </div>
          )}
        </div>
      </div>

      {navLinks.length ? (
        <nav className="topnav topbar-nav">
          {navLinks.map((link) =>
            link.to ? (
              <NavLink
                key={link.label}
                to={link.to}
                className={({ isActive }) =>
                  `topnav-link${isActive ? ' active' : ''}`
                }
                end={link.end}
              >
                {link.label}
              </NavLink>
            ) : (
              <a key={link.label} href={link.href || '/'} className="topnav-link">
                {link.label}
              </a>
            ),
          )}
        </nav>
      ) : null}
    </header>
  )
}

export default AppHeader
