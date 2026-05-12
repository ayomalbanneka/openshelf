'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { http } from '@/lib/api'
import { toast } from '@/lib/toast'

type AlertSeverity = 'critical' | 'warning'

interface Metrics {
  system: {
    uptime: number
    uptimeHuman: string
    startedAt?: string
    nodeVersion: string
    platform: string
    cpuCount: number
    loadAvg: string[]
  }
  memory: {
    heapUsed: number
    heapTotal: number
    rss: number
    systemTotal: number
    systemFree: number
    systemUsedPct: string
    heapUsedPct: string
  }
  requests: {
    total: number
    active: number
    errorRate: string
    avgResponseMs: number
    latency?: {
      avgMs: number
      p50Ms: number
      p95Ms: number
      p99Ms: number
    }
    throughput?: {
      rpm: number
      errorRpm: number
      windowSec: number
    }
    topRoutes: { route: string; count: number }[]
    topEndpoints?: { endpoint: string; count: number }[]
    topRouteGroups?: { route: string; count: number }[]
    statusBreakdown: Record<string, number>
    errorTypes?: { type: string; count: number }[]
  }
  database: {
    status: string
    latencyMs: number
    avgQueryMs?: number
    p95QueryMs?: number
    slowQueries?: number
  }
  alerts?: {
    state: 'healthy' | 'warning' | 'critical'
    items: { severity: AlertSeverity; key: string; message: string }[]
  }
}

interface TrendPoint {
  time: string
  rpm: number
  p95: number
  errorRate: number
  memoryPct: number
}

const MAX_POINTS = 24

const cardStyle = {
  backgroundColor: 'var(--admin-surface)',
  border: '1px solid var(--admin-border)',
  boxShadow: 'var(--admin-card-shadow)',
}

function valueColour(status: 'good' | 'warn' | 'bad' = 'good') {
  if (status === 'bad') return 'var(--admin-danger)'
  if (status === 'warn') return 'var(--admin-warn)'
  return 'var(--admin-success)'
}

function MiniTrend({ values, colour }: { values: number[]; colour: string }) {
  if (values.length === 0) {
    return <p className="text-xs" style={{ color: 'var(--admin-muted)' }}>No trend data yet</p>
  }

  const max = Math.max(...values, 1)
  return (
    <div className="h-14 flex items-end gap-1">
      {values.map((v, i) => {
        const pct = Math.max(6, Math.round((v / max) * 100))
        return (
          <span
            key={`${i}-${v}`}
            className="flex-1 rounded-sm"
            style={{
              height: `${pct}%`,
              backgroundColor: colour,
              opacity: 0.35 + (i / values.length) * 0.65,
            }}
          />
        )
      })}
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  state,
}: {
  label: string
  value: string | number
  sub?: string
  state?: 'good' | 'warn' | 'bad'
}) {
  return (
    <div className="p-4 rounded-2xl flex flex-col gap-1.5" style={cardStyle}>
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--admin-muted)' }}>
        {label}
      </p>
      <p className="text-2xl font-bold" style={{ color: valueColour(state) }}>{value}</p>
      {sub && (
        <p className="text-xs" style={{ color: 'var(--admin-muted)' }}>{sub}</p>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const healthy = status === 'healthy'
  return (
    <span
      className="text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{
        backgroundColor: healthy ? 'color-mix(in srgb, var(--admin-success) 14%, transparent)' : 'color-mix(in srgb, var(--admin-danger) 14%, transparent)',
        color: healthy ? 'var(--admin-success)' : 'var(--admin-danger)',
      }}
    >
      {status}
    </span>
  )
}

function AlertChip({ severity, message }: { severity: AlertSeverity; message: string }) {
  const bad = severity === 'critical'
  return (
    <div
      className="px-3 py-2 rounded-xl text-sm"
      style={{
        border: `1px solid ${bad ? 'color-mix(in srgb, var(--admin-danger) 28%, transparent)' : 'color-mix(in srgb, var(--admin-warn) 30%, transparent)'}`,
        backgroundColor: bad
          ? 'color-mix(in srgb, var(--admin-danger) 14%, transparent)'
          : 'color-mix(in srgb, var(--admin-warn) 14%, transparent)',
        color: bad ? 'var(--admin-danger)' : 'var(--admin-warn)',
      }}
    >
      {message}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-bold" style={{ color: 'var(--admin-text)' }}>{title}</h2>
      {children}
    </section>
  )
}

