'use client';
import { useState } from 'react';
import { format } from 'date-fns';
import { Modal } from '@/components/ui/Modal';
import { useBudgetCategories, useTransactions, useBudgetForecast } from '@/hooks/useBudget';

const PRESET_CATEGORIES = [
  { name: 'Rent / Mortgage', type: 'expense', icon: '🏠', monthly_target: 1200 },
  { name: 'Groceries',       type: 'expense', icon: '🛒', monthly_target: 300  },
  { name: 'Transport',       type: 'expense', icon: '🚗', monthly_target: 150  },
  { name: 'Eating out',      type: 'expense', icon: '🍽', monthly_target: 200  },
  { name: 'Entertainment',   type: 'expense', icon: '🎮', monthly_target: 100  },
  { name: 'Subscriptions',   type: 'expense', icon: '📱', monthly_target: 50   },
  { name: 'Health',          type: 'expense', icon: '💪', monthly_target: 50   },
  { name: 'Savings',         type: 'saving',  icon: '💰', monthly_target: 500  },
  { name: 'Salary',          type: 'income',  icon: '💵'  },
  { name: 'Freelance',       type: 'income',  icon: '💻'  },
];

const SEVERITY_COLOR: Record<string, string> = { low: 'text-ok', medium: 'text-warn', high: 'text-danger' };
const SEVERITY_EMOJI: Record<string, string> = { low: '🟢', medium: '🟡', high: '🔴' };

