import { BarChart3, TrendingUp, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { assigneeColor } from '../lib/assigneeColors'
import { projectColor } from '../lib/constants'
import { useData } from '../context/DataContext'
import type { AnalyticsPeriod, ProductivityReport } from '../types'
import { cn, EmptyState } from './ui'

const PERIODS: { id: AnalyticsPeriod; label: string }[] = [
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: 'all', label: 'All time' },
]

const TEAM_LABEL = {
  frontend: 'Frontend',
  backend: 'Backend',
  other: 'Other',
} as const

export function AdminDashboard() {
  const { projects, fetchProductivity } = useData()
  const [period, setPeriod] = useState<AnalyticsPeriod>('7d')
  const [projectId, setProjectId] = useState<string | null>(null)
  const [report, setReport] = useState<ProductivityReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    void fetchProductivity(period, projectId)
      .then(setReport)
      .finally(() => setLoading(false))
  }, [period, projectId, fetchProductivity])

  const maxCompleted =
    report?.members.reduce((m, row) => Math.max(m, row.completedInPeriod), 0) ?? 1

  return (
    <div className="app-workspace-canvas flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="border-b px-5 py-4 app-border bg-[var(--color-surface-raised)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold app-text">
              <BarChart3 className="h-5 w-5 app-icon" />
              Team progress
            </h2>
            <p className="mt-1 text-sm app-text-muted">
              Completed tasks by person — for leads tracking frontend, backend, and
              project workload.
            </p>
          </div>
          <select
            className="app-input cursor-pointer py-2 text-sm"
            value={projectId ?? ''}
            onChange={(e) => setProjectId(e.target.value || null)}
          >
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition',
                period === p.id
                  ? 'app-btn-primary py-1.5'
                  : 'app-bg-subtle app-text-muted app-bg-hover',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      <div className="scrollbar-thin flex-1 overflow-y-auto p-5">
        {loading && !report && (
          <p className="text-sm app-text-muted">Loading analytics…</p>
        )}

        {report && (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <SummaryCard
                icon={<TrendingUp className="h-4 w-4" />}
                label="Completed in period"
                value={String(report.summary.completedInPeriod)}
              />
              <SummaryCard
                icon={<Users className="h-4 w-4" />}
                label="Open tasks (team)"
                value={String(report.summary.openTasks)}
              />
              <SummaryCard
                icon={<BarChart3 className="h-4 w-4" />}
                label="Frontend / Backend done"
                value={`${report.summary.teamTotals.frontend.completed} / ${report.summary.teamTotals.backend.completed}`}
              />
            </div>

            <section className="rounded-xl border p-4 app-border">
              <h3 className="mb-4 text-sm font-semibold app-text">By team member</h3>
              {report.members.length === 0 ? (
                <EmptyState
                  icon={<Users className="h-6 w-6" />}
                  title="No team members yet"
                  description="Add frontend and backend teammates under Manage team."
                />
              ) : (
                <ul className="space-y-3">
                  {report.members.map((row) => {
                    const pct =
                      maxCompleted > 0
                        ? Math.round((row.completedInPeriod / maxCompleted) * 100)
                        : 0
                    return (
                      <li
                        key={row.memberId}
                        className="rounded-lg border px-3 py-3 app-border app-bg-subtle"
                      >
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white"
                            style={{
                              backgroundColor: assigneeColor(row.colorIndex),
                            }}
                          >
                            {row.name.charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold app-text">
                              {row.name}
                            </p>
                            <p className="text-xs app-text-muted">
                              {TEAM_LABEL[row.team]} · {row.openInProgress} in
                              progress · {row.openTodo} to do
                            </p>
                          </div>
                          <span className="text-lg font-bold tabular-nums app-text">
                            {row.completedInPeriod}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[var(--color-fill-active)]">
                          <div
                            className="h-full rounded-full bg-[var(--color-accent)] transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            <section className="rounded-xl border p-4 app-border">
              <h3 className="mb-3 text-sm font-semibold app-text">
                Completed by project
              </h3>
              <ul className="space-y-2">
                {report.byProject.map((p, i) => (
                  <li
                    key={p.projectId}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="flex items-center gap-2 app-text-muted">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: projectColor(i) }}
                      />
                      {p.projectName}
                    </span>
                    <span className="font-semibold tabular-nums app-text">
                      {p.completedInPeriod}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border p-4 app-border app-bg-subtle">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium app-text-muted">
        {icon}
        {label}
      </div>
      <p className="text-2xl font-bold tabular-nums app-text">{value}</p>
    </div>
  )
}
