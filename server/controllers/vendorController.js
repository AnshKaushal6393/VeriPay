const prisma = require('../lib/prisma')

const validateVendorPayload = (payload) => {
  const { name, category, contactEmail, paymentTerms } = payload

  if (!name || !name.trim()) {
    return 'Vendor name is required'
  }

  if (!category || !category.trim()) {
    return 'Category is required'
  }

  if (!contactEmail || !contactEmail.trim()) {
    return 'Contact email is required'
  }

  if (paymentTerms === undefined || paymentTerms === null || paymentTerms === '') {
    return 'Payment terms are required'
  }

  return null
}

const getVendors = async (req, res) => {
  try {
    const { search = '', category = '' } = req.query

    const filters = []

    if (search.trim()) {
      filters.push({
        OR: [
          {
            name: {
              contains: search.trim(),
              mode: 'insensitive',
            },
          },
          {
            contactEmail: {
              contains: search.trim(),
              mode: 'insensitive',
            },
          },
        ],
      })
    }

    if (category.trim()) {
      filters.push({
        category: {
          equals: category.trim(),
          mode: 'insensitive',
        },
      })
    }

    const vendors = await prisma.vendor.findMany({
      where: filters.length ? { AND: filters } : {},
      orderBy: {
        createdAt: 'desc',
      },
    })

    return res.status(200).json({
      success: true,
      count: vendors.length,
      vendors,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch vendors',
      error: error.message,
    })
  }
}

const getVendorById = async (req, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        invoices: {
          include: {
            disputes: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found',
      })
    }

    return res.status(200).json({
      success: true,
      vendor,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch vendor details',
      error: error.message,
    })
  }
}

const createVendor = async (req, res) => {
  try {
    const validationError = validateVendorPayload(req.body)

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      })
    }

    const vendor = await prisma.vendor.create({
      data: {
        name: req.body.name.trim(),
        category: req.body.category.trim(),
        contactEmail: req.body.contactEmail.trim(),
        contactPhone: req.body.contactPhone?.trim() || null,
        paymentTerms: Number(req.body.paymentTerms),
        address: req.body.address?.trim() || null,
        riskScore: Number(req.body.riskScore ?? 0),
      },
    })

    return res.status(201).json({
      success: true,
      message: 'Vendor created successfully',
      vendor,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create vendor',
      error: error.message,
    })
  }
}

const updateVendor = async (req, res) => {
  try {
    const validationError = validateVendorPayload(req.body)

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      })
    }

    const vendor = await prisma.vendor.update({
      where: {
        id: req.params.id,
      },
      data: {
        name: req.body.name.trim(),
        category: req.body.category.trim(),
        contactEmail: req.body.contactEmail.trim(),
        contactPhone: req.body.contactPhone?.trim() || null,
        paymentTerms: Number(req.body.paymentTerms),
        address: req.body.address?.trim() || null,
        riskScore: Number(req.body.riskScore ?? 0),
      },
    })

    return res.status(200).json({
      success: true,
      message: 'Vendor updated successfully',
      vendor,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update vendor',
      error: error.message,
    })
  }
}

module.exports = {
  createVendor,
  getVendorById,
  getVendors,
  updateVendor,
}