export default function BudgetPage() {
  const { categories, addCategory, deleteCategory } = useBudgetCategories();
  const { transactions, totalIncome, totalExpenses, saved, spendByCategory, addTransaction, deleteTransaction } = useTransactions();
  const { forecast, generate } = useBudgetForecast();

  const [tab, setTab]           = useState<'overview' | 'transactions' | 'forecast'>('overview');
  const [showAddTx, setShowAddTx]   = useState(false);
  const [showAddCat, setShowAddCat] = useState(false);

  // Transaction form
  const [txType, setTxType]     = useState('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txDesc, setTxDesc]     = useState('');
  const [txCatId, setTxCatId]   = useState('');
  const [txDate, setTxDate]     = useState(format(new Date(), 'yyyy-MM-dd'));
  const [txSaving, setTxSaving] = useState(false);

  // Category form
  const [catName, setCatName]   = useState('');
  const [catType, setCatType]   = useState('expense');
  const [catIcon, setCatIcon]   = useState('💸');
  const [catTarget, setCatTarget] = useState('');
  const [catSaving, setCatSaving] = useState(false);

  const filteredCats = categories.filter(c => c.type === txType);
  const expenseCats  = categories.filter(c => c.type === 'expense');
  const existingNames = new Set(categories.map(c => c.name.toLowerCase()));
  const presets = PRESET_CATEGORIES.filter(p => !existingNames.has(p.name.toLowerCase()));

  const handleAddTx = async () => {
    const amt = parseFloat(txAmount);
    if (isNaN(amt) || amt <= 0) return;
    setTxSaving(true);
    try {
      await addTransaction.mutateAsync({ type: txType, amount: amt, description: txDesc || undefined, category_id: txCatId || undefined, date: txDate, recurring: false });
      setTxAmount(''); setTxDesc(''); setTxCatId(''); setTxType('expense');
      setShowAddTx(false);
    } finally { setTxSaving(false); }
  };

  const handleAddCat = async () => {
    if (!catName.trim()) return;
    setCatSaving(true);
    try {
      await addCategory.mutateAsync({ name: catName.trim(), type: catType, icon: catIcon, monthly_target: catTarget ? parseFloat(catTarget) : undefined });
      setCatName(''); setShowAddCat(false);
    } finally { setCatSaving(false); }
  };

  const f = forecast?.forecast_json;

  return (
    <div className="px-4 pt-safe-or-4 pb-4">
      <div className="py-5">
        <h1 className="text-2xl font-bold text-tx tracking-tight">Budget</h1>
        <p className="text-ts text-sm mt-0.5">{format(new Date(), 'MMMM yyyy')}</p>
      </div>

      {/* Summary */}
      <div className="bg-surface border border-border rounded-2xl p-4 mb-4 grid grid-cols-3 divide-x divide-border">
        {[
          { label: 'Income',   value: `£${totalIncome.toFixed(0)}`,   color: 'text-ok'     },
          { label: 'Spent',    value: `£${totalExpenses.toFixed(0)}`,  color: 'text-danger' },
          { label: 'Left',     value: `£${Math.abs(saved).toFixed(0)}`, color: saved >= 0 ? 'text-budget' : 'text-danger' },
        ].map(s => (
          <div key={s.label} className="flex flex-col items-center gap-1">
            <p className="text-[10px] text-tm uppercase tracking-widest">{s.label}</p>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setShowAddTx(true)} className="flex-1 bg-budget text-white font-semibold rounded-xl py-3 text-sm active:scale-95 transition-transform">
          + Add transaction
        </button>
        <button onClick={() => setShowAddCat(true)} className="bg-surface border border-border text-ts rounded-xl py-3 px-4 text-sm active:bg-elevated">
          ⚙ Categories
        </button>
        <button onClick={() => generate.mutateAsync({ transactions, categories })} disabled={generate.isPending} className="bg-surface border border-border text-accent-light rounded-xl py-3 px-3 text-sm active:bg-elevated disabled:opacity-40">
          {generate.isPending ? '…' : '✦'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-elevated rounded-xl p-1 mb-4 gap-1">
        {(['overview', 'transactions', 'forecast'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${tab === t ? 'bg-surface text-tx' : 'text-tm'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div className="flex flex-col gap-3">
          {expenseCats.length === 0 && (
            <div className="bg-surface border border-border rounded-2xl p-5 text-center">
              <p className="text-3xl mb-2">💰</p>
              <p className="text-tx font-semibold mb-1">No categories yet</p>
              <p className="text-ts text-sm">Tap "⚙ Categories" to add some, or use the quick-add presets.</p>
            </div>
          )}
          {expenseCats.map(cat => {
            const spent  = spendByCategory[cat.id] ?? 0;
            const target = cat.monthly_target ?? 0;
            const pct    = target > 0 ? Math.min(spent / target, 1) : 0;
            const over   = target > 0 && spent > target;
            return (
              <div key={cat.id} className="bg-surface border border-border rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cat.icon ?? '💸'}</span>
                    <span className="text-sm font-medium text-tx">{cat.name}</span>
                  </div>
                  <span className={`text-sm font-semibold ${over ? 'text-danger' : 'text-ts'}`}>
                    £{spent.toFixed(0)}{target > 0 ? ` / £${target.toFixed(0)}` : ''}
                  </span>
                </div>
                {target > 0 && (
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${over ? 'bg-danger' : 'bg-budget'}`}
                      style={{ width: `${pct * 100}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Transactions tab */}
      {tab === 'transactions' && (
        <div className="flex flex-col gap-2">
          {transactions.length === 0 && (
            <div className="bg-surface border border-border rounded-2xl p-5 text-center">
              <p className="text-ts text-sm">No transactions this month. Tap &quot;+ Add transaction&quot; to log one.</p>
            </div>
          )}
          {transactions.map(tx => (
            <div key={tx.id} className="bg-surface border border-border rounded-xl flex overflow-hidden"
              onDoubleClick={() => { if (confirm(`Delete "${tx.description ?? tx.budget_categories?.name ?? 'transaction'}"?`)) deleteTransaction.mutate(tx.id); }}>
              <div className={`w-1 flex-shrink-0 ${tx.type === 'income' ? 'bg-ok' : 'bg-danger'}`} />
              <div className="flex-1 px-4 py-3">
                <p className="text-sm font-medium text-tx">{tx.description ?? tx.budget_categories?.name ?? '—'}</p>
                <p className="text-xs text-tm mt-0.5">
                  {format(new Date(tx.date), 'EEE d MMM')}
                  {tx.budget_categories ? ` · ${tx.budget_categories.name}` : ''}
                </p>
              </div>
              <p className={`self-center pr-4 text-sm font-semibold ${tx.type === 'income' ? 'text-ok' : 'text-tx'}`}>
                {tx.type === 'income' ? '+' : '-'}£{tx.amount.toFixed(2)}
              </p>
            </div>
          ))}
          {transactions.length > 0 && <p className="text-xs text-tm text-center mt-1">Double-tap a transaction to delete it</p>}
        </div>
      )}

      {/* Forecast tab */}
      {tab === 'forecast' && (
        <div className="flex flex-col gap-4">
          {!f ? (
            <div className="bg-surface border border-border rounded-2xl p-6 text-center flex flex-col items-center gap-3">
              <span className="text-4xl">📊</span>
              <p className="text-tx font-semibold">No forecast yet</p>
              <p className="text-ts text-sm leading-relaxed">Tap the ✦ button to generate a Claude AI forecast of your spending patterns and upcoming risks.</p>
            </div>
          ) : (
            <>
              <div className="bg-surface border border-accent/30 rounded-2xl p-4">
                <p className="text-xs text-accent-light font-semibold mb-2">SUMMARY</p>
                <p className="text-sm text-tx leading-relaxed">{f.summary}</p>
              </div>
              {f.risk_flags?.length > 0 && (
                <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                  <p className="text-[10px] text-tm uppercase tracking-widest font-semibold px-4 pt-4 pb-2">Risk flags</p>
                  {f.risk_flags.map((flag: { severity: string; category: string; message: string }, i: number) => (
                    <div key={i} className={`px-4 py-3 border-l-4 ${i < f.risk_flags.length - 1 ? 'border-b border-border' : ''}`}
                      style={{ borderLeftColor: flag.severity === 'high' ? '#ef4444' : flag.severity === 'medium' ? '#f59e0b' : '#22c55e' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span>{SEVERITY_EMOJI[flag.severity]}</span>
                        <span className="text-sm font-semibold text-tx flex-1">{flag.category}</span>
                        <span className={`text-xs font-bold uppercase ${SEVERITY_COLOR[flag.severity]}`}>{flag.severity}</span>
                      </div>
                      <p className="text-xs text-ts leading-snug">{flag.message}</p>
                    </div>
                  ))}
                </div>
              )}
              {f.recommendations?.length > 0 && (
                <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
                  <p className="text-[10px] text-tm uppercase tracking-widest font-semibold">Recommendations</p>
                  {f.recommendations.map((r: string, i: number) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-accent-light font-bold text-sm flex-shrink-0">→</span>
                      <p className="text-sm text-ts leading-snug">{r}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Add Transaction Modal */}
      <Modal open={showAddTx} onClose={() => setShowAddTx(false)} title="Add transaction">
        <div className="flex bg-elevated rounded-xl p-1 mb-4 gap-1">
          {['expense', 'income'].map(t => (
            <button key={t} onClick={() => { setTxType(t); setTxCatId(''); }} className={`flex-1 py-2.5 rounded-lg text-sm font-medium capitalize transition-colors ${txType === t ? 'bg-surface text-tx' : 'text-tm'}`}>
              {t === 'expense' ? '💸 Expense' : '💵 Income'}
            </button>
          ))}
        </div>
        <label className="text-xs text-ts font-medium block mb-1">Amount (£)</label>
        <input type="number" value={txAmount} onChange={e => setTxAmount(e.target.value)} placeholder="0.00" inputMode="decimal"
          className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-tx text-base outline-none focus:border-accent mb-4" />
        <label className="text-xs text-ts font-medium block mb-1">Description</label>
        <input value={txDesc} onChange={e => setTxDesc(e.target.value)} placeholder="e.g. Tesco shop"
          className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-tx text-base outline-none focus:border-accent mb-4" />
        {filteredCats.length > 0 && (
          <>
            <label className="text-xs text-ts font-medium block mb-2">Category</label>
            <div className="flex gap-2 flex-wrap mb-4">
              {filteredCats.map(c => (
                <button key={c.id} onClick={() => setTxCatId(txCatId === c.id ? '' : c.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border transition-colors ${txCatId === c.id ? 'border-budget bg-budget/20 text-budget' : 'border-border bg-elevated text-ts'}`}>
                  {c.icon} {c.name}
                </button>
              ))}
            </div>
          </>
        )}
        <label className="text-xs text-ts font-medium block mb-1">Date</label>
        <input type="date" value={txDate} onChange={e => setTxDate(e.target.value)}
          className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-tx text-base outline-none focus:border-accent mb-5" />
        <div className="flex gap-3">
          <button onClick={() => setShowAddTx(false)} className="flex-1 bg-elevated border border-border rounded-xl py-3.5 text-ts text-sm">Cancel</button>
          <button onClick={handleAddTx} disabled={!txAmount || txSaving} className="flex-1 bg-budget text-white font-semibold rounded-xl py-3.5 text-sm disabled:opacity-40">
            {txSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </Modal>

      {/* Add Category Modal */}
      <Modal open={showAddCat} onClose={() => setShowAddCat(false)} title="Categories">
        {presets.length > 0 && (
          <>
            <p className="text-xs text-tm uppercase tracking-widest font-semibold mb-2">Quick add</p>
            <div className="flex gap-2 flex-wrap mb-5">
              {presets.map(p => (
                <button key={p.name} onClick={() => addCategory.mutateAsync({ name: p.name, type: p.type, icon: p.icon, monthly_target: p.monthly_target })}
                  className="flex items-center gap-1.5 px-3 py-2 bg-elevated border border-border rounded-xl text-sm text-ts active:bg-surface">
                  {p.icon} {p.name}
                </button>
              ))}
            </div>
          </>
        )}
        <p className="text-xs text-tm uppercase tracking-widest font-semibold mb-2">Custom</p>
        <input value={catName} onChange={e => setCatName(e.target.value)} placeholder="Category name"
          className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-tx text-base outline-none focus:border-accent mb-3" />
        <div className="flex gap-2 mb-3">
          {['expense', 'income', 'saving'].map(t => (
            <button key={t} onClick={() => setCatType(t)} className={`flex-1 py-2 rounded-xl text-xs font-medium border capitalize transition-colors ${catType === t ? 'border-accent bg-accent/20 text-accent-light' : 'border-border bg-elevated text-tm'}`}>
              {t}
            </button>
          ))}
        </div>
        <input value={catTarget} onChange={e => setCatTarget(e.target.value)} placeholder="Monthly target £ (optional)" type="number" inputMode="decimal"
          className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-tx text-base outline-none focus:border-accent mb-5" />
        <div className="flex gap-3">
          <button onClick={() => setShowAddCat(false)} className="flex-1 bg-elevated border border-border rounded-xl py-3.5 text-ts text-sm">Close</button>
          <button onClick={handleAddCat} disabled={!catName.trim() || catSaving} className="flex-1 bg-budget text-white font-semibold rounded-xl py-3.5 text-sm disabled:opacity-40">
            {catSaving ? 'Adding…' : 'Add'}
          </button>
        </div>
        {categories.length > 0 && (
          <div className="mt-5 flex flex-col gap-1">
            <p className="text-xs text-tm uppercase tracking-widest font-semibold mb-1">Existing</p>
            {categories.map(c => (
              <div key={c.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <span>{c.icon ?? '💸'}</span>
                <span className="flex-1 text-sm text-tx">{c.name}</span>
                <span className="text-xs text-tm">{c.type}</span>
                <button onClick={() => deleteCategory.mutate(c.id)} className="text-danger text-sm px-2">✕</button>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
