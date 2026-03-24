const prisma = require('../lib/prisma')

const padSequence = (value) => String(value).padStart(4, '0')

const getDateStamp = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

const getDayBounds = (date) => {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)

  const end = new Date(date)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

const extractSequence = (invoiceNumber, expectedPrefix) => {
  if (!invoiceNumber || !invoiceNumber.startsWith(expectedPrefix)) {
    return 0
  }

  const parts = invoiceNumber.split('-')
  const rawSequence = parts[parts.length - 1]
  const parsed = Number.parseInt(rawSequence, 10)

  return Number.isNaN(parsed) ? 0 : parsed
}

const generateInvoiceNumber = async (date = new Date()) => {
  const dateStamp = getDateStamp(date)
  const prefix = `INV-${dateStamp}`
  const { start, end } = getDayBounds(date)

  const latestInvoice = await prisma.invoice.findFirst({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
      invoiceNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      invoiceNumber: true,
    },
  })

  const nextSequence = extractSequence(latestInvoice?.invoiceNumber, prefix) + 1

  return `${prefix}-${padSequence(nextSequence)}`
}

module.exports = {
  generateInvoiceNumber,
}
