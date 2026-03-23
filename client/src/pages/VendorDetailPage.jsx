import { useParams } from 'react-router-dom'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import AppHeader from '../components/AppHeader'
import RiskBadge from '../components/RiskBadge'
import SectionHeader from '../components/SectionHeader'
import SurfaceSection from '../components/SurfaceSection'

async function fetchVendorDetail(id) {
  const response = await api.get(`/vendors/${id}`)
  return response.data
}

function VendorDetailPage() {
  const { id } = useParams()
  const { user, logout } = useAuth()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['vendor-detail', id],
    queryFn: () => fetchVendorDetail(id),
    enabled: Boolean(id),
  })

  const vendor = data?.vendor
  const invoices = vendor?.invoices || []

  const stats = useMemo(() => {
    const totalInvoices = invoices.length
    const totalDisputed = invoices.filter(
      (invoice) => invoice.status === 'DISPUTED' || invoice.disputes?.length,
    ).length

    const avgPaymentDelay = totalInvoices
      ? (
          invoices.reduce((sum, invoice) => {
            const dueDate = new Date(invoice.dueDate)
            const breachDate = invoice.slaBreach ? new Date(invoice.slaBreach) : dueDate
            const delayInMs = Math.max(0, breachDate - dueDate)
            return sum + delayInMs / (1000 * 60 * 60 * 24)
          }, 0) / totalInvoices
        ).toFixed(1)
      : '0.0'

    return { totalInvoices, totalDisputed, avgPaymentDelay }
  }, [invoices])

  const getInvoiceStatusTone = (status) => {
    if (status === 'PAID' || status === 'APPROVED') return 'active'
    if (status === 'DISPUTED' || status === 'REJECTED' || status === 'OVERDUE') {
      return 'escalated'
    }
    return 'review'
  }

  return (
    <main className="app-shell">
      <AppHeader
        eyebrow="VeriPay / Vendor Detail"
        title="Vendor Profile"
        navLinks={[
          { label: 'Vendors', to: '/vendors' },
          { label: 'Invoices', to: '/invoices' },
        ]}
        user={user || { name: 'Workspace user', role: 'Protected', email: '-' }}
        isAuthenticated
        onLogout={logout}
      />

      {isLoading ? (
        <SurfaceSection>
          <div className="notice-panel">
            <strong>Loading vendor</strong>
            <p>Fetching vendor profile and invoice history.</p>
          </div>
        </SurfaceSection>
      ) : null}

      {isError ? (
        <SurfaceSection>
          <div className="notice-panel error-panel">
            <strong>Unable to load vendor</strong>
            <p>{error?.response?.data?.message || error?.message}</p>
          </div>
        </SurfaceSection>
      ) : null}

      {!isLoading && !isError && vendor ? (
        <>
          <section className="detail-grid">
            <SurfaceSection as="article" className="vendor-info-card">
              <div className="detail-header">
                <div className="vendor-info-heading">
                  <p className="eyebrow">Vendor info</p>
                  <h2>{vendor.name}</h2>
                  <p className="vendor-info-copy">
                    Core supplier profile, contact footprint, and commercial terms for
                    this workspace relationship.
                  </p>
                </div>
                <div className="vendor-info-badges">
                  <span className="category-tag">{vendor.category}</span>
                  <RiskBadge score={vendor.riskScore} />
                </div>
              </div>

              <div className="detail-info-grid">
                <div className="detail-card">
                  <span className="detail-label">Category</span>
                  <strong className="detail-value">{vendor.category}</strong>
                </div>
                <div className="detail-card">
                  <span className="detail-label">Payment terms</span>
                  <strong className="detail-value">{vendor.paymentTerms} days</strong>
                </div>
                <div className="detail-card">
                  <span className="detail-label">Email</span>
                  <strong className="detail-value detail-mono">{vendor.contactEmail}</strong>
                </div>
                <div className="detail-card">
                  <span className="detail-label">Phone</span>
                  <strong className="detail-value detail-mono">
                    {vendor.contactPhone || 'Not provided'}
                  </strong>
                </div>
                <div className="detail-card detail-span">
                  <span className="detail-label">Address</span>
                  <strong className="detail-value">{vendor.address || 'Not provided'}</strong>
                </div>
              </div>
            </SurfaceSection>

            <SurfaceSection as="aside" className="stats-card">
              <p className="eyebrow">Mini stats</p>
              <div className="stats-stack">
                <div className="stat-tile">
                  <span className="detail-label">Total invoices</span>
                  <strong>{stats.totalInvoices}</strong>
                  <p className="stat-copy">Recorded documents tied to this vendor.</p>
                </div>
                <div className="stat-tile">
                  <span className="detail-label">Total disputed</span>
                  <strong>{stats.totalDisputed}</strong>
                  <p className="stat-copy">Invoices with active review or dispute activity.</p>
                </div>
                <div className="stat-tile">
                  <span className="detail-label">Avg payment delay</span>
                  <strong>{stats.avgPaymentDelay} days</strong>
                  <p className="stat-copy">Average lag beyond expected due date timing.</p>
                </div>
              </div>
            </SurfaceSection>
          </section>

          <SurfaceSection>
            <SectionHeader
              eyebrow="Invoices"
              title="Vendor invoice history"
              actions={
                <>
                  <span className="meta-chip">{invoices.length} invoices</span>
                  <span className="meta-chip muted">{stats.totalDisputed} disputed</span>
                </>
              }
            />

            <div className="table-panel">
              <table className="vendors-table detail-table">
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Due date</th>
                    <th>Delay</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length ? (
                    invoices.map((invoice) => {
                      const dueDate = new Date(invoice.dueDate)
                      const breachDate = invoice.slaBreach
                        ? new Date(invoice.slaBreach)
                        : dueDate
                      const delay = Math.max(
                        0,
                        Math.round((breachDate - dueDate) / (1000 * 60 * 60 * 24)),
                      )

                      return (
                        <tr key={invoice.id}>
                          <td className="invoice-id-cell">
                            <span className="table-mono">{invoice.id.slice(0, 8)}</span>
                          </td>
                          <td className="status-column">
                            <span
                              className={`status-tag ${getInvoiceStatusTone(invoice.status)}`}
                            >
                              {invoice.status}
                            </span>
                          </td>
                          <td className="amount-column">
                            <span className="invoice-amount">
                              {invoice.currency} {Number(invoice.amount).toFixed(2)}
                            </span>
                          </td>
                          <td className="date-column">{dueDate.toLocaleDateString()}</td>
                          <td className="delay-column">
                            <span className={`delay-chip ${delay > 0 ? 'delayed' : 'ontime'}`}>
                              {delay} days
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan="5">
                        <div className="table-empty rich-empty-state">
                          <div className="empty-illustration" aria-hidden="true">
                            <svg viewBox="0 0 64 64" className="empty-illustration-svg">
                              <rect
                                x="12"
                                y="12"
                                width="40"
                                height="40"
                                rx="6"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                              />
                              <path
                                d="M22 24h20M22 32h20M22 40h12"
                                fill="none"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeWidth="1.8"
                              />
                            </svg>
                          </div>
                          <strong>No invoices recorded yet</strong>
                          <p>This vendor does not have invoice history in the current workspace.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </SurfaceSection>
        </>
      ) : null}
    </main>
  )
}

export default VendorDetailPage
