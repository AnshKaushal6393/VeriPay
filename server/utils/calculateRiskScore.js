const prisma = require('../lib/prisma')
const { overdueScore } = require('./overdueScore')
const { historyScore } = require('./historyScore')
const { disputeScore } = require('./disputeScore')
const { amountScore } = require('./amountScore')
const { updateVendorRiskScore } = require('./vendorRiskScore')

const calculateRiskScore = async (invoice, vendor) => {
  const [oScore, vendorHistory, dScore] = await Promise.all([
    Promise.resolve(overdueScore(invoice)),
    historyScore(vendor.id),
    disputeScore(invoice.id),
  ])

  const aScore = amountScore(invoice.amount)
  const total = Math.min(oScore + aScore + vendorHistory.score + dScore, 100)

  if (invoice?.id) {
    await prisma.invoice.update({
      where: {
        id: invoice.id,
      },
      data: {
        riskScore: total,
      },
    })
  }

  const vendorRisk = await updateVendorRiskScore(vendor.id)

  return {
    score: total,
    breakdown: {
      overdueScore: oScore,
      amountScore: aScore,
      historyScore: vendorHistory.score,
      disputeScore: dScore,
    },
    vendorRiskScore: vendorRisk.riskScore,
  }
}

module.exports = {
  calculateRiskScore,
}
