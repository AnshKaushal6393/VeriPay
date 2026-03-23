function RiskBadge({ score }) {
  const hasScore = score !== null && score !== undefined && score !== ''

  if (!hasScore) {
    return <span className="risk-empty-state">No history yet</span>
  }

  const numericScore = Number(score)
  const color =
    numericScore > 60 ? 'red' : numericScore > 30 ? 'amber' : 'green'

  return <span className={`badge badge-${color}`}>{numericScore}</span>
}

export default RiskBadge
