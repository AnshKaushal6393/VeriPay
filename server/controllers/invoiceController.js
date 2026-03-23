const prisma = require('../lib/prisma')
const fs = require('fs')

const allowedStatuses = new Set([
  'PENDING',
  'PENDING_APPROVAL',
  'APPROVED',
  'PAID',
  'OVERDUE',
  'DISPUTED',
  'REJECTED',
])

const isValidDate = (value) => {
  const parsed = new Date(value)
  return !Number.isNaN(parsed.getTime())
}

const normalizeDate = (value) => new Date(value)

const cleanupUploadedFile = (file) => {
  if (!file?.path) {
    return
  }

  try {
    fs.unlinkSync(file.path)
  } catch (_error) {
    // Best-effort cleanup only.
  }
}

const validateInvoicePayload = (payload) => {
  const { vendorId, amount, dueDate, currency, status, slaDeadline, slaBreach } = payload

  if (!vendorId || !String(vendorId).trim()) {
    return 'Vendor is required'
  }

  if (amount === undefined || amount === null || amount === '') {
    return 'Amount is required'
  }

  if (Number.isNaN(Number(amount)) || Number(amount) <= 0) {
    return 'Amount must be a number greater than 0'
  }

  if (!dueDate || !isValidDate(dueDate)) {
    return 'A valid due date is required'
  }

  if (currency && String(currency).trim().length !== 3) {
    return 'Currency must be a 3-letter code like INR or USD'
  }

  if (status && !allowedStatuses.has(String(status).trim().toUpperCase())) {
    return 'Invoice status is invalid'
  }

  if (slaDeadline && !isValidDate(slaDeadline)) {
    return 'SLA deadline must be a valid date'
  }

  if (slaBreach && !isValidDate(slaBreach)) {
    return 'SLA breach must be a valid date'
  }

  return null
}

const createInvoice = async (req, res) => {
  try {
    const validationError = validateInvoicePayload(req.body)

    if (validationError) {
      cleanupUploadedFile(req.file)
      return res.status(400).json({
        success: false,
        message: validationError,
      })
    }

    const vendor = await prisma.vendor.findUnique({
      where: {
        id: String(req.body.vendorId).trim(),
      },
      select: {
        id: true,
      },
    })

    if (!vendor) {
      cleanupUploadedFile(req.file)
      return res.status(404).json({
        success: false,
        message: 'Vendor not found',
      })
    }

    const dueDate = normalizeDate(req.body.dueDate)
    const slaDeadline = req.body.slaDeadline
      ? normalizeDate(req.body.slaDeadline)
      : dueDate
    const slaBreach = req.body.slaBreach
      ? normalizeDate(req.body.slaBreach)
      : dueDate

    const invoice = await prisma.invoice.create({
      data: {
        vendorId: vendor.id,
        amount: Number(req.body.amount),
        currency: req.body.currency?.trim().toUpperCase() || 'INR',
        dueDate,
        status: req.body.status?.trim().toUpperCase() || 'PENDING',
        slaDeadline,
        slaBreach,
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    })

    return res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      invoice,
      document: req.file
        ? {
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
          }
        : null,
    })
  } catch (error) {
    cleanupUploadedFile(req.file)
    return res.status(500).json({
      success: false,
      message: 'Failed to create invoice',
      error: error.message,
    })
  }
}

module.exports = {
  createInvoice,
}
