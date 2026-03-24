const DAY_IN_MS = 1000 * 60 * 60 * 24

const getDaysLate = (invoice, referenceDate = new Date()) => {
  const dueDate = new Date(invoice.dueDate)
  const daysLate = Math.floor((referenceDate - dueDate) / DAY_IN_MS)

  return Number.isNaN(daysLate) ? 0 : daysLate
}

const overdueScore = (invoice, referenceDate = new Date()) => {
  const daysLate = getDaysLate(invoice, referenceDate)

  if (daysLate <= 0) return 0
  if (daysLate <= 7) return 10
  if (daysLate <= 30) return 25

  return 40
}

module.exports = {
  getDaysLate,
  overdueScore,
}
