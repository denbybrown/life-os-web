'use client';
import { format } from 'date-fns';
import Link from 'next/link';
import { useDailyBrief } from '@/hooks/useDashboard';
import { useOuraToday } from '@/hooks/useHealth';
import { useWeightLog } from '@/hooks/useHealth';
import { useTransactions } from '@/hooks/useBudget';
import { useBooks } from '@/hooks/useBooks';
import { useTodos } from '@/hooks/useTodos';
import { useMealPlan } from '@/hooks/useMeals';

function greet() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function scoreColor(v?: number | null) {
  if (!v) return 'text-tm';
  if (v >= 85) return 'text-oura-optimal';
  if (v >= 70) return 'text-oura-good';
  if (v >= 60) return 'text-oura-fair';
  return 'text-oura-poor';
}

function ModuleCard({ emoji, label, value, sub, href, color }: {
  emoji: string; label: string; value: string; sub?: string; href: string; color: string;
}) {
  return (
    <Link href={href} className={`bg-surface border border-border rounded-xl p-4 flex items-center gap-3 active:bg-elevated transition-colors border-l-[3px] ${color}`}>
      <span className="text-2xl">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-tm uppercase tracking-widest font-semibold">{label}</p>
        <p className="text-tx font-semibold text-sm mt-0.5 truncate">{value}</p>
        {sub && <p className="text-tm text-xs mt-0.5 truncate">{sub}</p>}
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { brief, isLoading: briefLoading, generate } = useDailyBrief();
  const { data: oura } = useOuraToday();
  const { latestWeight } = useWeightLog();
  const { totalIncome, totalExpenses } = useTransactions();
  const { byStatus } = useBooks();
  const { open, overdue } = useTodos();
  const { latestPlan } = useMealPlan();

  const bd = brief?.brief_json;

  return (
    <div className="px-4 pt-safe-or-4 pb-4">
      {/* Header */}
      <div className="flex justify-between items-start py-5">
        <div>
          <h1 className="text-2xl font-bold text-tx tracking-tight">{greet()}</h1>
          <p className="text-ts text-sm mt-0.5">{format(new Date(), 'EEEE, d MMMM')}</p>
        </div>
        {oura?.readiness && (
          <div className="bg-surface border border-border rounded-full px-3 py-1.5 mt-1">
            <span className={`text-sm font-medium ${scoreColor(oura.readiness)}`}>
              ⚡ {oura.readiness}
            </span>
          </div>
        )}
      </div>

      {/* Daily brief card */}
      <div className="bg-surface border border-accent/30 rounded-2xl p-4 mb-5">
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm font-semibold text-tx">Today&apos;s brief</p>
          <button
            onClick={() => generate.mutate()}
            disabled={generate.isPending}
            className="text-xs text-accent-light bg-accent/10 border border-accent/30 rounded-full px-3 py-1 disabled:opacity-40 active:scale-95 transition-transform"
          >
            {generate.isPending ? '…' : brief ? '✦ Refresh' : '✦ Generate'}
          </button>
        </div>
        {bd ? (
          <p className="text-sm text-tx leading-relaxed">{bd.morning_brief}</p>
        ) : (
          <p className="text-sm text-ts leading-relaxed">
            {oura?.readiness
              ? `Readiness ${oura.readiness}/100 — tap Generate for your personalised plan.`
              : 'Set up your profile and connect Oura, then generate your daily AI brief.'}
          </p>
        )}
      </div>

      {/* Top priorities */}
      {bd?.top_priorities?.length > 0 && (
        <div className="mb-5">
          <p className="text-[10px] text-tm uppercase tracking-widest font-semibold mb-2">Top priorities</p>
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            {bd.top_priorities.map((p: string, i: number) => (
              <div key={i} className={`flex items-start gap-3 px-4 py-3 ${i < bd.top_priorities.length - 1 ? 'border-b border-border' : ''}`}>
                <span className="text-xs font-bold text-accent-light w-4 text-center mt-0.5">{i + 1}</span>
                <p className="text-sm text-tx flex-1 leading-snug">{p}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Open todos */}
      {open.length > 0 && (
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[10px] text-tm uppercase tracking-widest font-semibold">Open tasks</p>
            <Link href="/todos" className="text-xs text-accent-light">See all →</Link>
          </div>
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            {open.slice(0, 4).map((t, i) => {
              const late = t.due_date && t.due_date < format(new Date(), 'yyyy-MM-dd');
              return (
                <div key={t.id} className={`flex items-center gap-3 px-4 py-3 ${i < Math.min(open.length, 4) - 1 ? 'border-b border-border' : ''}`}>
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${late ? 'bg-danger' : 'bg-todos'}`} />
                  <p className="text-sm text-tx flex-1 truncate">{t.title}</p>
                  {t.due_date && (
                    <p className={`text-xs flex-shrink-0 ${late ? 'text-danger' : 'text-tm'}`}>
                      {t.due_date === format(new Date(), 'yyyy-MM-dd') ? 'Today' : format(new Date(t.due_date + 'T00:00:00'), 'd MMM')}
                    </p>
                  )}
                </div>
              );
            })}
            {open.length > 4 && (
              <Link href="/todos" className="block px-4 py-3 border-t border-border text-xs text-accent-light text-center">
                +{open.length - 4} more tasks →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Schedule */}
      {bd?.suggested_schedule?.length > 0 && (
        <div className="mb-5">
          <p className="text-[10px] text-tm uppercase tracking-widest font-semibold mb-2">Suggested schedule</p>
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            {bd.suggested_schedule.map((s: { time: string; activity: string; duration_min: number; notes?: string }, i: number) => (
              <div key={i} className={`flex gap-3 px-4 py-3 ${i < bd.suggested_schedule.length - 1 ? 'border-b border-border' : ''}`}>
                <div className="w-14 text-right flex-shrink-0">
                  <p className="text-xs font-semibold text-accent-light">{s.time}</p>
                  <p className="text-[10px] text-tm">{s.duration_min}m</p>
                </div>
                <div className="w-px bg-border flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-tx font-medium leading-snug">{s.activity}</p>
                  {s.notes && <p className="text-xs text-ts mt-0.5 leading-snug">{s.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Watch-outs */}
      {bd?.watch_outs?.length > 0 && (
        <div className="mb-5">
          <p className="text-[10px] text-tm uppercase tracking-widest font-semibold mb-2">Watch-outs</p>
          <div className="bg-surface border border-warn/20 rounded-2xl overflow-hidden">
            {bd.watch_outs.map((w: string, i: number) => (
              <div key={i} className={`flex gap-3 px-4 py-3 items-start ${i < bd.watch_outs.length - 1 ? 'border-b border-border' : ''}`}>
                <span className="text-warn text-sm flex-shrink-0">⚠</span>
                <p className="text-sm text-ts leading-snug">{w}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Module snapshot */}
      <p className="text-[10px] text-tm uppercase tracking-widest font-semibold mb-2">Snapshot</p>
      <div className="flex flex-col gap-2">
        <ModuleCard emoji="⚡" label="Readiness" value={oura?.readiness ? `${oura.readiness} / 100` : '— / 100'} sub={!oura ? 'Connect Oura' : undefined} href="/health" color="border-l-health" />
        <ModuleCard emoji="⚖️" label="Weight" value={latestWeight ? `${latestWeight} kg` : '— kg'} sub={!latestWeight ? 'Log weight' : undefined} href="/health" color="border-l-health" />
        <ModuleCard emoji="🍽" label="Meals" value={latestPlan ? latestPlan.title ?? 'Plan active' : 'No plan'} sub={!latestPlan ? 'Import a meal plan' : undefined} href="/meals" color="border-l-meals" />
        <ModuleCard emoji="💰" label="Budget" value={totalExpenses > 0 ? `£${totalExpenses.toFixed(0)} spent` : '£0 logged'} sub={totalIncome > 0 ? `£${totalIncome.toFixed(0)} income` : undefined} href="/budget" color="border-l-budget" />
        <ModuleCard emoji="📚" label="Reading" value={byStatus.reading[0]?.title ?? 'No book'} sub={byStatus.reading[0]?.author} href="/books" color="border-l-books" />
        <ModuleCard emoji="✅" label="Tasks" value={overdue.length > 0 ? `${overdue.length} overdue` : `${open.length} open`} sub={`${open.length} total open`} href="/todos" color={overdue.length > 0 ? 'border-l-danger' : 'border-l-todos'} />
      </div>
    </div>
  );
}
