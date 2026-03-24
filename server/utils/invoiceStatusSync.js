const prisma = require('../lib/prisma')
const { refreshInvoiceRisk } = require('./refreshInvoiceRisk')

const OVERDUE_ELIGIBLE_STATUSES = ['PENDING', 'PENDING_APPROVAL', 'APPROVED']

const markOverdueInvoices = async (referenceDate = new Date()) => {
  const eligibleInvoices = await prisma.invoice.findMany({
    where: {
      status: {
        in: OVERDUE_ELIGIBLE_STATUSES,
      },
      dueDate: {
        lt: referenceDate,
      },
    },
    select: {
      id: true,
    },
  })

  for (const invoice of eligibleInvoices) {
    await prisma.invoice.update({
      where: {
        id: invoice.id,
      },
      data: {
        status: 'OVERDUE',
      },
    })

    await refreshInvoiceRisk(invoice.id)
  }

  return {
    updatedCount: eligibleInvoices.length,
    checkedAt: referenceDate.toISOString(),
  }
}

module.exports = {
  OVERDUE_ELIGIBLE_STATUSES,
  markOverdueInvoices,
}
