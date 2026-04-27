'use client';
import { useState } from 'react';
import { format } from 'date-fns';
import { Modal } from '@/components/ui/Modal';
import { useWeightLog, useOuraToday, useWorkoutPlan } from '@/hooks/useHealth';

function scoreColor(v?: number | null) {
  if (!v) return '#606060';
  if (v >= 85) return '#22c55e';
  if (v >= 70) return '#84cc16';
  if (v >= 60) return '#f59e0b';
  return '#ef4444';
}

export default function HealthPage() {
  const { logs, latestWeight, chartData, addWeight } = useWeightLog();
  const { data: oura } = useOuraToday();
  const { plan } = useWorkoutPlan();

  const [showAddWeight, setShowAddWeight] = useState(false);
  const [weightInput, setWeightInput]     = useState('');
  const [saving, setSaving]               = useState(false);

  const todayDay = format(new Date(), 'EEEE');
  const todayWorkout = plan?.plan_json?.weeks?.[0]?.days?.find(
    (d: { day: string }) => d.day.toLowerCase() === todayDay.toLowerCase()
  );

  const handleAddWeight = async () => {
    const kg = parseFloat(weightInput);
    if (isNaN(kg) || kg <= 0) return;
    setSaving(true);
    try { await addWeight.mutateAsync(kg); setWeightInput(''); setShowAddWeight(false); }
    finally { setSaving(false); }
  };

  // Simple sparkline — last 14 weights
  const spark = chartData.slice(-14);
  const min = Math.min(...spark.map(d => d.weight));
  const max = Math.max(...spark.map(d => d.weight));
  const range = max - min || 1;

  return (
    <div className="px-4 pt-safe-or-4 pb-4">
      <div className="py-5 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-tx tracking-tight">Health</h1>
        <button onClick={() => setShowAddWeight(true)} className="bg-health text-bg font-semibold rounded-full px-4 py-1.5 text-sm active:scale-95 transition-transform">
          + Weight
        </button>
      </div>

      {/* Oura scores */}
      {oura ? (
        <div className="bg-surface border border-border rounded-2xl p-4 mb-4">
          <p className="text-[10px] text-tm uppercase tracking-widest font-semibold mb-3">Today · Oura</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Readiness', value: oura.readiness },
              { label: 'Sleep',     value: oura.sleep_score },
              { label: 'Activity',  value: oura.activity_score },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center gap-1">
                <p className="text-2xl font-bold" style={{ color: scoreColor(s.value) }}>
                  {s.value ?? '—'}
                </p>
                <p className="text-[10px] text-tm uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
          {oura.hrv_avg && (
            <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
              <p className="text-xs text-ts">HRV avg</p>
              <p className="text-sm font-semibold text-tx">{oura.hrv_avg.toFixed(0)} ms</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl p-4 mb-4 text-center">
          <p className="text-2xl mb-1">💍</p>
          <p className="text-sm font-medium text-tx mb-0.5">Oura not connected</p>
          <p className="text-xs text-ts">Connect your Oura Ring for real sleep & readiness data.</p>
        </div>
      )}

      {/* Weight */}
      <div className="bg-surface border border-border rounded-2xl p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <p className="text-[10px] text-tm uppercase tracking-widest font-semibold">Weight</p>
          {latestWeight && <p className="text-health font-bold text-lg">{latestWeight} kg</p>}
        </div>
        {spark.length > 1 ? (
          <svg viewBox={`0 0 ${spark.length - 1} 40`} className="w-full h-10" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke="#22c55e"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={spark.map((d, i) => `${i},${40 - ((d.weight - min) / range) * 36}`).join(' ')}
            />
          </svg>
        ) : (
          <p className="text-xs text-tm">Log a few weights to see your trend.</p>
        )}
        {logs.slice(0, 5).map(l => (
          <div key={l.id} className="flex justify-between items-center py-2 border-t border-border first:border-t-0 mt-2 first:mt-0">
            <p className="text-xs text-ts">{format(new Date(l.logged_at), 'EEE d MMM')}</p>
            <p className="text-sm font-medium text-tx">{l.weight_kg} kg</p>
          </div>
        ))}
        {logs.length === 0 && <p className="text-xs text-tm mt-1">No weight entries yet.</p>}
      </div>

      {/* Today's workout */}
      {plan && (
        <div className="bg-surface border border-border rounded-2xl p-4 mb-4">
          <p className="text-[10px] text-tm uppercase tracking-widest font-semibold mb-3">
            {todayWorkout ? `Today · ${todayWorkout.focus}` : "Today's Workout"}
          </p>
          {todayWorkout ? (
            <div className="flex flex-col gap-3">
              {todayWorkout.exercises?.map((ex: { name: string; sets: number; reps: string; rest_seconds?: number }, i: number) => (
                <div key={i} className="flex justify-between items-start">
                  <p className="text-sm text-tx font-medium flex-1">{ex.name}</p>
                  <p className="text-xs text-ts ml-2 flex-shrink-0">{ex.sets}×{ex.reps}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ts">Rest day — no workout scheduled today.</p>
          )}
        </div>
      )}

      {/* Add weight modal */}
      <Modal open={showAddWeight} onClose={() => setShowAddWeight(false)} title="Log weight">
        <label className="text-xs text-ts font-medium block mb-1">Weight (kg)</label>
        <input
          type="number" inputMode="decimal" value={weightInput}
          onChange={e => setWeightInput(e.target.value)} placeholder="e.g. 75.2" autoFocus
          className="w-full bg-elevated border border-border rounded-xl px-4 py-3.5 text-tx text-xl font-bold outline-none focus:border-health mb-5"
        />
        <div className="flex gap-3">
          <button onClick={() => setShowAddWeight(false)} className="flex-1 bg-elevated border border-border rounded-xl py-3.5 text-ts text-sm">Cancel</button>
          <button onClick={handleAddWeight} disabled={!weightInput || saving} className="flex-1 bg-health text-bg font-semibold rounded-xl py-3.5 text-sm disabled:opacity-40">
            {saving ? 'Saving…' : 'Log it'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
