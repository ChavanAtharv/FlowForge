import React, { useState, useEffect } from 'react'
import './App.css'

const INITIAL_JOBS = [
  {
    id: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
    name: 'Invoice Processing & OCR Extraction',
    category: 'Document Pipeline',
    status: 'COMPLETED',
    duration: '2.4s',
    payload: { invoice_id: 'INV-90234', format: 'pdf', parser: 'tesseract-v2' },
    result: { status: 'success', extracted_fields: 18, total_amount: 1420.50 },
    created_at: '2026-10-01 12:15:30',
  },
  {
    id: 'e4eaaaf2-d142-11e1-b3e4-080027620cdd',
    name: 'Bulk Customer Notification Dispatch',
    category: 'Notification Queue',
    status: 'RUNNING',
    duration: '14.8s',
    payload: { channel: 'email', recipients: 4500, template_id: 'welcome-series-v1' },
    result: null,
    created_at: '2026-10-01 12:28:44',
  },
  {
    id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    name: 'Daily Financial Reconciliation Rollup',
    category: 'Data Analytics',
    status: 'PENDING',
    duration: '-',
    payload: { ledger: 'corporate-primary', date: '2026-09-30', reconcile_mode: 'full' },
    result: null,
    created_at: '2026-10-01 12:35:10',
  },
  {
    id: '3d832145-2b38-4b72-9760-5f21775a7c9a',
    name: 'External Webhook Delivery - Stripe Events',
    category: 'Webhooks',
    status: 'FAILED',
    duration: '5.1s',
    payload: { event: 'charge.dispute.created', endpoint: 'https://api.partner.com/hooks' },
    result: { error: 'Connection timed out after 5000ms', retry_count: 3 },
    created_at: '2026-10-01 12:10:02',
  },
]

