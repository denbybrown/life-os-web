'use client';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

const MENU = [
  {
    label: 'KNOWLEDGE',
    items: [
      { emoji: '📚', title: 'Books & Reading', sub: 'Track reading, get AI recommendations', href: '/books' },
      { emoji: '🎓', title: 'Learning', sub: 'Topics, skills & resources', href: '/books' },
    ],
  },
  {
    label: 'PRODUCTIVITY',
    items: [
      { emoji: '✅', title: 'To-Do', sub: 'Tasks and daily priorities', href: '/todos' },
    ],
  },
  {
    label: 'HEALTH',
    items: [
      { emoji: '⚖️', title: 'Weight log', sub: 'Track your weight over time', href: '/health' },
      { emoji: '💍', title: 'Oura Ring', sub: 'Sleep, HRV & readiness data', href: '/health' },
      { emoji: '🏋️', title: 'Workout plan', sub: 'AI-generated training plan', href: '/health' },
    ],
  },
];

async function handleExport() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const tables = ['weight_logs','budget_categories','transactions','books','todos','meal_plans','pantry_items','learning_topics','daily_briefs'];
  const result: Record<string, unknown> = { exported_at: new Date().toISOString() };

  for (const t of tables) {
    const { data } = await supabase.from(t).select('*');
    result[t] = data;
  }

  const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `life-os-export-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function MorePage() {
  const { session, signOut } = useAuth();

  return (
    <div className="px-4 pt-safe-or-4 pb-4">
      <h1 className="text-2xl font-bold text-tx tracking-tight py-5">More</h1>

      {session && (
        <div className="flex items-center gap-3 bg-surface border border-border rounded-2xl px-4 py-3 mb-5">
          <span className="text-accent text-lg">◉</span>
          <p className="text-ts text-sm truncate flex-1">{session.user.email}</p>
        </div>
      )}

      {MENU.map(section => (
        <div key={section.label} className="mb-5">
          <p className="text-[10px] text-tm uppercase tracking-widest font-semibold mb-2">{section.label}</p>
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            {section.items.map((item, i) => (
              <Link key={item.title} href={item.href}
                className={`flex items-center gap-4 px-4 py-4 active:bg-elevated transition-colors ${i < section.items.length - 1 ? 'border-b border-border' : ''}`}>
                <div className="w-10 h-10 bg-elevated rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                  {item.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-tx">{item.title}</p>
                  <p className="text-xs text-tm mt-0.5 truncate">{item.sub}</p>
                </div>
                <span className="text-xl text-tm">›</span>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* Data */}
      <p className="text-[10px] text-tm uppercase tracking-widest font-semibold mb-2">DATA</p>
      <div className="bg-surface border border-border rounded-2xl overflow-hidden mb-5">
        <button onClick={handleExport} className="w-full flex items-center gap-4 px-4 py-4 active:bg-elevated transition-colors border-b border-border">
          <div className="w-10 h-10 bg-elevated rounded-xl flex items-center justify-center text-xl">📤</div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-tx">Export data</p>
            <p className="text-xs text-tm mt-0.5">Download all your data as JSON</p>
          </div>
          <span className="text-xl text-tm">↗</span>
        </button>
      </div>

      <button onClick={signOut} className="w-full border border-danger/30 rounded-2xl py-4 text-danger text-sm font-medium active:bg-danger/10 transition-colors">
        Sign out
      </button>
    </div>
  );
}
