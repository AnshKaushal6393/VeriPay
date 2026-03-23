const { parsePdfFile } = require('../utils/pdfParser')

const uploadPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'A PDF file is required',
      })
    }

    const parsedPdf = await parsePdfFile(req.file.path)

    return res.status(201).json({
      success: true,
      message: 'PDF uploaded and parsed successfully',
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
      },
      pdf: {
        numPages: parsedPdf.numPages,
        info: parsedPdf.info,
        metadata: parsedPdf.metadata,
        version: parsedPdf.version,
        text: parsedPdf.text,
        preview: parsedPdf.text.slice(0, 500),
      },
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to upload and parse PDF',
      error: error.message,
    })
  }
}

module.exports = {
  uploadPdf,
}
