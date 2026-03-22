const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const authRoutes = require('./routes/authRoutes')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())
app.use('/api/auth', authRoutes)

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
