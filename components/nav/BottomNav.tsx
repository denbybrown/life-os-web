'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/dashboard', emoji: '◉', label: 'Today' },
  { href: '/health',    emoji: '💚', label: 'Health' },
  { href: '/meals',     emoji: '🍽', label: 'Meals'  },
  { href: '/budget',    emoji: '💰', label: 'Budget' },
  { href: '/more',      emoji: '⋯',  label: 'More'   },
];

export function BottomNav() {
  const path = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border pb-safe z-50">
      <div className="flex">
        {TABS.map((tab) => {
          const active = path === tab.href || path.startsWith(tab.href + '/');
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center gap-1 py-2 active:bg-elevated transition-colors"
            >
              <span className={`text-2xl transition-opacity ${active ? 'opacity-100' : 'opacity-35'}`}>
                {tab.emoji}
              </span>
              <span className={`text-[10px] font-medium transition-colors ${active ? 'text-tx' : 'text-tm'}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
