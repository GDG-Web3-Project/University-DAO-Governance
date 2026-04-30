"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDAO } from '@/contexts/DAOContext';

export default function RegisterPage() {
  const router = useRouter();
  const { isConnected, register } = useDAO();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
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
      await register(name, email, password, inviteCode.trim());
      router.push('/dashboard');
    } catch (err) {
      setError((err as Error).message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pt-24 pb-12">
        <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold">Join the University DAO</h1>
            <p className="mt-3 text-slate-400">Register with your university community and unlock class voting rights.</p>
          </div>

          <div className="glass rounded-3xl p-8 shadow-2xl border border-slate-800">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-200">Full name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

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

              <div>
                <label htmlFor="inviteCode" className="block text-sm font-medium text-slate-200">Invite code (optional)</label>
                <input
                  id="inviteCode"
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Enter your student union invite code"
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
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <div className="mt-6 text-center text-slate-400 text-sm">
              Already a member?{' '}
              <Link href="/login" className="text-emerald-300 hover:text-emerald-200">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
