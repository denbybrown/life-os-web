'use client';
import { useState } from 'react';
import { format } from 'date-fns';
import { Modal } from '@/components/ui/Modal';
import { useTodos } from '@/hooks/useTodos';

const TODAY = format(new Date(), 'yyyy-MM-dd');
const P_COLOR: Record<number, string> = { 1: 'bg-danger', 2: 'bg-warn', 3: 'bg-tm' };

export default function TodosPage() {
  const { open, done, overdue, isLoading, addTodo, completeTodo, uncompleteTodo, deleteTodo } = useTodos();
  const [showAdd, setShowAdd]   = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [title, setTitle]       = useState('');
  const [notes, setNotes]       = useState('');
  const [due, setDue]           = useState(TODAY);
  const [priority, setPriority] = useState(2);
  const [saving, setSaving]     = useState(false);

  const handleAdd = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try { await addTodo.mutateAsync({ title: title.trim(), notes: notes || undefined, due_date: due || undefined, priority }); setTitle(''); setNotes(''); setDue(TODAY); setShowAdd(false); }
    finally { setSaving(false); }
  };

  const renderTodo = (todo: ReturnType<typeof useTodos>['open'][0]) => {
    const late = !todo.completed && todo.due_date && todo.due_date < TODAY;
    return (
      <button
        key={todo.id}
        onClick={() => todo.completed ? uncompleteTodo.mutate(todo.id) : completeTodo.mutate(todo.id)}
        onDoubleClick={() => { if (confirm(`Delete "${todo.title}"?`)) deleteTodo.mutate(todo.id); }}
        className="w-full flex items-start gap-3 px-4 py-3.5 text-left active:bg-elevated transition-colors"
      >
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${todo.completed ? 'border-ok bg-ok' : 'border-border'}`}>
          {todo.completed && <span className="text-bg text-xs font-bold">✓</span>}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${todo.completed ? 'line-through text-tm' : 'text-tx font-medium'}`}>{todo.title}</p>
          {todo.due_date && (
            <p className={`text-xs mt-0.5 ${late ? 'text-danger font-medium' : 'text-tm'}`}>
              {late ? '⚠ ' : ''}{todo.due_date === TODAY ? 'Today' : format(new Date(todo.due_date + 'T00:00:00'), 'EEE d MMM')}
            </p>
          )}
          {todo.notes && <p className="text-xs text-tm mt-0.5 truncate">{todo.notes}</p>}
        </div>
        <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${P_COLOR[todo.priority as 1|2|3] ?? 'bg-tm'}`} />
      </button>
    );
  };

  const openNonOverdue = open.filter(t => !overdue.find(o => o.id === t.id));

  return (
    <div className="px-4 pt-safe-or-4 pb-4">
      <div className="py-5 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-tx tracking-tight">To-Do</h1>
        <button onClick={() => setShowAdd(true)} className="bg-todos text-bg font-semibold rounded-full px-4 py-1.5 text-sm active:scale-95 transition-transform">
          + Task
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { label: 'Overdue', value: overdue.length, color: 'text-danger' },
          { label: 'Open',    value: open.length,    color: 'text-todos'  },
          { label: 'Done',    value: done.length,    color: 'text-ok'     },
        ].map(s => (
          <div key={s.label} className="bg-surface border border-border rounded-xl p-3 text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-tm uppercase tracking-widest mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {isLoading && <p className="text-tm text-sm text-center py-8">Loading…</p>}

      {!isLoading && open.length === 0 && (
        <div className="bg-surface border border-border rounded-2xl p-6 text-center">
          <p className="text-3xl mb-2">✅</p>
          <p className="text-tx font-semibold">All clear!</p>
          <p className="text-ts text-sm mt-1">No open tasks. Enjoy the moment.</p>
        </div>
      )}

      {overdue.length > 0 && (
        <>
          <p className="text-[10px] text-danger uppercase tracking-widest font-semibold mb-2">Overdue ({overdue.length})</p>
          <div className="bg-surface border border-danger/30 rounded-2xl overflow-hidden mb-4 divide-y divide-border">
            {overdue.map(renderTodo)}
          </div>
        </>
      )}

      {openNonOverdue.length > 0 && (
        <>
          <p className="text-[10px] text-tm uppercase tracking-widest font-semibold mb-2">Open ({openNonOverdue.length})</p>
          <div className="bg-surface border border-border rounded-2xl overflow-hidden mb-4 divide-y divide-border">
            {openNonOverdue.map(renderTodo)}
          </div>
        </>
      )}

      {done.length > 0 && (
        <>
          <button onClick={() => setShowDone(v => !v)} className="text-sm text-tm font-medium mb-2 flex items-center gap-1">
            {showDone ? '∨' : '›'} Completed ({done.length})
          </button>
          {showDone && (
            <div className="bg-surface border border-border rounded-2xl overflow-hidden mb-4 divide-y divide-border opacity-60">
              {done.slice(0, 20).map(renderTodo)}
            </div>
          )}
        </>
      )}

      <p className="text-xs text-tm text-center mt-2">Tap to complete · Double-tap to delete</p>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New task">
        <label className="text-xs text-ts font-medium block mb-1">Task *</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs doing?" autoFocus
          className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-tx text-base outline-none focus:border-todos mb-3" />
        <label className="text-xs text-ts font-medium block mb-1">Notes</label>
        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Extra details (optional)"
          className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-tx text-base outline-none focus:border-todos mb-3" />
        <label className="text-xs text-ts font-medium block mb-1">Due date</label>
        <input type="date" value={due} onChange={e => setDue(e.target.value)}
          className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-tx text-base outline-none focus:border-todos mb-3" />
        <label className="text-xs text-ts font-medium block mb-2">Priority</label>
        <div className="flex gap-2 mb-5">
          {[{p:1,l:'🔴 High'},{p:2,l:'🟡 Medium'},{p:3,l:'⚪ Low'}].map(({p,l}) => (
            <button key={p} onClick={() => setPriority(p)} className={`flex-1 py-2.5 rounded-xl text-xs font-medium border transition-colors ${priority === p ? 'border-accent bg-accent/20 text-accent-light' : 'border-border bg-elevated text-tm'}`}>{l}</button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowAdd(false)} className="flex-1 bg-elevated border border-border rounded-xl py-3.5 text-ts text-sm">Cancel</button>
          <button onClick={handleAdd} disabled={!title.trim() || saving} className="flex-1 bg-todos text-bg font-semibold rounded-xl py-3.5 text-sm disabled:opacity-40">
            {saving ? 'Adding…' : 'Add task'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
