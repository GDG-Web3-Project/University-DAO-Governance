import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Proposal from '@/lib/models/Proposal';
import Vote from '@/lib/models/Vote';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { choice } = await req.json();

    if (!choice || !['for', 'against'].includes(choice)) {
      return NextResponse.json({ message: 'Vote choice must be either for or against' }, { status: 400 });
    }

    const proposal = await Proposal.findById(id).populate('classId');
    if (!proposal) {
      return NextResponse.json({ message: 'Proposal not found' }, { status: 404 });
    }

    if (proposal.scope === 'class' && (!user.classId || user.classId._id.toString() !== proposal.classId._id.toString())) {
      return NextResponse.json({ message: 'Class members only can vote on this proposal' }, { status: 403 });
    }

    const existingVote = await Vote.findOne({ proposalId: proposal._id, userId: user._id });
    if (existingVote) {
      return NextResponse.json({ message: 'You have already voted on this proposal' }, { status: 400 });
    }

    const vote = await Vote.create({ proposalId: proposal._id, userId: user._id, choice });

    if (choice === 'for') {
      proposal.forVotes += 1;
    } else {
      proposal.againstVotes += 1;
    }

    await proposal.save();

    return NextResponse.json({
      vote: {
        id: vote._id.toString(),
        choice: vote.choice,
        createdAt: vote.createdAt.getTime()
      }
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
