const prisma = require('../lib/prisma')

const disputeScore = async (invoiceId) => {
  const openDisputes = await prisma.dispute.count({
    where: {
      invoiceId,
      status: {
        notIn: ['RESOLVED', 'REJECTED'],
      },
    },
  })

  return openDisputes > 0 ? 10 : 0
}

module.exports = {
  disputeScore,
}
