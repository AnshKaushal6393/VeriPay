const amountScore = (amount) => {
  const numericAmount = Number(amount)

  if (Number.isNaN(numericAmount) || numericAmount < 10_000) return 0
  if (numericAmount < 100_000) return 5
  if (numericAmount < 1_000_000) return 12

  return 20
}

module.exports = {
  amountScore,
}
