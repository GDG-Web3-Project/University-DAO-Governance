"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useDAO } from '@/contexts/DAOContext';
import Navbar from '@/components/Navbar';

export default function ProposalDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { isConnected, loadProposal, castVote, voteClassElection } = useDAO();
  const router = useRouter();
  const [proposal, setProposal] = useState<any>(null);

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
      return;
    }
    loadProposal(id).then(setProposal);
  }, [isConnected, router, loadProposal, id]);

  if (!isConnected || !proposal) return null;

  const totalVotes = proposal.forVotes + proposal.againstVotes;
  const handleVote = async (choice: 'for' | 'against') => {
    if (proposal.scope === 'class') await voteClassElection(proposal.id, choice);
    else await castVote(proposal.id, choice);
    const refreshed = await loadProposal(id);
    setProposal(refreshed);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />

      <div className="pt-20 max-w-4xl mx-auto px-4 pb-12">
        <Link href="/proposals" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors">Back to proposals</Link>
        <div className="glass rounded-2xl p-8 mt-4">
          <p className="text-xs text-slate-400 mb-2">{proposal.scope === 'class' ? 'Private class election' : 'Public student-union proposal'}</p>
          <h1 className="text-3xl font-bold text-slate-100 mb-4">{proposal.title}</h1>
          <p className="text-slate-300">{proposal.description}</p>
          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <div className="p-4 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">For votes: {proposal.forVotes}</div>
            <div className="p-4 rounded bg-red-500/10 border border-red-500/20 text-red-300">Against votes: {proposal.againstVotes}</div>
          </div>
          <p className="text-slate-400 text-sm mt-3">Total votes: {totalVotes}</p>
          {proposal.state === 'Active' && (
            <div className="flex gap-3 mt-6">
              <button onClick={() => handleVote('for')} className="px-5 py-2 bg-emerald-600 rounded text-white">Vote For</button>
              <button onClick={() => handleVote('against')} className="px-5 py-2 bg-red-600 rounded text-white">Vote Against</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}