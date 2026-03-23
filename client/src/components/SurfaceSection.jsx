function SurfaceSection({ as: Component = 'section', className = '', children }) {
  const classes = ['workspace-card', className].filter(Boolean).join(' ')

  return <Component className={classes}>{children}</Component>
}

export default SurfaceSection
