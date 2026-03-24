const prisma = require('../lib/prisma')

const MIN_INVOICES_FOR_VENDOR_SCORE = 3

const updateVendorRiskScore = async (vendorId) => {
  const [invoiceCount, averageRiskAggregate] = await prisma.$transaction([
    prisma.invoice.count({
      where: {
        vendorId,
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

  const nextRiskScore =
    invoiceCount < MIN_INVOICES_FOR_VENDOR_SCORE
      ? null
      : Math.min(Math.round(averageRiskAggregate._avg.riskScore ?? 0), 100)

  const vendor = await prisma.vendor.update({
    where: {
      id: vendorId,
    },
    data: {
      riskScore: nextRiskScore,
    },
    select: {
      id: true,
      riskScore: true,
    },
  })

  return {
    vendorId: vendor.id,
    invoiceCount,
    riskScore: vendor.riskScore,
  }
}

module.exports = {
  MIN_INVOICES_FOR_VENDOR_SCORE,
  updateVendorRiskScore,
}
