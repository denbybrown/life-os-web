'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        router.replace(error ? '/login' : '/dashboard');
      });
    } else {
      // Fallback: check if session already exists (hash-based flow)
      supabase.auth.getSession().then(({ data: { session } }) => {
        router.replace(session ? '/dashboard' : '/login');
      });
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <span className="text-4xl animate-pulse">◉</span>
    </div>
  );
}
