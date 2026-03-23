const express = require('express')
const authMiddleware = require('../middleware/authMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')
const { handlePdfUploadError, uploadPdfFile } = require('../middleware/pdfUpload')
const { uploadPdf } = require('../controllers/pdfUploadController')

const router = express.Router()

router.use(authMiddleware)

router.post('/pdf', roleMiddleware('ADMIN', 'MANAGER', 'VIEWER'), uploadPdfFile, uploadPdf)
router.use(handlePdfUploadError)

module.exports = router
