import { useMemo, useRef, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import api from '../lib/api'
import { notifyError } from '../lib/notify'

const defaultItem = {
  description: '',
  quantity: '1',
  amount: '',
}

const defaultValues = {
  vendorId: '',
  amount: '',
  currency: 'INR',
  dueDate: '',
  status: 'PENDING',
  description: '',
  items: [defaultItem],
}

const invoiceStatusOptions = [
  'PENDING',
  'PENDING_APPROVAL',
  'APPROVED',
  'PAID',
  'OVERDUE',
  'DISPUTED',
  'REJECTED',
]

const formatDateForInput = (value) => {
  if (!value) {
    return ''
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  return parsed.toISOString().slice(0, 10)
}

const extractDateCandidate = (text) => {
  const dueLabelMatch = text.match(
    /due\s*date[^0-9]*(\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
  )

  if (dueLabelMatch?.[1]) {
    return dueLabelMatch[1]
  }

  const genericMatch = text.match(/(\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/)
  return genericMatch?.[1] || ''
}

const normalizeExtractedDate = (rawDate) => {
  if (!rawDate) {
    return ''
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    return rawDate
  }

  const match = rawDate.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)

  if (!match) {
    return ''
  }

  const [, day, month, year] = match
  const normalizedYear = year.length === 2 ? `20${year}` : year
  return `${normalizedYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

const extractAmountCandidate = (text) => {
  const labeledMatch = text.match(
    /(?:grand\s*total|invoice\s*total|total\s*due|amount\s*due|total)[^\d]{0,20}(\d[\d,]*(?:\.\d{1,2})?)/i,
  )

  if (labeledMatch?.[1]) {
    return labeledMatch[1]
  }

  const genericMatch = text.match(/(?:INR|Rs\.?|USD)?\s?(\d[\d,]*(?:\.\d{1,2})?)/i)
  return genericMatch?.[1] || ''
}

const extractDescriptionCandidate = (text) => {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter(
      (line) =>
        !/invoice|tax|total|amount|due date|currency|status/i.test(line),
    )

  return lines.slice(0, 2).join(' ').slice(0, 180)
}

const extractItemsCandidate = (text) => {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter(
      (line) =>
        line.length > 5 &&
        !/invoice|total|amount due|grand total|due date|currency|status/i.test(line),
    )
    .slice(0, 3)

  if (!lines.length) {
    return [defaultItem]
  }

  return lines.map((line) => ({
    description: line.slice(0, 120),
    quantity: '1',
    amount: '',
  }))
}

const extractVendorIdCandidate = (text, vendors) => {
  const loweredText = text.toLowerCase()

  const matchedVendor = vendors.find((vendor) =>
    loweredText.includes(vendor.name.toLowerCase()),
  )

  return matchedVendor?.id || ''
}

function InvoiceForm({ vendors = [], onSubmit, onCancel, isSubmitting }) {
  const [activeTab, setActiveTab] = useState('manual')
  const [isParsingPdf, setIsParsingPdf] = useState(false)
  const [parsedPayload, setParsedPayload] = useState(null)
  const fileInputRef = useRef(null)

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues,
  })

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'items',
  })

  const parsedSummary = useMemo(() => {
    if (!parsedPayload) {
      return null
    }

    const vendorName =
      vendors.find((vendor) => vendor.id === parsedPayload.vendorId)?.name || 'No vendor match'

    return {
      vendorName,
      amount: parsedPayload.amount || 'Not found',
      dueDate: parsedPayload.dueDate || 'Not found',
      description: parsedPayload.description || 'Not found',
      itemsCount: parsedPayload.items?.filter((item) => item.description).length || 0,
    }
  }, [parsedPayload, vendors])

  const applyParsedValues = () => {
    if (!parsedPayload) {
      return
    }

    setValue('vendorId', parsedPayload.vendorId || '')
    setValue('amount', parsedPayload.amount || '')
    setValue('currency', parsedPayload.currency || 'INR')
    setValue('dueDate', parsedPayload.dueDate || '')
    setValue('description', parsedPayload.description || '')
    replace(parsedPayload.items?.length ? parsedPayload.items : [defaultItem])
    setActiveTab('manual')
  }

  const parseUploadedPdf = async (file) => {
    if (!file) {
      return
    }

    const formData = new FormData()
    formData.append('pdfFile', file)

    try {
      setIsParsingPdf(true)
      const response = await api.post('/uploads/pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const text = response.data?.pdf?.text || ''
      const dueDate = normalizeExtractedDate(extractDateCandidate(text))
      const amount = extractAmountCandidate(text).replaceAll(',', '')

      const extractedValues = {
        vendorId: extractVendorIdCandidate(text, vendors),
        amount,
        currency: 'INR',
        dueDate,
        description: extractDescriptionCandidate(text),
        items: extractItemsCandidate(text),
        sourcePreview: response.data?.pdf?.preview || '',
        sourceFile: response.data?.file || null,
      }

      setParsedPayload(extractedValues)
    } catch (error) {
      setParsedPayload(null)
      notifyError(
        'PDF parse failed',
        error?.response?.data?.message || 'Unable to parse the uploaded PDF.',
      )
    } finally {
      setIsParsingPdf(false)
    }
  }

  const handleFileSelection = async (event) => {
    const file = event.target.files?.[0]
    await parseUploadedPdf(file)
    event.target.value = ''
  }

  const handleDrop = async (event) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    await parseUploadedPdf(file)
  }

  return (
    <form className="invoice-form" onSubmit={handleSubmit(onSubmit)}>
      <div className="form-header">
        <div>
          <p className="eyebrow">Invoice form</p>
          <h3 id="invoice-form-title">Create invoice</h3>
          <p className="form-copy">
            Enter invoice details manually or upload a PDF, review the parsed values,
            and confirm before saving.
          </p>
        </div>
        <button type="button" className="row-action secondary" onClick={onCancel}>
          Close
        </button>
      </div>

      <div className="tab-strip">
        <button
          type="button"
          className={`tab-chip ${activeTab === 'manual' ? 'active' : ''}`}
          onClick={() => setActiveTab('manual')}
        >
          Manual entry
        </button>
        <button
          type="button"
          className={`tab-chip ${activeTab === 'pdf' ? 'active' : ''}`}
          onClick={() => setActiveTab('pdf')}
        >
          PDF upload
        </button>
      </div>

      {activeTab === 'manual' ? (
        <>
          <div className="form-section">
            <div className="form-section-header">
              <p className="form-section-title">Invoice details</p>
              <span className="form-section-meta">Core invoice fields</span>
            </div>

            <div className="form-grid">
              <label className="control form-control">
                <span>Vendor</span>
                <select
                  {...register('vendorId', {
                    required: 'Select the vendor for this invoice.',
                  })}
                >
                  <option value="">Select vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
                {errors.vendorId ? (
                  <small className="field-error">{errors.vendorId.message}</small>
                ) : null}
              </label>

              <label className="control form-control">
                <span>Amount</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="25000"
                  {...register('amount', {
                    required: 'Enter the invoice amount.',
                    min: {
                      value: 1,
                      message: 'Amount must be greater than 0.',
                    },
                  })}
                />
                {errors.amount ? (
                  <small className="field-error">{errors.amount.message}</small>
                ) : null}
              </label>

              <label className="control form-control">
                <span>Due date</span>
                <input
                  type="date"
                  {...register('dueDate', {
                    required: 'Select the invoice due date.',
                  })}
                />
                {errors.dueDate ? (
                  <small className="field-error">{errors.dueDate.message}</small>
                ) : null}
              </label>

              <label className="control form-control">
                <span>Currency</span>
                <input
                  type="text"
                  maxLength="3"
                  placeholder="INR"
                  {...register('currency')}
                />
              </label>

              <label className="control form-control form-control-span">
                <span>Description</span>
                <textarea
                  className="textarea-control"
                  rows="3"
                  placeholder="Invoice description or summary"
                  {...register('description')}
                />
              </label>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-header">
              <p className="form-section-title">Items list</p>
              <span className="form-section-meta">Reviewable line items</span>
            </div>

            <div className="invoice-items-stack">
              {fields.map((field, index) => (
                <div key={field.id} className="invoice-item-row">
                  <label className="control form-control form-control-span">
                    <span>Item description</span>
                    <input
                      placeholder="Service line or item summary"
                      {...register(`items.${index}.description`)}
                    />
                  </label>

                  <label className="control form-control">
                    <span>Qty</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      {...register(`items.${index}.quantity`)}
                    />
                  </label>

                  <label className="control form-control">
                    <span>Amount</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      {...register(`items.${index}.amount`)}
                    />
                  </label>

                  <button
                    type="button"
                    className="row-action secondary invoice-item-remove"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="row-action secondary"
              onClick={() => append({ ...defaultItem })}
            >
              Add item
            </button>
          </div>
        </>
      ) : (
        <div className="form-section">
          <div className="form-section-header">
            <p className="form-section-title">Upload invoice PDF</p>
            <span className="form-section-meta">Parse first, confirm after review</span>
          </div>

          <div
            className="upload-dropzone"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                fileInputRef.current?.click()
              }
            }}
          >
            <div className="upload-dropzone-copy">
              <strong>{isParsingPdf ? 'Parsing PDF...' : 'Drop a PDF here or click to upload'}</strong>
              <p>We will extract candidate fields for review, but nothing is submitted automatically.</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden-file-input"
              onChange={handleFileSelection}
            />
          </div>

          {parsedSummary ? (
            <div className="parsed-preview-card">
              <div className="parsed-preview-grid">
                <div className="detail-card">
                  <span className="detail-label">Matched vendor</span>
                  <strong className="detail-value">{parsedSummary.vendorName}</strong>
                </div>
                <div className="detail-card">
                  <span className="detail-label">Amount</span>
                  <strong className="detail-value">{parsedSummary.amount}</strong>
                </div>
                <div className="detail-card">
                  <span className="detail-label">Due date</span>
                  <strong className="detail-value">
                    {parsedSummary.dueDate !== 'Not found'
                      ? formatDateForInput(parsedSummary.dueDate)
                      : parsedSummary.dueDate}
                  </strong>
                </div>
                <div className="detail-card">
                  <span className="detail-label">Items found</span>
                  <strong className="detail-value">{parsedSummary.itemsCount}</strong>
                </div>
                <div className="detail-card detail-span">
                  <span className="detail-label">Description</span>
                  <strong className="detail-value">{parsedSummary.description}</strong>
                </div>
              </div>

              <div className="parsed-preview-text">
                <span className="detail-label">PDF preview</span>
                <p>{parsedPayload?.sourcePreview || 'No text preview available.'}</p>
              </div>

              <div className="form-actions parsed-preview-actions">
                <button
                  type="button"
                  className="row-action secondary"
                  onClick={() => {
                    setParsedPayload(null)
                    reset(defaultValues)
                  }}
                >
                  Clear parse
                </button>
                <button
                  type="button"
                  className="action-button"
                  onClick={applyParsedValues}
                >
                  Review in manual form
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="row-action secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="action-button form-submit-button" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Create invoice'}
        </button>
      </div>
    </form>
  )
}

export default InvoiceForm