export default function MonitoringPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [history, setHistory] = useState<TrendPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(10)

  const metricsUrl = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
    return `${base.replace(/\/api\/?$/, '')}/metrics/dashboard`
  }, [])

  const fetchMetrics = useCallback(async () => {
    try {
      const { data } = await http.get<Metrics>(metricsUrl)
      setMetrics(data)
      setLastUpdated(new Date())

      const errorRate = parseFloat(data.requests.errorRate.replace('%', '')) || 0
      const p95 = data.requests.latency?.p95Ms ?? data.requests.avgResponseMs
      const rpm = data.requests.throughput?.rpm ?? 0
      const memoryPct = Number(data.memory.systemUsedPct) || 0

      setHistory((prev) => {
        const next = [...prev, {
          time: new Date().toLocaleTimeString(),
          rpm,
          p95,
          errorRate,
          memoryPct,
        }]
        return next.slice(-MAX_POINTS)
      })
    } catch {
      toast.error('Failed to fetch monitoring metrics')
    } finally {
      setLoading(false)
    }
  }, [metricsUrl])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(fetchMetrics, refreshInterval * 1000)
    return () => clearInterval(id)
  }, [autoRefresh, refreshInterval, fetchMetrics])

  const exportJson = () => {
    if (!metrics) return
    const blob = new Blob([JSON.stringify(metrics, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `monitoring-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const exportCsv = () => {
    if (!metrics) return

    const rows = [
      ['metric', 'value'],
      ['uptime_human', metrics.system.uptimeHuman],
      ['started_at', metrics.system.startedAt || 'n/a'],
      ['requests_total', String(metrics.requests.total)],
      ['requests_active', String(metrics.requests.active)],
      ['rpm', String(metrics.requests.throughput?.rpm ?? 0)],
      ['error_rpm', String(metrics.requests.throughput?.errorRpm ?? 0)],
      ['error_rate', metrics.requests.errorRate],
      ['latency_p50_ms', String(metrics.requests.latency?.p50Ms ?? 0)],
      ['latency_p95_ms', String(metrics.requests.latency?.p95Ms ?? metrics.requests.avgResponseMs)],
      ['latency_p99_ms', String(metrics.requests.latency?.p99Ms ?? 0)],
      ['db_status', metrics.database.status],
      ['db_latency_ms', String(metrics.database.latencyMs)],
      ['db_avg_query_ms', String(metrics.database.avgQueryMs ?? 0)],
      ['db_p95_query_ms', String(metrics.database.p95QueryMs ?? 0)],
      ['db_slow_queries', String(metrics.database.slowQueries ?? 0)],
      ['system_memory_pct', metrics.memory.systemUsedPct],
    ]

    const csv = rows.map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `monitoring-${Date.now()}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--admin-soft)' }} />
        ))}
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="py-12 text-center rounded-2xl" style={{ ...cardStyle, color: 'var(--admin-muted)' }}>
        Monitoring data is unavailable.
      </div>
    )
  }

  const alertState = metrics.alerts?.state || 'healthy'
  const p95 = metrics.requests.latency?.p95Ms ?? metrics.requests.avgResponseMs
  const p99 = metrics.requests.latency?.p99Ms ?? 0
  const throughput = metrics.requests.throughput?.rpm ?? 0

  const throughputState = throughput < 1 ? 'warn' : 'good'
  const latencyState = p95 > 500 ? 'bad' : p95 > 250 ? 'warn' : 'good'
  const errorRateNum = parseFloat(metrics.requests.errorRate.replace('%', '')) || 0
  const errorState = errorRateNum > 2 ? 'bad' : errorRateNum > 0.5 ? 'warn' : 'good'
  const dbState = metrics.database.status === 'healthy' ? 'good' : 'bad'

  const statusCodeColours: Record<string, string> = {
    '2xx': 'var(--admin-success)',
    '3xx': 'var(--admin-accent)',
    '4xx': 'var(--admin-warn)',
    '5xx': 'var(--admin-danger)',
    unknown: 'var(--admin-muted)',
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--admin-text)' }}>System monitoring</h1>
          <p className="text-sm" style={{ color: 'var(--admin-muted)' }}>
            {lastUpdated ? `Last updated ${lastUpdated.toLocaleTimeString()}` : 'No recent updates'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="h-9 rounded-lg px-3 text-sm outline-none"
            style={{
              border: '1px solid var(--admin-border)',
              backgroundColor: 'var(--admin-surface)',
              color: 'var(--admin-text)',
            }}
          >
            <option value={5}>Every 5s</option>
            <option value={10}>Every 10s</option>
            <option value={30}>Every 30s</option>
            <option value={60}>Every 60s</option>
          </select>

          <button
            onClick={() => setAutoRefresh((v) => !v)}
            className="px-3 py-2 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: autoRefresh ? 'color-mix(in srgb, var(--admin-success) 18%, var(--admin-surface))' : 'var(--admin-soft)',
              color: autoRefresh ? 'var(--admin-success)' : 'var(--admin-muted)',
              border: '1px solid var(--admin-border)',
            }}
          >
            {autoRefresh ? 'Pause' : 'Resume'}
          </button>

          <button
            onClick={fetchMetrics}
            className="px-3 py-2 rounded-lg text-sm font-medium"
            style={{ border: '1px solid var(--admin-border)', backgroundColor: 'var(--admin-surface)', color: 'var(--admin-text)' }}
          >
            Refresh
          </button>

          <button
            onClick={exportJson}
            className="px-3 py-2 rounded-lg text-sm font-medium"
            style={{ border: '1px solid var(--admin-border)', backgroundColor: 'var(--admin-surface)', color: 'var(--admin-text)' }}
          >
            Export JSON
          </button>

          <button
            onClick={exportCsv}
            className="px-3 py-2 rounded-lg text-sm font-medium"
            style={{ border: '1px solid var(--admin-border)', backgroundColor: 'var(--admin-surface)', color: 'var(--admin-text)' }}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Uptime" value={metrics.system.uptimeHuman} sub={`Node ${metrics.system.nodeVersion}`} />
        <StatCard label="Requests" value={metrics.requests.total.toLocaleString()} sub={`${metrics.requests.active} active`} />
        <StatCard label="Throughput" value={`${throughput}/min`} sub={`window ${metrics.requests.throughput?.windowSec ?? 0}s`} state={throughputState} />
        <StatCard label="Latency p95" value={`${p95}ms`} sub={`p99 ${p99}ms`} state={latencyState} />
        <StatCard label="Error rate" value={metrics.requests.errorRate} sub={`${metrics.requests.throughput?.errorRpm ?? 0}/min`} state={errorState} />
        <StatCard label="Database" value={`${metrics.database.latencyMs}ms`} sub={metrics.database.status} state={dbState} />
      </div>

      <Section title="Alert state">
        <div className="p-4 rounded-2xl flex flex-col gap-3" style={cardStyle}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: 'var(--admin-text)' }}>
              Current state
            </p>
            <StatusBadge status={alertState} />
          </div>
          {!metrics.alerts?.items?.length ? (
            <p className="text-sm" style={{ color: 'var(--admin-muted)' }}>
              No active alerts.
            </p>
          ) : (
            metrics.alerts.items.map((item) => (
              <AlertChip key={`${item.key}-${item.message}`} severity={item.severity} message={item.message} />
            ))
          )}
        </div>
      </Section>

      <Section title="Trends">
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl flex flex-col gap-2" style={cardStyle}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--admin-muted)' }}>Req/min</p>
            <MiniTrend values={history.map((h) => h.rpm)} colour="var(--admin-accent)" />
          </div>
          <div className="p-4 rounded-2xl flex flex-col gap-2" style={cardStyle}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--admin-muted)' }}>Latency p95</p>
            <MiniTrend values={history.map((h) => h.p95)} colour="var(--admin-warn)" />
          </div>
          <div className="p-4 rounded-2xl flex flex-col gap-2" style={cardStyle}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--admin-muted)' }}>Error rate %</p>
            <MiniTrend values={history.map((h) => h.errorRate)} colour="var(--admin-danger)" />
          </div>
          <div className="p-4 rounded-2xl flex flex-col gap-2" style={cardStyle}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--admin-muted)' }}>Memory %</p>
            <MiniTrend values={history.map((h) => h.memoryPct)} colour="var(--admin-success)" />
          </div>
        </div>
      </Section>

      <Section title="System and database">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl flex flex-col gap-2.5" style={cardStyle}>
            {[{
              label: 'Platform', value: metrics.system.platform,
            }, {
              label: 'CPU cores', value: metrics.system.cpuCount,
            }, {
              label: 'Load avg', value: metrics.system.loadAvg.join(', '),
            }, {
              label: 'Started at', value: metrics.system.startedAt ? new Date(metrics.system.startedAt).toLocaleString() : 'n/a',
            }].map((row) => (
              <div key={row.label} className="flex items-center justify-between text-sm gap-4">
                <span style={{ color: 'var(--admin-muted)' }}>{row.label}</span>
                <span className="font-medium text-right" style={{ color: 'var(--admin-text)' }}>{row.value}</span>
              </div>
            ))}
          </div>

          <div className="p-5 rounded-2xl flex flex-col gap-2.5" style={cardStyle}>
            <div className="flex items-center justify-between mb-1">
              <p className="font-semibold" style={{ color: 'var(--admin-text)' }}>Database</p>
              <StatusBadge status={metrics.database.status} />
            </div>
            {[{
              label: 'Health latency', value: `${metrics.database.latencyMs}ms`,
            }, {
              label: 'Avg query', value: `${metrics.database.avgQueryMs ?? 0}ms`,
            }, {
              label: 'p95 query', value: `${metrics.database.p95QueryMs ?? 0}ms`,
            }, {
              label: 'Slow queries', value: String(metrics.database.slowQueries ?? 0),
            }].map((row) => (
              <div key={row.label} className="flex items-center justify-between text-sm gap-4">
                <span style={{ color: 'var(--admin-muted)' }}>{row.label}</span>
                <span className="font-medium text-right" style={{ color: 'var(--admin-text)' }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Request analytics">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl flex flex-col gap-3" style={cardStyle}>
            <p className="text-sm font-semibold" style={{ color: 'var(--admin-text)' }}>Status codes</p>
            {Object.keys(metrics.requests.statusBreakdown).length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--admin-muted)' }}>No requests yet</p>
            ) : (
              Object.entries(metrics.requests.statusBreakdown)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([code, count]) => (
                  <div key={code} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: 'var(--admin-text)' }}>{code}</span>
                      <span style={{ color: 'var(--admin-muted)' }}>{count.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--admin-soft)' }}>
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${metrics.requests.total > 0 ? (count / metrics.requests.total) * 100 : 0}%`,
                          backgroundColor: statusCodeColours[code] || 'var(--admin-muted)',
                        }}
                      />
                    </div>
                  </div>
                ))
            )}
          </div>

          <div className="p-5 rounded-2xl flex flex-col gap-3" style={cardStyle}>
            <p className="text-sm font-semibold" style={{ color: 'var(--admin-text)' }}>Top route groups</p>
            {(metrics.requests.topRouteGroups || []).length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--admin-muted)' }}>No routes yet</p>
            ) : (
              (metrics.requests.topRouteGroups || []).map((row) => (
                <div key={row.route} className="flex items-center justify-between gap-3 text-sm">
                  <code className="truncate" style={{ color: 'var(--admin-text)' }}>{row.route}</code>
                  <span className="font-semibold" style={{ color: 'var(--admin-accent)' }}>{row.count.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>

          <div className="p-5 rounded-2xl flex flex-col gap-3" style={cardStyle}>
            <p className="text-sm font-semibold" style={{ color: 'var(--admin-text)' }}>Top endpoints</p>
            {(metrics.requests.topEndpoints || []).length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--admin-muted)' }}>No endpoints yet</p>
            ) : (
              (metrics.requests.topEndpoints || []).map((row) => (
                <div key={row.endpoint} className="flex items-center justify-between gap-3 text-sm">
                  <code className="truncate" style={{ color: 'var(--admin-text)' }}>{row.endpoint}</code>
                  <span className="font-semibold" style={{ color: 'var(--admin-accent)' }}>{row.count.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>

          <div className="p-5 rounded-2xl flex flex-col gap-3" style={cardStyle}>
            <p className="text-sm font-semibold" style={{ color: 'var(--admin-text)' }}>Error types</p>
            {(metrics.requests.errorTypes || []).length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--admin-muted)' }}>No errors tracked yet</p>
            ) : (
              (metrics.requests.errorTypes || []).map((row) => (
                <div key={row.type} className="flex items-center justify-between gap-3 text-sm">
                  <code className="truncate" style={{ color: 'var(--admin-text)' }}>{row.type}</code>
                  <span className="font-semibold" style={{ color: 'var(--admin-danger)' }}>{row.count.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </Section>
    </div>
  )
}
