'use client';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useMealPlan, usePantry, useShoppingList } from '@/hooks/useMeals';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const MEALS = ['breakfast','lunch','dinner'] as const;

export default function MealsPage() {
  const { latestPlan, importPlan } = useMealPlan();
  const { items: pantry, addItem, deleteItem } = usePantry();
  const { latest: shoppingList, generate: genList, toggleItem } = useShoppingList();
  const { latestPlan: mealPlan } = useMealPlan();

  const [tab, setTab]               = useState<'plan'|'shopping'|'pantry'>('plan');
  const [showImport, setShowImport] = useState(false);
  const [showAddPantry, setShowAddPantry] = useState(false);
  const [rawText, setRawText]       = useState('');
  const [importing, setImporting]   = useState(false);

  const [pantryName, setPantryName] = useState('');
  const [pantryQty, setPantryQty]   = useState('1');
  const [pantryUnit, setPantryUnit] = useState('units');
  const [pantryCat, setPantryCat]   = useState('Other');
  const [pantrySaving, setPantrySaving] = useState(false);

  const plan = latestPlan?.plan_json as Record<string, Record<string, { name: string }>> | null;

  const handleImport = async () => {
    if (!rawText.trim()) return;
    setImporting(true);
    try { await importPlan.mutateAsync(rawText); setRawText(''); setShowImport(false); }
    catch (e: unknown) { alert(String(e)); }
    finally { setImporting(false); }
  };

  const handleAddPantry = async () => {
    if (!pantryName.trim()) return;
    setPantrySaving(true);
    try {
      await addItem.mutateAsync({ name: pantryName.trim(), quantity: parseFloat(pantryQty) || 1, unit: pantryUnit, category: pantryCat });
      setPantryName(''); setPantryQty('1'); setShowAddPantry(false);
    } finally { setPantrySaving(false); }
  };

  const handleToggleItem = async (idx: number) => {
    if (!shoppingList) return;
    const updated = shoppingList.items.map((it: Record<string, unknown>, i: number) =>
      i === idx ? { ...it, checked: !it.checked } : it
    );
    await toggleItem.mutateAsync({ listId: shoppingList.id, items: updated });
  };

  return (
    <div className="px-4 pt-safe-or-4 pb-4">
      <div className="py-5 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-tx tracking-tight">Meals</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(true)} className="bg-meals text-bg font-semibold rounded-full px-3 py-1.5 text-sm active:scale-95 transition-transform">
            + Import
          </button>
        </div>
      </div>

      <div className="flex bg-elevated rounded-xl p-1 mb-4 gap-1">
        {(['plan','shopping','pantry'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${tab === t ? 'bg-surface text-tx' : 'text-tm'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Meal plan tab */}
      {tab === 'plan' && (
        <div className="flex flex-col gap-3">
          {!plan ? (
            <div className="bg-surface border border-border rounded-2xl p-6 text-center">
              <p className="text-3xl mb-2">🍽</p>
              <p className="text-tx font-semibold mb-1">No meal plan yet</p>
              <p className="text-ts text-sm mb-4">Paste your meal plan text and Claude will parse it into a structured weekly plan.</p>
              <button onClick={() => setShowImport(true)} className="bg-meals text-bg font-semibold rounded-xl px-5 py-2.5 text-sm">Import meal plan</button>
            </div>
          ) : (
            DAYS.map(day => {
              const dayData = plan[day];
              if (!dayData) return null;
              return (
                <div key={day} className="bg-surface border border-border rounded-xl overflow-hidden">
                  <p className="px-4 py-2 text-xs font-bold text-tm uppercase tracking-widest border-b border-border capitalize">{day}</p>
                  {MEALS.filter(m => dayData[m]).map((m, i) => (
                    <div key={m} className={`px-4 py-3 flex gap-3 ${i < MEALS.length - 1 && dayData[MEALS[i+1]] ? 'border-b border-border' : ''}`}>
                      <p className="text-xs text-tm w-16 flex-shrink-0 capitalize pt-0.5">{m}</p>
                      <p className="text-sm text-tx flex-1">{dayData[m]?.name ?? '—'}</p>
                    </div>
                  ))}
                </div>
              );
            })
          )}
          {plan && (
            <button onClick={() => genList.mutateAsync({ meal_plan: latestPlan?.plan_json, pantry })} disabled={genList.isPending}
              className="bg-surface border border-meals/40 text-meals rounded-xl py-3 text-sm font-medium disabled:opacity-40">
              {genList.isPending ? 'Generating list…' : '✦ Generate shopping list'}
            </button>
          )}
        </div>
      )}

      {/* Shopping list tab */}
      {tab === 'shopping' && (
        <div className="flex flex-col gap-3">
          {!shoppingList ? (
            <div className="bg-surface border border-border rounded-2xl p-5 text-center">
              <p className="text-ts text-sm">No shopping list yet. Import a meal plan then generate one.</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <p className="text-xs text-tm">
                  {shoppingList.items.filter((i: { checked: boolean }) => i.checked).length} / {shoppingList.items.length} checked
                </p>
                <div className="h-1.5 bg-border rounded-full flex-1 mx-3 overflow-hidden">
                  <div className="h-full bg-meals rounded-full transition-all"
                    style={{ width: `${(shoppingList.items.filter((i: { checked: boolean }) => i.checked).length / shoppingList.items.length) * 100}%` }} />
                </div>
              </div>
              <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                {shoppingList.items.map((item: { name: string; quantity: number; unit: string; checked: boolean }, i: number) => (
                  <button key={i} onClick={() => handleToggleItem(i)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left ${i < shoppingList.items.length - 1 ? 'border-b border-border' : ''} active:bg-elevated transition-colors`}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${item.checked ? 'border-ok bg-ok' : 'border-border'}`}>
                      {item.checked && <span className="text-bg text-xs font-bold">✓</span>}
                    </div>
                    <p className={`flex-1 text-sm ${item.checked ? 'line-through text-tm' : 'text-tx'}`}>{item.name}</p>
                    <p className="text-xs text-tm flex-shrink-0">{item.quantity} {item.unit}</p>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Pantry tab */}
      {tab === 'pantry' && (
        <div className="flex flex-col gap-3">
          <button onClick={() => setShowAddPantry(true)} className="bg-surface border border-border rounded-xl py-3 text-sm text-meals font-medium">
            + Add pantry item
          </button>
          {pantry.length === 0 ? (
            <div className="bg-surface border border-border rounded-2xl p-5 text-center">
              <p className="text-ts text-sm">Your pantry is empty. Add items you already have at home.</p>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-2xl overflow-hidden">
              {pantry.map((item, i) => (
                <div key={item.id} className={`flex items-center gap-3 px-4 py-3 ${i < pantry.length - 1 ? 'border-b border-border' : ''}`}>
                  <div className="flex-1">
                    <p className="text-sm text-tx font-medium">{item.name}</p>
                    <p className="text-xs text-tm">{item.quantity} {item.unit} · {item.category}</p>
                  </div>
                  <button onClick={() => deleteItem.mutate(item.id)} className="text-danger text-sm px-2">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Import modal */}
      <Modal open={showImport} onClose={() => setShowImport(false)} title="Import meal plan">
        <p className="text-xs text-ts mb-3 leading-relaxed">Paste your meal plan in any format — Claude will parse it into a structured weekly plan.</p>
        <textarea value={rawText} onChange={e => setRawText(e.target.value)} placeholder="Monday: Porridge for breakfast, Chicken salad for lunch..."
          className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-tx text-sm outline-none focus:border-meals mb-5 h-40 resize-none" />
        <div className="flex gap-3">
          <button onClick={() => setShowImport(false)} className="flex-1 bg-elevated border border-border rounded-xl py-3.5 text-ts text-sm">Cancel</button>
          <button onClick={handleImport} disabled={!rawText.trim() || importing} className="flex-1 bg-meals text-bg font-semibold rounded-xl py-3.5 text-sm disabled:opacity-40">
            {importing ? 'Parsing…' : '✦ Import'}
          </button>
        </div>
      </Modal>

      {/* Add pantry modal */}
      <Modal open={showAddPantry} onClose={() => setShowAddPantry(false)} title="Add to pantry">
        <input value={pantryName} onChange={e => setPantryName(e.target.value)} placeholder="Item name" autoFocus
          className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-tx text-base outline-none focus:border-meals mb-3" />
        <div className="flex gap-3 mb-3">
          <input value={pantryQty} onChange={e => setPantryQty(e.target.value)} type="number" inputMode="decimal" placeholder="Qty"
            className="w-24 bg-elevated border border-border rounded-xl px-4 py-3 text-tx text-base outline-none focus:border-meals" />
          <input value={pantryUnit} onChange={e => setPantryUnit(e.target.value)} placeholder="Unit (g, ml, units…)"
            className="flex-1 bg-elevated border border-border rounded-xl px-4 py-3 text-tx text-base outline-none focus:border-meals" />
        </div>
        <input value={pantryCat} onChange={e => setPantryCat(e.target.value)} placeholder="Category"
          className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-tx text-base outline-none focus:border-meals mb-5" />
        <div className="flex gap-3">
          <button onClick={() => setShowAddPantry(false)} className="flex-1 bg-elevated border border-border rounded-xl py-3.5 text-ts text-sm">Cancel</button>
          <button onClick={handleAddPantry} disabled={!pantryName.trim() || pantrySaving} className="flex-1 bg-meals text-bg font-semibold rounded-xl py-3.5 text-sm disabled:opacity-40">
            {pantrySaving ? 'Adding…' : 'Add'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
