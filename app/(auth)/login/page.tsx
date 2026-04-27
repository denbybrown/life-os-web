'use client';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const { signInWithEmail } = useAuth();
  const [email, setEmail]   = useState('');
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true); setError('');
    try {
      await signInWithEmail(email.trim());
      setSent(true);
    } catch (err: unknown) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 pt-safe">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">◉</div>
          <h1 className="text-3xl font-bold text-tx tracking-tight">Life OS</h1>
          <p className="text-ts mt-2 text-sm">Your personal operating system</p>
        </div>

        {sent ? (
          <div className="bg-surface border border-border rounded-2xl p-6 text-center">
            <div className="text-4xl mb-3">📬</div>
            <h2 className="text-tx font-semibold text-lg mb-2">Check your email</h2>
            <p className="text-ts text-sm leading-relaxed">
              We sent a magic link to <span className="text-accent-light">{email}</span>.
              Tap it to sign in — no password needed.
            </p>
            <button
              onClick={() => { setSent(false); setEmail(''); }}
              className="mt-5 text-sm text-tm underline"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-tm uppercase tracking-widest block mb-2">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full bg-surface border border-border rounded-xl px-4 py-3.5 text-tx text-base outline-none focus:border-accent transition-colors"
              />
            </div>

            {error && (
              <p className="text-danger text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full bg-accent text-white font-semibold rounded-xl py-3.5 text-base disabled:opacity-40 active:scale-95 transition-transform"
            >
              {loading ? 'Sending…' : 'Send magic link'}
            </button>

            <p className="text-tm text-xs text-center leading-relaxed">
              A sign-in link will be emailed to you. No password required.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
