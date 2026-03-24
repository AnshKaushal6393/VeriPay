const prisma = require('../lib/prisma')

const historyScore = async (vendorId) => {
  const [totalInvoices, latePayments, averageRiskAggregate] = await prisma.$transaction([
    prisma.invoice.count({
      where: {
        vendorId,
      },
    }),
    prisma.invoice.count({
      where: {
        vendorId,
        status: 'OVERDUE',
      },
    }),
    prisma.invoice.aggregate({
      where: {
        vendorId,
      },
      _avg: {
        riskScore: true,
      },
    }),
  ])

  if (totalInvoices === 0) {
    return {
      totalInvoices,
      latePayments,
      avgRiskScore: averageRiskAggregate._avg.riskScore ?? 0,
      score: 0,
    }
  }

  const lateRate = latePayments / totalInvoices
  const score = Math.round(lateRate * 30)

  return {
    totalInvoices,
    latePayments,
    avgRiskScore: averageRiskAggregate._avg.riskScore ?? 0,
    score,
  }
}

module.exports = {
  historyScore,
}
