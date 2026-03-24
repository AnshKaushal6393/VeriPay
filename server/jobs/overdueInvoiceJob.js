const cron = require('node-cron')
const { markOverdueInvoices } = require('../utils/invoiceStatusSync')

const CRON_EXPRESSION = '0 0 * * *'

const runOverdueInvoiceSweep = async () => {
  try {
    const result = await markOverdueInvoices()

    console.log(
      `[cron] Overdue invoice sweep completed at ${result.checkedAt}. Updated ${result.updatedCount} invoice(s).`,
    )
  } catch (error) {
    console.error('[cron] Overdue invoice sweep failed:', error.message)
  }
}

const startOverdueInvoiceJob = () => {
  cron.schedule(CRON_EXPRESSION, runOverdueInvoiceSweep, {
    timezone: 'Asia/Calcutta',
  })

  console.log('[cron] Overdue invoice job scheduled for 00:00 Asia/Calcutta daily.')
}

module.exports = {
  CRON_EXPRESSION,
  runOverdueInvoiceSweep,
  startOverdueInvoiceJob,
}
