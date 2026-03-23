const express = require('express')
const authMiddleware = require('../middleware/authMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')
const { createInvoice } = require('../controllers/invoiceController')

const router = express.Router()

router.use(authMiddleware)

router.post('/', roleMiddleware('ADMIN', 'MANAGER'), createInvoice)

module.exports = router
