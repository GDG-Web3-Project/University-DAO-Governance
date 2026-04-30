"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDAO } from '@/contexts/DAOContext';

export default function LoginPage() {
  const router = useRouter();
  const { isConnected, login } = useDAO();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isConnected) {
    router.push('/dashboard');
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError((err as Error).message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pt-24 pb-12">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold">University DAO Login</h1>
            <p className="mt-3 text-slate-400">Sign in to access class votes, petitions, and campus governance.</p>
          </div>

          <div className="glass rounded-3xl p-8 shadow-2xl border border-slate-800">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-200">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-200">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {error && (
                <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-white font-semibold hover:from-emerald-400 hover:to-teal-400 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div className="mt-6 text-center text-slate-400 text-sm">
              New to the University DAO?{' '}
              <Link href="/register" className="text-emerald-300 hover:text-emerald-200">
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
