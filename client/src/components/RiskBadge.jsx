function RiskBadge({ score }) {
  const numericScore = Number(score) || 0
  const color =
    numericScore > 60 ? 'red' : numericScore > 30 ? 'amber' : 'green'

  return <span className={`badge badge-${color}`}>{numericScore}</span>
}

export default RiskBadge
