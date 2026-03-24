const prisma = require('../lib/prisma')
const { calculateRiskScore } = require('./calculateRiskScore')

const refreshInvoiceRisk = async (invoiceId) => {
  const invoice = await prisma.invoice.findUnique({
    where: {
      id: invoiceId,
    },
    include: {
      vendor: {
        select: {
          id: true,
          name: true,
          category: true,
        },
      },
    },
  })

  if (!invoice) {
    return null
  }

  const riskResult = await calculateRiskScore(invoice, invoice.vendor)

  return {
    ...invoice,
    riskScore: riskResult.score,
    vendorRiskScore: riskResult.vendorRiskScore,
    riskBreakdown: riskResult.breakdown,
  }
}

module.exports = {
  refreshInvoiceRisk,
}
