'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { BottomNav } from '@/components/nav/BottomNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) router.replace('/login');
  }, [session, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <span className="text-4xl animate-pulse">◉</span>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-bg">
      <main className="mb-nav">{children}</main>
      <BottomNav />
    </div>
  );
}
