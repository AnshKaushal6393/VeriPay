const express = require('express')
const authMiddleware = require('../middleware/authMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')
const {
  createVendor,
  getVendorById,
  getVendors,
  updateVendor,
} = require('../controllers/vendorController')

const router = express.Router()

router.use(authMiddleware)

router.get('/', roleMiddleware('ADMIN', 'MANAGER', 'VIEWER'), getVendors)

router.get('/:id', roleMiddleware('ADMIN', 'MANAGER', 'VIEWER'), getVendorById)

router.post('/', roleMiddleware('ADMIN', 'MANAGER'), createVendor)

router.put('/:id', roleMiddleware('ADMIN', 'MANAGER'), updateVendor)

router.delete('/:id', roleMiddleware('ADMIN'), (req, res) => {
  res.json({
    success: true,
    message: `Delete vendor ${req.params.id} route ready`,
  })
})

module.exports = router
