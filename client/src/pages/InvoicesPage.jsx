import { createPortal } from 'react-dom'
import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import InvoiceForm from '../components/InvoiceForm'
import AppHeader from '../components/AppHeader'
import SectionHeader from '../components/SectionHeader'
import SurfaceSection from '../components/SurfaceSection'
import { notifyError, notifySuccess } from '../lib/notify'

const invoiceStatusOptions = [
  'All Statuses',
  'PENDING',
  'PENDING_APPROVAL',
  'APPROVED',
  'PAID',
  'OVERDUE',
  'DISPUTED',
  'REJECTED',
]

async function fetchInvoices({ queryKey }) {
  const [, params] = queryKey
  const response = await api.get('/invoices', { params })
  return response.data
}

async function fetchVendors() {
  const response = await api.get('/vendors')
  return response.data
}

function InvoicesPage() {
  const { user, logout } = useAuth()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('All Statuses')
  const [vendorId, setVendorId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)

  const canManageInvoices = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const invoiceParams = useMemo(() => {
    const params = {}
    if (status !== 'All Statuses') params.status = status
    if (vendorId) params.vendorId = vendorId
    if (dateFrom) params.dateFrom = dateFrom
    if (dateTo) params.dateTo = dateTo
    return params
  }, [dateFrom, dateTo, status, vendorId])

  const {
    data: invoicesData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['invoices', invoiceParams],
    queryFn: fetchInvoices,
  })

  const { data: vendorsData } = useQuery({
    queryKey: ['vendors-filter'],
    queryFn: fetchVendors,
  })

  const invoices = invoicesData?.invoices || []
  const vendors = vendorsData?.vendors || []

  const paidCount = invoices.filter((invoice) => invoice.status === 'PAID').length
  const disputedCount = invoices.filter((invoice) => invoice.status === 'DISPUTED').length
  const overdueCount = invoices.filter((invoice) => invoice.status === 'OVERDUE').length

  const totalValue = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.amount || 0),
    0,
  )

  const getInvoiceStatusTone = (statusValue) => {
    if (statusValue === 'PAID' || statusValue === 'APPROVED') return 'active'
    if (statusValue === 'DISPUTED' || statusValue === 'REJECTED' || statusValue === 'OVERDUE') {
      return 'escalated'
    }
    return 'review'
  }

  const getInvoiceDisplayNumber = (invoice) => (
    invoice.invoiceNumber || `Draft-${invoice.id.slice(0, 8).toUpperCase()}`
  )

  const createInvoiceMutation = useMutation({
    mutationFn: async (values) => {
      const formData = new FormData()
      formData.append('vendorId', values.vendorId)
      formData.append('amount', values.amount)
      formData.append('currency', values.currency || 'INR')
      formData.append('dueDate', values.dueDate)
      formData.append('status', values.status || 'PENDING')

      if (values.description?.trim()) {
        formData.append('description', values.description.trim())
      }

      if (values.items?.length) {
        formData.append('items', JSON.stringify(values.items))
      }

      const response = await api.post('/invoices', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      notifySuccess(
        'Invoice created',
        'The invoice record has been added to the directory.',
      )
      setIsFormOpen(false)
    },
    onError: (mutationError) => {
      notifyError(
        'Unable to create invoice',
        mutationError?.response?.data?.message || 'Please review the invoice fields and try again.',
      )
    },
  })

  useEffect(() => {
    if (!isFormOpen) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !createInvoiceMutation.isPending) {
        setIsFormOpen(false)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [createInvoiceMutation.isPending, isFormOpen])

  const formModal =
    isFormOpen && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="form-modal-backdrop"
            role="presentation"
            onClick={() => {
              if (!createInvoiceMutation.isPending) {
                setIsFormOpen(false)
              }
            }}
          >
            <div
              className="form-shell form-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="invoice-form-title"
              onClick={(event) => event.stopPropagation()}
            >
              <InvoiceForm
                vendors={vendors}
                onSubmit={(values) => createInvoiceMutation.mutate(values)}
                onCancel={() => setIsFormOpen(false)}
                isSubmitting={createInvoiceMutation.isPending}
              />
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <main className="app-shell">
        <AppHeader
          eyebrow="VeriPay / Invoices"
          title="Invoice Directory"
          subtitle="Review invoice records across vendors, narrow by status and due-date window, and track exposure at a glance."
          navLinks={[
            { label: 'Overview', to: '/', end: true },
            { label: 'Vendors', to: '/vendors' },
            { label: 'Invoices', to: '/invoices' },
            { label: 'Disputes', href: '/' },
          ]}
          primaryAction={
            <button
              type="button"
              className="action-button"
              onClick={() => setIsFormOpen(true)}
              disabled={!canManageInvoices}
              title={
                canManageInvoices
                  ? 'Create invoice'
                  : 'Only admins and managers can create invoices'
              }
            >
              New invoice
            </button>
          }
          user={user}
          isAuthenticated
          onLogout={logout}
        />

      <section className="kpi-row compact-kpis">
        <article className="kpi-card">
          <span className="kpi-label">Total invoices</span>
          <strong>{invoices.length}</strong>
          <p className="kpi-detail">Documents in the current filtered workspace.</p>
        </article>
        <article className="kpi-card">
          <span className="kpi-label">Paid</span>
          <strong>{paidCount}</strong>
          <p className="kpi-detail">Invoices that have completed settlement.</p>
        </article>
        <article className="kpi-card">
          <span className="kpi-label">Disputed</span>
          <strong>{disputedCount}</strong>
          <p className="kpi-detail">Records currently under dispute review.</p>
        </article>
        <article className="kpi-card status-card">
          <span className="kpi-label">Filtered value</span>
          <strong>INR {totalValue.toFixed(2)}</strong>
          <p className="kpi-detail">{overdueCount} overdue invoices in this view.</p>
        </article>
      </section>

        <SurfaceSection>
        <SectionHeader
          eyebrow="Invoice table"
          title="Records"
          actions={
            <>
              <span className="meta-chip">{invoices.length} invoices</span>
              <span className="meta-chip muted">
                {status === 'All Statuses' ? 'All statuses' : status}
              </span>
            </>
          }
        />

        <div className="summary-strip">
          <span className="summary-chip">Paid: {paidCount}</span>
          <span className="summary-chip">Disputed: {disputedCount}</span>
          <span className="summary-chip">Overdue: {overdueCount}</span>
        </div>

        <div className="filter-toolbar">
          <div className="filter-toolbar-header">
            <p className="filter-toolbar-title">Filter invoices</p>
            <span className="filter-toolbar-meta">
              {vendorId
                ? vendors.find((vendor) => vendor.id === vendorId)?.name || 'Selected vendor'
                : 'All vendors'} / {status === 'All Statuses' ? 'All statuses' : status}
            </span>
          </div>

          <div className="filter-row invoice-filter-row">
            <label className="control compact-control">
              <span>Status</span>
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                {invoiceStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === 'All Statuses' ? option : option.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </label>

            <label className="control compact-control">
              <span>Vendor</span>
              <select value={vendorId} onChange={(event) => setVendorId(event.target.value)}>
                <option value="">All vendors</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="control compact-control">
              <span>Due from</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </label>

            <label className="control compact-control">
              <span>Due to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </label>
          </div>
        </div>

        {isLoading ? (
          <div className="table-panel">
            <table className="vendors-table vendors-table-skeleton">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Due date</th>
                  <th>Currency</th>
                  <th>Invoice ID</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 3 }).map((_, index) => (
                  <tr key={`invoice-skeleton-${index}`}>
                    <td><span className="skeleton-block skeleton-line skeleton-line-medium" /></td>
                    <td><span className="skeleton-block skeleton-chip" /></td>
                    <td><span className="skeleton-block skeleton-line skeleton-line-small" /></td>
                    <td><span className="skeleton-block skeleton-line skeleton-line-small" /></td>
                    <td><span className="skeleton-block skeleton-line skeleton-line-small" /></td>
                    <td><span className="skeleton-block skeleton-line skeleton-line-medium" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {isError ? (
          <div className="notice-panel error-panel">
            <div className="notice-header">
              <div>
                <strong>Unable to load invoices</strong>
                <p>{error?.response?.data?.message || error?.message}</p>
              </div>
              <button type="button" className="row-action primary" onClick={() => refetch()}>
                Retry
              </button>
            </div>
          </div>
        ) : null}

        {!isLoading && !isError ? (
          <div className="table-panel">
            <table className="vendors-table detail-table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Due date</th>
                  <th>Currency</th>
                  <th>Invoice ID</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length ? (
                  invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="vendor-column">
                        <div className="vendor-cell">
                          <div className="vendor-avatar">
                            {invoice.vendor?.name?.slice(0, 2).toUpperCase() || 'IV'}
                          </div>
                          <div>
                            <strong>{invoice.vendor?.name || 'Unknown vendor'}</strong>
                            <span className="vendor-subtext">{invoice.vendor?.category || '-'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="status-column">
                        <span className={`status-tag ${getInvoiceStatusTone(invoice.status)}`}>
                          {invoice.status.replaceAll('_', ' ')}
                        </span>
                      </td>
                      <td className="amount-column">
                        <span className="invoice-amount">
                          {invoice.currency} {Number(invoice.amount).toFixed(2)}
                        </span>
                      </td>
                      <td className="date-column">
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </td>
                      <td className="terms-column">
                        <span className="table-mono">{invoice.currency}</span>
                      </td>
                      <td className="invoice-id-cell">
                        <span className="table-mono">{getInvoiceDisplayNumber(invoice)}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6">
                      <div className="table-empty rich-empty-state">
                        <div className="empty-illustration" aria-hidden="true">
                          <svg viewBox="0 0 64 64" className="empty-illustration-svg">
                            <rect
                              x="10"
                              y="14"
                              width="44"
                              height="34"
                              rx="6"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            />
                            <path
                              d="M20 24h24M20 32h16M20 40h10"
                              fill="none"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeWidth="1.8"
                            />
                          </svg>
                        </div>
                        <strong>No invoices match this filter set</strong>
                        <p>
                          Adjust the status, vendor, or due-date range to widen the invoice workspace.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : null}
        </SurfaceSection>
      </main>
      {formModal}
    </>
  )
}

export default InvoicesPage
