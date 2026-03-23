const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const prisma = require('./lib/prisma')
const { getPrismaErrorDetails } = require('./utils/prismaError')

dotenv.config({ path: require('path').resolve(__dirname, '.env') })

const authRoutes = require('./routes/authRoutes')
const invoiceRoutes = require('./routes/invoices')
const uploadRoutes = require('./routes/uploads')
const vendorRoutes = require('./routes/vendors')

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())
app.use('/api/auth', authRoutes)
app.use('/api/invoices', invoiceRoutes)
app.use('/api/uploads', uploadRoutes)
app.use('/api/vendors', vendorRoutes)

app.get('/', (req, res) => {
  res.json({
    message: 'VeriPay server is running',
  })
})

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
  })
})

app.get('/api/health/db', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`

    return res.status(200).json({
      success: true,
      message: 'Database connection is healthy',
    })
  } catch (error) {
    const prismaError = getPrismaErrorDetails(error)

    return res.status(prismaError.status).json({
      success: false,
      message: prismaError.message,
      error: prismaError.details,
    })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