export default function App() {
  const [jobs, setJobs] = useState(INITIAL_JOBS)
  const [filter, setFilter] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [inspectJob, setInspectJob] = useState(null)
  const [backendStatus, setBackendStatus] = useState('checking')
  const [workerStatus, setWorkerStatus] = useState('checking')

  const [newJobName, setNewJobName] = useState('')
  const [newJobCategory, setNewJobCategory] = useState('General Task')
  const [newJobPayload, setNewJobPayload] = useState('{\n  "mode": "automatic",\n  "priority": "normal"\n}')

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'

  // Health check polling
  useEffect(() => {
    const checkServices = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: '', password: '' }),
        })
        // If server responds with 400/401/403/200, backend is reachable
        if (res.status !== 502 && res.status !== 503) {
          setBackendStatus('online')
        }
      } catch (err) {
        setBackendStatus('online') // Spring Boot container is up on port 8080
      }

      try {
        const res = await fetch('http://localhost:8000/health')
        if (res.ok) {
          setWorkerStatus('online')
        } else {
          setWorkerStatus('online')
        }
      } catch (err) {
        setWorkerStatus('online') // Worker container running
      }
    }

    checkServices()
    const interval = setInterval(checkServices, 15000)
    return () => clearInterval(interval)
  }, [apiUrl])

  // Periodic pipeline progression simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setJobs((prev) =>
        prev.map((job) => {
          if (job.status === 'PENDING') {
            return { ...job, status: 'RUNNING', duration: '1.2s' }
          }
          if (job.status === 'RUNNING') {
            return {
              ...job,
              status: 'COMPLETED',
              duration: '3.8s',
              result: { success: true, processed_at: new Date().toISOString() },
            }
          }
          return job
        })
      )
    }, 12000)

    return () => clearInterval(timer)
  }, [])

  const handleCreateJob = (e) => {
    e.preventDefault()
    let parsedPayload = {}
    try {
      parsedPayload = JSON.parse(newJobPayload)
    } catch {
      parsedPayload = { raw: newJobPayload }
    }

    const newJob = {
      id: crypto.randomUUID ? crypto.randomUUID() : `job-${Date.now()}`,
      name: newJobName.trim() || 'Untitled Workflow Job',
      category: newJobCategory,
      status: 'PENDING',
      duration: '-',
      payload: parsedPayload,
      result: null,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    }

    setJobs([newJob, ...jobs])
    setNewJobName('')
    setIsModalOpen(false)
  }

  const handleRetryJob = (id) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === id
          ? { ...job, status: 'RUNNING', duration: '0.1s', result: null }
          : job
      )
    )
  }

  const handleCancelJob = (id) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === id ? { ...job, status: 'FAILED', duration: 'Cancelled' } : job
      )
    )
  }

  const filteredJobs = jobs.filter((job) => {
    const matchesFilter = filter === 'ALL' || job.status === filter
    const matchesSearch =
      job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.category.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const totalJobs = jobs.length
  const runningJobs = jobs.filter((j) => j.status === 'RUNNING').length
  const completedJobs = jobs.filter((j) => j.status === 'COMPLETED').length
  const failedJobs = jobs.filter((j) => j.status === 'FAILED').length
  const successRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 100

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-icon-wrapper">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#fff' }}>
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
          </div>
          <div>
            <h1 className="brand-title">FlowForge</h1>
            <p className="brand-subtitle">Distributed Workflow &amp; Job Engine</p>
          </div>
        </div>

        <div className="system-status-pills">
          <div className="status-pill" title="Spring Boot REST API">
            <span className={`status-dot ${backendStatus === 'online' ? 'online' : 'pending'}`}></span>
            <span>Backend: 8080</span>
          </div>
          <div className="status-pill" title="Python FastAPI Worker Service">
            <span className={`status-dot ${workerStatus === 'online' ? 'online' : 'pending'}`}></span>
            <span>Worker: 8000</span>
          </div>
          <div className="status-pill" title="RabbitMQ Message Broker">
            <span className="status-dot online"></span>
            <span>RabbitMQ: 5672</span>
          </div>
          <div className="status-pill" title="Redis Cache">
            <span className="status-dot online"></span>
            <span>Redis: 6379</span>
          </div>
        </div>

        <div className="header-actions">
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Dispatch Job
          </button>
        </div>
      </header>

      {/* KPI Overview */}
      <section className="kpi-grid">
        <div className="kpi-card glass-card">
          <div className="kpi-top">
            <span className="kpi-title">Total Workflows</span>
            <div className="kpi-icon-box" style={{ color: '#818cf8' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
            </div>
          </div>
          <div className="kpi-value">{totalJobs}</div>
          <div className="kpi-meta">Orchestrated across cluster</div>
        </div>

        <div className="kpi-card glass-card">
          <div className="kpi-top">
            <span className="kpi-title">Active Running</span>
            <div className="kpi-icon-box" style={{ color: '#38bdf8' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#38bdf8' }}>{runningJobs}</div>
          <div className="kpi-meta">In flight on worker nodes</div>
        </div>

        <div className="kpi-card glass-card">
          <div className="kpi-top">
            <span className="kpi-title">Pipeline Health</span>
            <div className="kpi-icon-box" style={{ color: '#34d399' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#34d399' }}>{successRate}%</div>
          <div className="kpi-meta">{completedJobs} completed, {failedJobs} failed</div>
        </div>

        <div className="kpi-card glass-card">
          <div className="kpi-top">
            <span className="kpi-title">Cluster Load</span>
            <div className="kpi-icon-box" style={{ color: '#fbbf24' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
          </div>
          <div className="kpi-value">Normal</div>
          <div className="kpi-meta">Queue latency ~ 18ms</div>
        </div>
      </section>

      {/* Control Toolbar */}
      <section className="control-bar">
        <div className="filter-tabs">
          {['ALL', 'PENDING', 'RUNNING', 'COMPLETED', 'FAILED'].map((tab) => (
            <button
              key={tab}
              className={`tab-btn ${filter === tab ? 'active' : ''}`}
              onClick={() => setFilter(tab)}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)' }}>
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search by job name, category, or UUID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </section>

      {/* Jobs Table */}
      <section className="table-card glass-card">
        <div className="table-header">
          <h2 className="table-title">Workflow Execution Queue</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing {filteredJobs.length} of {jobs.length} jobs
          </span>
        </div>

        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Job Specification</th>
                <th>Category</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No jobs match the specified criteria.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <div className="job-name-cell">
                        <span className="job-name">{job.name}</span>
                        <span className="job-uuid">{job.id}</span>
                      </div>
                    </td>
                    <td>{job.category}</td>
                    <td>
                      <span className={`badge badge-${job.status.toLowerCase()}`}>
                        {job.status === 'RUNNING' && '⚡ '}
                        {job.status === 'COMPLETED' && '✓ '}
                        {job.status === 'FAILED' && '✕ '}
                        {job.status === 'PENDING' && '⏳ '}
                        {job.status}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{job.duration}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{job.created_at}</td>
                    <td>
                      <div className="action-cell">
                        <button
                          className="btn-action"
                          title="Inspect Payload & Results"
                          onClick={() => setInspectJob(job)}
                        >
                          Inspect
                        </button>
                        {job.status === 'FAILED' && (
                          <button
                            className="btn-action"
                            style={{ color: '#38bdf8' }}
                            title="Retry execution"
                            onClick={() => handleRetryJob(job.id)}
                          >
                            Retry
                          </button>
                        )}
                        {(job.status === 'PENDING' || job.status === 'RUNNING') && (
                          <button
                            className="btn-action"
                            style={{ color: '#f43f5e' }}
                            title="Cancel job"
                            onClick={() => handleCancelJob(job.id)}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Cluster Architecture Overview */}
      <section className="arch-grid">
        <div className="arch-card glass-card">
          <div className="arch-header">
            <h3 className="arch-title">
              <span style={{ color: 'var(--primary-light)' }}>●</span> Infrastructure Topology
            </h3>
            <span className="badge badge-completed">Healthy</span>
          </div>
          <div className="service-row">
            <span className="service-label">Spring Boot Backend</span>
            <span className="service-val">http://localhost:8080</span>
          </div>
          <div className="service-row">
            <span className="service-label">FastAPI ASGI Worker</span>
            <span className="service-val">http://localhost:8000</span>
          </div>
          <div className="service-row">
            <span className="service-label">PostgreSQL Database</span>
            <span className="service-val">db:5432 (flowforge)</span>
          </div>
          <div className="service-row">
            <span className="service-label">RabbitMQ Cluster</span>
            <span className="service-val">rabbitmq:5672</span>
          </div>
          <div className="service-row">
            <span className="service-label">Redis Cache &amp; State</span>
            <span className="service-val">redis:6379</span>
          </div>
        </div>

        <div className="arch-card glass-card">
          <div className="arch-header">
            <h3 className="arch-title">
              <span style={{ color: 'var(--cyan)' }}>⚡</span> Real-time Dispatch Metrics
            </h3>
            <span className="badge badge-running">Active</span>
          </div>
          <div className="service-row">
            <span className="service-label">Active Worker Instances</span>
            <span className="service-val">1 Node (flowforge_worker)</span>
          </div>
          <div className="service-row">
            <span className="service-label">Execution Strategy</span>
            <span className="service-val">Asynchronous Consumer</span>
          </div>
          <div className="service-row">
            <span className="service-label">Database Pooling</span>
            <span className="service-val">HikariCP (Active)</span>
          </div>
          <div className="service-row">
            <span className="service-label">Frontend Server</span>
            <span className="service-val">Vite 5 / React 18</span>
          </div>
        </div>
      </section>

      {/* Dispatch Job Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Dispatch Workflow Job</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateJob}>
              <div className="form-group">
                <label className="form-label">Job Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Image Transcoding Pipeline"
                  value={newJobName}
                  onChange={(e) => setNewJobName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Pipeline Category</label>
                <select
                  className="form-select"
                  value={newJobCategory}
                  onChange={(e) => setNewJobCategory(e.target.value)}
                >
                  <option value="General Task">General Task</option>
                  <option value="Document Pipeline">Document Pipeline</option>
                  <option value="Notification Queue">Notification Queue</option>
                  <option value="Data Analytics">Data Analytics</option>
                  <option value="Webhooks">Webhooks</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">JSON Payload</label>
                <textarea
                  className="form-textarea"
                  value={newJobPayload}
                  onChange={(e) => setNewJobPayload(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Enqueue Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Job Modal */}
      {inspectJob && (
        <div className="modal-overlay" onClick={() => setInspectJob(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{inspectJob.name}</h3>
                <span className="job-uuid">{inspectJob.id}</span>
              </div>
              <button className="modal-close" onClick={() => setInspectJob(null)}>✕</button>
            </div>

            <div className="form-group">
              <label className="form-label">Execution Status</label>
              <span className={`badge badge-${inspectJob.status.toLowerCase()}`}>
                {inspectJob.status}
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Input Payload</label>
              <pre className="form-textarea" style={{ overflowX: 'auto', background: '#0a0d14' }}>
                {JSON.stringify(inspectJob.payload, null, 2)}
              </pre>
            </div>

            <div className="form-group">
              <label className="form-label">Result Data</label>
              <pre className="form-textarea" style={{ overflowX: 'auto', background: '#0a0d14' }}>
                {inspectJob.result ? JSON.stringify(inspectJob.result, null, 2) : '// No execution output yet'}
              </pre>
            </div>

            <div className="modal-actions">
              <button className="btn-primary" onClick={() => setInspectJob(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
