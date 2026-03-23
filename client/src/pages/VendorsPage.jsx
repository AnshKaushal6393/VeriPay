import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import { notifyError, notifySuccess } from '../lib/notify'
import AppHeader from '../components/AppHeader'
import RiskBadge from '../components/RiskBadge'
import SectionHeader from '../components/SectionHeader'
import SurfaceSection from '../components/SurfaceSection'
import VendorForm from '../components/VendorForm'

const categoryOptions = [
  'All Categories',
  'Technology',
  'Logistics',
  'Finance',
  'Operations',
  'Services',
]

const sortLabels = {
  createdAt: 'Newest first',
  name: 'Vendor name',
  category: 'Category',
  paymentTerms: 'Payment terms',
  riskScore: 'Risk score',
}

async function fetchVendors({ queryKey }) {
  const [, params] = queryKey
  const response = await api.get('/vendors', { params })
  return response.data
}

function VendorsPage() {
  const { isAuthenticated, user, logout } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All Categories')
  const [sortBy, setSortBy] = useState('createdAt')
  const [formMode, setFormMode] = useState('create')
  const [selectedVendor, setSelectedVendor] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const submitLockRef = useRef(false)
  const deferredSearch = useDeferredValue(search)
  const canManageVendors =
    user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const queryParams = useMemo(() => {
    const params = {}
    if (deferredSearch.trim()) params.search = deferredSearch.trim()
    if (category !== 'All Categories') params.category = category
    return params
  }, [category, deferredSearch])

  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ['vendors', queryParams],
    queryFn: fetchVendors,
    enabled: isAuthenticated,
  })

  const vendors = data?.vendors || []
  const vendorsWithKnownRisk = vendors.filter(
    (vendor) => vendor.riskScore !== null && vendor.riskScore !== undefined,
  )
  const leadCategory =
    Object.entries(
      vendors.reduce((accumulator, vendor) => {
        accumulator[vendor.category] = (accumulator[vendor.category] || 0) + 1
        return accumulator
      }, {}),
    ).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unassigned'

  const averageRisk = vendorsWithKnownRisk.length
    ? (
        vendorsWithKnownRisk.reduce((sum, vendor) => sum + vendor.riskScore, 0) /
        vendorsWithKnownRisk.length
      ).toFixed(1)
    : 'Unknown'

  const highRiskCount = vendorsWithKnownRisk.filter((vendor) => vendor.riskScore >= 7).length

  const sortedVendors = useMemo(() => {
    const items = [...vendors]

    items.sort((left, right) => {
      if (sortBy === 'name') return left.name.localeCompare(right.name)
      if (sortBy === 'category') return left.category.localeCompare(right.category)
      if (sortBy === 'paymentTerms') return left.paymentTerms - right.paymentTerms
      if (sortBy === 'riskScore') {
        const leftScore = left.riskScore ?? -1
        const rightScore = right.riskScore ?? -1
        return rightScore - leftScore
      }
      return new Date(right.createdAt) - new Date(left.createdAt)
    })

    return items
  }, [sortBy, vendors])

  const getRiskLabel = (score) => {
    if (score === null || score === undefined) return 'Unknown'
    if (score >= 7) return 'High'
    if (score >= 4) return 'Watch'
    return 'Stable'
  }

  const getOperationalStatus = (score, paymentTerms) => {
    if (score === null || score === undefined) return 'Review'
    if (score >= 7) return 'Escalated'
    if (paymentTerms > 45) return 'Review'
    return 'Active'
  }

  const vendorMutation = useMutation({
    mutationFn: async (payload) => {
      if (formMode === 'edit' && selectedVendor?.id) {
        const response = await api.put(`/vendors/${selectedVendor.id}`, payload)
        return response.data
      }

      const response = await api.post('/vendors', payload)
      return response.data
    },
    onSuccess: () => {
      setFormError('')
      setFormSuccess(
        formMode === 'edit'
          ? 'The vendor record has been updated and the directory is refreshing.'
          : 'The new vendor has been added and the directory is refreshing.',
      )
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      notifySuccess(
        formMode === 'edit' ? 'Vendor updated' : 'Vendor created',
        formMode === 'edit'
          ? 'Changes are saved and the vendor directory is refreshing.'
          : 'The new supplier record has been added to the directory.',
      )
    },
    onError: (mutationError) => {
      const message =
        mutationError?.response?.data?.message ||
        'Unable to save vendor. Please try again.'
      submitLockRef.current = false
      setFormError(message)
      notifyError('Unable to save vendor', message)
    },
  })

  const openCreateForm = () => {
    if (!isAuthenticated) {
      notifyError(
        'Login required',
        'Please log in before creating a vendor record.',
      )
      return
    }

    if (!canManageVendors) {
      notifyError(
        'Permission denied',
        'Only admins and managers can create vendors.',
      )
      return
    }

    setFormError('')
    setFormSuccess('')
    submitLockRef.current = false
    setFormMode('create')
    setSelectedVendor(null)
    setIsFormOpen(true)
  }

  const openEditForm = (vendor) => {
    if (!isAuthenticated) {
      notifyError(
        'Login required',
        'Please log in before editing vendor records.',
      )
      return
    }

    if (!canManageVendors) {
      notifyError(
        'Permission denied',
        'Only admins and managers can edit vendors.',
      )
      return
    }

    setFormError('')
    setFormSuccess('')
    submitLockRef.current = false
    setFormMode('edit')
    setSelectedVendor(vendor)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    if (vendorMutation.isPending) {
      return
    }

    setIsFormOpen(false)
    setSelectedVendor(null)
    setFormError('')
    setFormSuccess('')
    submitLockRef.current = false
  }

  useEffect(() => {
    if (!isFormOpen) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !vendorMutation.isPending) {
        closeForm()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFormOpen, vendorMutation.isPending])

  useEffect(() => {
    if (!formSuccess) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setIsFormOpen(false)
      setSelectedVendor(null)
      setFormError('')
      setFormSuccess('')
      submitLockRef.current = false
    }, 900)

    return () => window.clearTimeout(timeoutId)
  }, [formSuccess])

  const handleVendorSubmit = (values) => {
    if (submitLockRef.current || vendorMutation.isPending || formSuccess) {
      return
    }

    submitLockRef.current = true
    setFormError('')
    setFormSuccess('')
    vendorMutation.mutate({
      ...values,
      paymentTerms: Number(values.paymentTerms),
    })
  }

  const formModal =
    isFormOpen && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="form-modal-backdrop"
            role="presentation"
            onClick={() => {
              if (!vendorMutation.isPending) {
                closeForm()
              }
            }}
          >
            <div
              className="form-shell form-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="vendor-form-title"
              onClick={(event) => event.stopPropagation()}
            >
              <VendorForm
                mode={formMode}
                initialData={selectedVendor}
                onSubmit={handleVendorSubmit}
                onCancel={closeForm}
                isSubmitting={vendorMutation.isPending}
                serverError={formError}
                successMessage={formSuccess}
                disableClose={vendorMutation.isPending || Boolean(formSuccess)}
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
          eyebrow="VeriPay / Vendors"
          title="Vendor Directory"
          subtitle="Monitor partner health, search operational records, and move quickly on vendor actions."
          navLinks={[
            { label: 'Overview', to: '/', end: true },
            { label: 'Vendors', to: '/vendors' },
            { label: 'Invoices', href: '/' },
            { label: 'Disputes', href: '/' },
          ]}
          primaryAction={
            <button
              type="button"
              className="action-button"
              onClick={openCreateForm}
              disabled={!canManageVendors}
              title={
                canManageVendors
                  ? 'Create vendor'
                  : 'Only admins and managers can create vendors'
              }
            >
              New vendor
            </button>
          }
          user={user}
          isAuthenticated={isAuthenticated}
          onLogout={logout}
        />

        <section className="kpi-row compact-kpis">
          <article className="kpi-card">
            <span className="kpi-label">Total vendors</span>
            <strong>{vendors.length}</strong>
            <p className="kpi-detail">Tracked suppliers in the current workspace.</p>
          </article>
          <article className="kpi-card">
            <span className="kpi-label">Leading category</span>
            <strong>{leadCategory}</strong>
            <p className="kpi-detail">Largest concentration across the vendor network.</p>
          </article>
          <article className="kpi-card">
            <span className="kpi-label">Average risk</span>
            <strong>{averageRisk}</strong>
            <p className="kpi-detail">
              {highRiskCount} flagged {highRiskCount === 1 ? 'vendor' : 'vendors'} above threshold.
            </p>
          </article>
          <article className="kpi-card status-card">
            <span className="kpi-label">Board status</span>
            <strong>{isFetching ? 'Syncing' : 'Live'}</strong>
            <p className="kpi-detail">
              {isFetching
                ? 'Refreshing the operational view now.'
                : 'Workspace feed is ready for review.'}
            </p>
          </article>
        </section>

        <SurfaceSection>
          <SectionHeader
            eyebrow="Vendor table"
            title="Records"
            actions={
              <>
                <span className="meta-chip">{vendors.length} records</span>
                <span className="meta-chip muted">{leadCategory}</span>
              </>
            }
          />

        <div className="summary-strip">
          <span className="summary-chip">High risk: {highRiskCount}</span>
          <span className="summary-chip">Average risk: {averageRisk}</span>
          <span className="summary-chip">Status: {isFetching ? 'Syncing' : 'Live'}</span>
        </div>

        <div className="filter-toolbar">
            <div className="filter-toolbar-header">
              <p className="filter-toolbar-title">Filter workspace</p>
              <span className="filter-toolbar-meta">
                {category === 'All Categories' ? 'All categories' : category} /{' '}
                {sortLabels[sortBy] || 'Newest first'}
              </span>
            </div>

          <div className="filter-row">
            <label className="control control-search search-grow">
              <span>Search vendors</span>
              <div className="input-shell">
                <span className="input-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" className="input-icon-svg">
                    <circle
                      cx="11"
                      cy="11"
                      r="6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    />
                    <path
                      d="M20 20l-4.2-4.2"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="1.7"
                    />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search by vendor name or contact email"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </label>

            <label className="control compact-control">
              <span>Category</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="control compact-control">
              <span>Sort by</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="createdAt">Newest</option>
                <option value="name">Vendor name</option>
                <option value="category">Category</option>
                <option value="paymentTerms">Payment terms</option>
                <option value="riskScore">Risk score</option>
              </select>
            </label>
          </div>
        </div>

        {!isAuthenticated ? (
          <div className="notice-panel">
            <strong>Protected data</strong>
            <p>
              Authenticate to load vendor records from the secured API and enable
              table interactions.
            </p>
          </div>
        ) : null}

        {isAuthenticated && isLoading ? (
          <div className="table-panel">
            <table className="vendors-table vendors-table-skeleton">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Status</th>
                  <th>Category</th>
                  <th>Payment terms</th>
                  <th>Risk score</th>
                  <th>Contact</th>
                  <th className="actions-column">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 3 }).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    <td>
                      <div className="vendor-cell">
                        <div className="vendor-avatar skeleton-block skeleton-avatar" />
                        <div className="skeleton-stack">
                          <span className="skeleton-block skeleton-line skeleton-line-primary" />
                          <span className="skeleton-block skeleton-line skeleton-line-secondary" />
                        </div>
                      </div>
                    </td>
                    <td><span className="skeleton-block skeleton-chip" /></td>
                    <td><span className="skeleton-block skeleton-chip" /></td>
                    <td><span className="skeleton-block skeleton-line skeleton-line-small" /></td>
                    <td><span className="skeleton-block skeleton-line skeleton-line-small" /></td>
                    <td><span className="skeleton-block skeleton-line skeleton-line-medium" /></td>
                    <td>
                      <div className="row-actions">
                        <span className="skeleton-block skeleton-action" />
                        <span className="skeleton-block skeleton-action" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {isAuthenticated && isError ? (
          <div className="notice-panel error-panel">
            <div className="notice-header">
              <div>
                <strong>Unable to load vendors</strong>
                <p>{error?.response?.data?.message || error?.message}</p>
              </div>
              <button type="button" className="row-action primary" onClick={() => refetch()}>
                Retry
              </button>
            </div>
          </div>
        ) : null}

        {isAuthenticated && !isLoading && !isError ? (
          <div className="table-panel">
            <table className="vendors-table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Status</th>
                  <th>Category</th>
                  <th>Payment terms</th>
                  <th>Risk score</th>
                  <th>Contact</th>
                  <th className="actions-column">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedVendors.length ? (
                  sortedVendors.map((vendor) => (
                    <tr
                      key={vendor.id}
                      className={vendor.riskScore >= 7 ? 'table-row-high-risk' : ''}
                    >
                      <td className="vendor-column">
                        <div className="vendor-cell">
                          <div className="vendor-avatar">
                            {vendor.name?.slice(0, 2).toUpperCase() || 'VN'}
                          </div>
                          <div>
                            <strong>{vendor.name}</strong>
                            <span className="vendor-subtext">
                              Added {new Date(vendor.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="status-column">
                        <span
                            className={`status-tag ${getOperationalStatus(
                            vendor.riskScore,
                            vendor.paymentTerms,
                          ).toLowerCase()}`}
                        >
                          {getOperationalStatus(vendor.riskScore, vendor.paymentTerms)}
                        </span>
                      </td>
                      <td className="category-column">
                        <span className="category-tag">{vendor.category}</span>
                      </td>
                      <td className="terms-column">
                        <span className="table-emphasis">{vendor.paymentTerms} days</span>
                      </td>
                      <td className="risk-column">
                        <div className="risk-stack">
                          <RiskBadge score={vendor.riskScore} />
                          <span
                            className={`risk-tag ${vendor.riskScore >= 7 ? 'high' : ''}`}
                          >
                            {getRiskLabel(vendor.riskScore)}
                          </span>
                        </div>
                      </td>
                      <td className="contact-column">
                        <span className="table-mono">{vendor.contactEmail}</span>
                      </td>
                      <td className="actions-column">
                        <div className="row-actions">
                          <Link
                            to={`/vendors/${vendor.id}`}
                            className="row-action link-action primary"
                          >
                            <span className="row-action-icon" aria-hidden="true">
                              <svg viewBox="0 0 24 24" className="row-action-svg">
                                <path
                                  d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.7"
                                />
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="2.7"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.7"
                                />
                              </svg>
                            </span>
                            <span>View</span>
                          </Link>
                          <button
                            type="button"
                            className="row-action secondary"
                            disabled={!canManageVendors}
                            onClick={() => openEditForm(vendor)}
                          >
                            <span className="row-action-icon" aria-hidden="true">
                              <svg viewBox="0 0 24 24" className="row-action-svg">
                                <path
                                  d="M4 20h4l9.8-9.8-4-4L4 16v4Z"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeLinejoin="round"
                                  strokeWidth="1.7"
                                />
                                <path
                                  d="m12.8 5.2 4 4"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeLinecap="round"
                                  strokeWidth="1.7"
                                />
                              </svg>
                            </span>
                            <span>Edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7">
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
                        <strong>No vendor records match this view</strong>
                        <p>
                          Adjust the search, category, or sort settings to widen the
                          operational workspace results.
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

export default VendorsPage
