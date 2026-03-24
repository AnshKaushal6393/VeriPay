const prisma = require('../lib/prisma')
const { generateInvoiceNumber } = require('../utils/invoiceNumber')

async function main() {
  const invoices = await prisma.invoice.findMany({
    where: {
      invoiceNumber: null,
    },
    orderBy: {
      createdAt: 'asc',
    },
    select: {
      id: true,
      createdAt: true,
    },
  })

  for (const invoice of invoices) {
    const invoiceNumber = await generateInvoiceNumber(invoice.createdAt)

    await prisma.invoice.update({
      where: {
        id: invoice.id,
      },
      data: {
        invoiceNumber,
      },
    })
  }

  console.log(`Backfilled ${invoices.length} invoice numbers.`)
}

main()
  .catch((error) => {
    console.error('Failed to backfill invoice numbers:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
