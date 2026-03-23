import { useTheme } from '../context/ThemeContext'

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="theme-toggle-svg" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="theme-toggle-svg" aria-hidden="true">
      <path
        d="M14.9 3.2a8.7 8.7 0 1 0 5.9 15.1A9.5 9.5 0 0 1 14.9 3.2Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  )
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <span className={`theme-toggle-option ${!isDark ? 'active' : ''}`}>
        <span className="theme-toggle-icon" aria-hidden="true">
          <SunIcon />
        </span>
        <span>Light</span>
      </span>
      <span className={`theme-toggle-option ${isDark ? 'active' : ''}`}>
        <span className="theme-toggle-icon" aria-hidden="true">
          <MoonIcon />
        </span>
        <span>Dark</span>
      </span>
    </button>
  )
}

export default ThemeToggle
