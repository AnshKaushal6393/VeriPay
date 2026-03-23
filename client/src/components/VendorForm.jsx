import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'

const paymentTermOptions = ['30', '45', '60', '90']
const categoryOptions = [
  'Technology',
  'Logistics',
  'Finance',
  'Operations',
  'Services',
]

function VendorForm({
  mode = 'create',
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  serverError = '',
  successMessage = '',
  disableClose = false,
}) {
  const title = useMemo(
    () => (mode === 'edit' ? 'Edit vendor' : 'Create vendor'),
    [mode],
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      category: '',
      contactEmail: '',
      contactPhone: '',
      paymentTerms: '30',
      address: '',
    },
  })

  useEffect(() => {
    reset({
      name: initialData?.name || '',
      category: initialData?.category || '',
      contactEmail: initialData?.contactEmail || '',
      contactPhone: initialData?.contactPhone || '',
      paymentTerms: String(initialData?.paymentTerms ?? '30'),
      address: initialData?.address || '',
    })
  }, [initialData, reset])

  return (
    <form className="vendor-form" onSubmit={handleSubmit(onSubmit)}>
      <div className="form-header">
        <div>
          <p className="eyebrow">Vendor form</p>
          <h3 id="vendor-form-title">{title}</h3>
          <p className="form-copy">
            Capture supplier identity, contact coverage, and commercial terms in one
            structured record.
          </p>
        </div>
        <button
          type="button"
          className="row-action secondary"
          onClick={onCancel}
          disabled={disableClose}
        >
          Close
        </button>
      </div>

      {serverError ? (
        <div className="notice-panel error-panel form-feedback-panel" role="alert">
          <strong>Unable to save vendor</strong>
          <p>{serverError}</p>
        </div>
      ) : null}

      {successMessage ? (
        <div className="notice-panel success-panel form-feedback-panel" role="status">
          <strong>{mode === 'edit' ? 'Vendor updated' : 'Vendor created'}</strong>
          <p>{successMessage}</p>
        </div>
      ) : null}

      <div className="form-section">
        <div className="form-section-header">
          <p className="form-section-title">Vendor identity</p>
          <span className="form-section-meta">Core supplier profile</span>
        </div>

        <div className="form-grid">
          <label className="control form-control">
            <span>Vendor name</span>
            <input
              {...register('name', {
                required: 'Enter the vendor name to create this record.',
              })}
              placeholder="Acme Logistics"
            />
            {errors.name ? <small className="field-error">{errors.name.message}</small> : null}
          </label>

          <label className="control form-control">
            <span>Category</span>
            <select
              {...register('category', {
                required: 'Choose the operating category for this vendor.',
              })}
            >
              <option value="">Select category</option>
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.category ? (
              <small className="field-error">{errors.category.message}</small>
            ) : null}
          </label>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-header">
          <p className="form-section-title">Contact coverage</p>
          <span className="form-section-meta">Primary communication fields</span>
        </div>

        <div className="form-grid">
          <label className="control form-control">
            <span>Contact email</span>
            <input
              {...register('contactEmail', {
                required: 'Add a contact email for vendor communication.',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Use a valid email address like ops@acme.com.',
                },
              })}
              placeholder="ops@acme.com"
            />
            {errors.contactEmail ? (
              <small className="field-error">{errors.contactEmail.message}</small>
            ) : null}
          </label>

          <label className="control form-control">
            <span>Contact phone</span>
            <input
              {...register('contactPhone', {
                pattern: {
                  value: /^[0-9+\-\s()]{7,20}$/,
                  message: 'Use a valid phone number with 7 to 20 characters.',
                },
              })}
              placeholder="+91 98765 43210"
            />
            {errors.contactPhone ? (
              <small className="field-error">{errors.contactPhone.message}</small>
            ) : null}
          </label>

          <label className="control form-control form-control-span">
            <span>Address</span>
            <input
              {...register('address')}
              placeholder="Bengaluru, Karnataka"
            />
          </label>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-header">
          <p className="form-section-title">Commercial terms</p>
          <span className="form-section-meta">Payment profile</span>
        </div>

        <div className="form-grid">
          <label className="control form-control">
            <span>Payment terms</span>
            <select
              {...register('paymentTerms', {
                required: 'Select the approved payment terms for this vendor.',
              })}
            >
              {paymentTermOptions.map((option) => (
                <option key={option} value={option}>
                  {option} days
                </option>
              ))}
            </select>
            {errors.paymentTerms ? (
              <small className="field-error">{errors.paymentTerms.message}</small>
            ) : null}
          </label>
        </div>
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="row-action secondary"
          onClick={onCancel}
          disabled={disableClose}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="action-button form-submit-button"
          disabled={isSubmitting || disableClose || Boolean(successMessage)}
        >
          {isSubmitting
            ? 'Saving...'
            : successMessage
              ? 'Saved'
            : mode === 'edit'
              ? 'Save changes'
              : 'Create vendor'}
        </button>
      </div>
    </form>
  )
}

export default VendorForm
