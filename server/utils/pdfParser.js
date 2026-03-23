const fs = require('fs/promises')
const pdfParse = require('pdf-parse')

const normalizePdfText = (text = '') =>
  text
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()

const buildPdfSummary = (parsedPdf) => {
  const text = normalizePdfText(parsedPdf.text)

  return {
    text,
    numPages: parsedPdf.numpages,
    info: parsedPdf.info || {},
    metadata: parsedPdf.metadata || null,
    version: parsedPdf.version || null,
  }
}

const parsePdfBuffer = async (buffer) => {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error('A valid PDF buffer is required')
  }

  const parsedPdf = await pdfParse(buffer)
  return buildPdfSummary(parsedPdf)
}

const parsePdfFile = async (filePath) => {
  if (!filePath || !String(filePath).trim()) {
    throw new Error('A valid PDF file path is required')
  }

  const fileBuffer = await fs.readFile(filePath)
  return parsePdfBuffer(fileBuffer)
}

module.exports = {
  normalizePdfText,
  parsePdfBuffer,
  parsePdfFile,
}
