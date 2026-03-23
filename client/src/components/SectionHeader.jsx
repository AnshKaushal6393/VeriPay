function SectionHeader({ eyebrow, title, actions, className = '' }) {
  const classes = ['toolbar', className].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
      </div>
      {actions ? <div className="toolbar-meta">{actions}</div> : null}
    </div>
  )
}

export default SectionHeader
