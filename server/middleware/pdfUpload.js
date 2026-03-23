const fs = require('fs')
const path = require('path')
const multer = require('multer')

const uploadDirectory = path.resolve(__dirname, '../uploads/invoices')

fs.mkdirSync(uploadDirectory, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDirectory)
  },
  filename: (_req, file, callback) => {
    const sanitizedBaseName = path
      .basename(file.originalname, path.extname(file.originalname))
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .slice(0, 60)

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    callback(null, `${sanitizedBaseName || 'invoice'}-${uniqueSuffix}.pdf`)
  },
})

const fileFilter = (_req, file, callback) => {
  const isPdfMime = file.mimetype === 'application/pdf'
  const isPdfExtension = path.extname(file.originalname).toLowerCase() === '.pdf'

  if (!isPdfMime && !isPdfExtension) {
    return callback(new Error('Only PDF files are allowed'))
  }

  callback(null, true)
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
})

const uploadPdfFile = upload.single('pdfFile')
const uploadInvoicePdf = upload.single('invoicePdf')

const handlePdfUploadError = (error, _req, res, next) => {
  if (!error) {
    return next()
  }

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'PDF file size must be 10MB or less',
      })
    }

    return res.status(400).json({
      success: false,
      message: error.message,
    })
  }

  return res.status(400).json({
    success: false,
    message: error.message || 'Invalid PDF upload',
  })
}

module.exports = {
  uploadPdfFile,
  uploadInvoicePdf,
  handlePdfUploadError,
}
