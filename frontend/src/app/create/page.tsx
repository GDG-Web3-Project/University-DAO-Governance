"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDAO } from '@/contexts/DAOContext';
import Navbar from '@/components/Navbar';

export default function CreateProposalPage() {
  const { isConnected, user, createClassElection, createProposal } = useDAO();
  const router = useRouter();
  const [form, setForm] = useState({ type: 'class', title: '', description: '', durationDays: '7', invitedWallets: '', target: '', amount: '0' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
      return;
    }
  }, [isConnected, router]);

  if (!isConnected) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (form.type === 'public') {
        await createProposal({ target: form.target || user?.walletAddress || '0x0000000000000000000000000000000000000000', amount: form.amount || '0', description: `${form.title}: ${form.description}` });
      } else {
        await createClassElection({ title: form.title, description: form.description, endAt: Date.now() + Number(form.durationDays) * 24 * 60 * 60 * 1000, invitedWallets: form.invitedWallets.split(',').map((item) => item.trim()).filter(Boolean) });
      }
      router.push('/proposals');
    } catch (error) {
      setError('Failed to create proposal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />

      <div className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <Link
              href="/proposals"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors mb-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Campus Petitions
            </Link>

            <h1 className="text-4xl font-bold text-slate-100 mb-4">Create University Proposal</h1>
          </div>

          {/* Form */}
          <div className="glass rounded-2xl p-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <form onSubmit={handleSubmit} className="space-y-8">
              <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-slate-100">
                <option value="class">Private class election</option>
                <option value="public">Public student union proposal</option>
              </select>
              <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-slate-100" placeholder="Title" />
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={6} className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-slate-100" placeholder="Description" />
              <input type="number" min={1} max={30} value={form.durationDays} onChange={(e) => setForm((p) => ({ ...p, durationDays: e.target.value }))} className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-slate-100" />
              {form.type === 'class' ? (
                <textarea value={form.invitedWallets} onChange={(e) => setForm((p) => ({ ...p, invitedWallets: e.target.value }))} rows={4} className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-slate-100" placeholder="Invited wallets comma-separated" />
              ) : (
                <>
                  <input value={form.target} onChange={(e) => setForm((p) => ({ ...p, target: e.target.value }))} className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-slate-100" placeholder="Execution target address" />
                  <input value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-slate-100" placeholder="ETH amount" />
                </>
              )}

              {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4"><p className="text-red-400">{error}</p></div>}

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:transform-none shadow-lg"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Creating Petition...
                    </div>
                  ) : (
                    '📝 Submit Petition'
                  )}
                </button>

                <Link
                  href="/proposals"
                  className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-all duration-200 text-center"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>

          {/* Help Section */}
          <div className="mt-8 glass rounded-2xl p-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Need Help?</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-slate-100 mb-2">Writing Effective Petitions</h4>
                <ul className="text-slate-400 text-sm space-y-1">
                  <li>• Be specific about objectives and outcomes</li>
                  <li>• Include implementation timeline</li>
                  <li>• Provide budget breakdown if applicable</li>
                  <li>• Consider potential risks and mitigation</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-100 mb-2">Getting Support</h4>
                <ul className="text-slate-400 text-sm space-y-1">
                  <li>• Discuss ideas in community forums</li>
                  <li>• Get feedback before submitting</li>
                  <li>• Join petition working groups</li>
                  <li>• Contact governance facilitators</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}