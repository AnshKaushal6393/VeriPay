const express = require('express')
const authMiddleware = require('../middleware/authMiddleware')
const { handlePdfUploadError, uploadInvoicePdf } = require('../middleware/pdfUpload')
const roleMiddleware = require('../middleware/roleMiddleware')
const {
  createInvoice,
  listInvoices,
  updateInvoiceStatus,
} = require('../controllers/invoiceController')

const router = express.Router()

router.use(authMiddleware)

router.get('/', roleMiddleware('ADMIN', 'MANAGER', 'VIEWER'), listInvoices)
router.post('/', roleMiddleware('ADMIN', 'MANAGER'), uploadInvoicePdf, createInvoice)
router.patch('/:id/status', roleMiddleware('ADMIN', 'MANAGER'), updateInvoiceStatus)
router.use(handlePdfUploadError)

module.exports = router
