import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Proposal from '@/lib/models/Proposal';
import Vote from '@/lib/models/Vote';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const user = await getAuthUser(req);

    const proposal = await Proposal.findById(id)
      .populate('authorId', 'name email')
      .populate('classId', 'name slug');

    if (!proposal) {
      return NextResponse.json({ message: 'Proposal not found' }, { status: 404 });
    }

    if (proposal.scope === 'class' && (!user || user.classId?._id.toString() !== proposal.classId?._id.toString())) {
      return NextResponse.json({ message: 'You are not authorized to view this class proposal' }, { status: 403 });
    }

    const voteRecords = await Vote.find({ proposalId: proposal._id }).populate('userId', 'name email');
    const hasVoted = user ? voteRecords.some((vote: any) => vote.userId._id.toString() === user._id.toString()) : false;

    return NextResponse.json({
      proposal: {
        id: proposal._id.toString(),
        title: proposal.title,
        description: proposal.description,
        state: proposal.status,
        forVotes: proposal.forVotes,
        againstVotes: proposal.againstVotes,
        scope: proposal.scope,
        className: proposal.classId?.name || 'Public',
        author: proposal.authorId?.name || 'Unknown',
        authorEmail: proposal.authorId?.email,
        startAt: proposal.startAt.getTime(),
        endAt: proposal.endAt.getTime(),
        createdAt: proposal.createdAt.getTime(),
        hasVoted,
        votes: voteRecords.map((vote: any) => ({
          choice: vote.choice,
          createdAt: vote.createdAt.getTime(),
          user: {
            id: vote.userId._id.toString(),
            name: vote.userId.name,
            email: vote.userId.email
          }
        }))
      }
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
