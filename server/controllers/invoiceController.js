const prisma = require('../lib/prisma')
const fs = require('fs')
const { generateInvoiceNumber } = require('../utils/invoiceNumber')
const { overdueScore, getDaysLate } = require('../utils/overdueScore')
const { amountScore } = require('../utils/amountScore')
const { refreshInvoiceRisk } = require('../utils/refreshInvoiceRisk')

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

const decorateInvoiceWithOverdueScore = (invoice) => ({
  ...invoice,
  daysLate: getDaysLate(invoice),
  overdueScore: overdueScore(invoice),
  amountScore: amountScore(invoice.amount),
})

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

const validateInvoiceStatus = (status) => {
  const normalizedStatus = String(status || '').trim().toUpperCase()

  if (!normalizedStatus) {
    return {
      error: 'Invoice status is required',
      status: null,
    }
  }

  if (!allowedStatuses.has(normalizedStatus)) {
    return {
      error: 'Invoice status is invalid',
      status: null,
    }
  }

  return {
    error: null,
    status: normalizedStatus,
  }
}

const listInvoices = async (req, res) => {
  try {
    const {
      status = '',
      vendorId = '',
      dateFrom = '',
      dateTo = '',
    } = req.query

    const where = {}

    if (status.trim()) {
      const normalizedStatus = status.trim().toUpperCase()

      if (!allowedStatuses.has(normalizedStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Invoice status is invalid',
        })
      }

      where.status = normalizedStatus
    }

    if (vendorId.trim()) {
      where.vendorId = vendorId.trim()
    }

    if (dateFrom || dateTo) {
      where.dueDate = {}

      if (dateFrom) {
        if (!isValidDate(dateFrom)) {
          return res.status(400).json({
            success: false,
            message: 'dateFrom must be a valid date',
          })
        }

        where.dueDate.gte = normalizeDate(dateFrom)
      }

      if (dateTo) {
        if (!isValidDate(dateTo)) {
          return res.status(400).json({
            success: false,
            message: 'dateTo must be a valid date',
          })
        }

        where.dueDate.lte = normalizeDate(dateTo)
      }
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    })

    return res.status(200).json({
      success: true,
      count: invoices.length,
      invoices: invoices.map(decorateInvoiceWithOverdueScore),
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch invoices',
      error: error.message,
    })
  }
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
        invoiceNumber: await generateInvoiceNumber(),
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

    const refreshedInvoice = await refreshInvoiceRisk(invoice.id)

    return res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      invoice: decorateInvoiceWithOverdueScore(refreshedInvoice || invoice),
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

const updateInvoiceStatus = async (req, res) => {
  try {
    const { error: statusError, status: normalizedStatus } = validateInvoiceStatus(
      req.body.status,
    )

    if (statusError) {
      return res.status(400).json({
        success: false,
        message: statusError,
      })
    }

    const existingInvoice = await prisma.invoice.findUnique({
      where: {
        id: req.params.id,
      },
      select: {
        id: true,
      },
    })

    if (!existingInvoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      })
    }

    await prisma.invoice.update({
      where: {
        id: req.params.id,
      },
      data: {
        status: normalizedStatus,
      },
    })

    const refreshedInvoice = await refreshInvoiceRisk(req.params.id)

    return res.status(200).json({
      success: true,
      message: 'Invoice status updated successfully',
      invoice: decorateInvoiceWithOverdueScore(refreshedInvoice),
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update invoice status',
      error: error.message,
    })
  }
}

module.exports = {
  createInvoice,
  listInvoices,
  updateInvoiceStatus,
}
