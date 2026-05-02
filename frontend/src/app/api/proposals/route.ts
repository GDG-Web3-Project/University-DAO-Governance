import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Proposal from '@/lib/models/Proposal';
import Vote from '@/lib/models/Vote';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const user = await getAuthUser(req);
    const conditions: any[] = [{ scope: 'public' }];

    if (user?.classId) {
      conditions.push({ scope: 'class', classId: user.classId._id });
    }

    const proposals = await Proposal.find({ $or: conditions })
      .sort({ createdAt: -1 })
      .populate('authorId', 'name email')
      .populate('classId', 'name slug');

    const formatted = proposals.map((proposal: any) => ({
      id: proposal._id.toString(),
      title: proposal.title,
      description: proposal.description,
      state: proposal.status,
      forVotes: proposal.forVotes,
      againstVotes: proposal.againstVotes,
      scope: proposal.scope,
      className: proposal.classId?.name || 'Public',
      author: proposal.authorId?.name || 'Unknown',
      startAt: proposal.startAt.getTime(),
      endAt: proposal.endAt.getTime(),
      hasVoted: false
    }));

    if (user) {
      const voteRecords = await Vote.find({ proposalId: { $in: proposals.map((p: any) => p._id) }, userId: user._id });
      const voteSet = new Set(voteRecords.map((vote: any) => vote.proposalId.toString()));
      formatted.forEach((proposal: any) => {
        if (voteSet.has(proposal.id)) {
          proposal.hasVoted = true;
        }
      });
    }

    return NextResponse.json({ proposals: formatted });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, durationDays, scope } = await req.json();

    if (!title || !description || !durationDays) {
      return NextResponse.json({ message: 'Title, description, and duration are required' }, { status: 400 });
    }

    if (scope === 'class' && !user.classId) {
      return NextResponse.json({ message: 'Only class members can create class proposals' }, { status: 400 });
    }

    const endAt = new Date(Date.now() + Math.max(1, Number(durationDays)) * 24 * 60 * 60 * 1000);

    const proposal = await Proposal.create({
      title: title.trim(),
      description: description.trim(),
      authorId: user._id,
      classId: scope === 'class' ? user.classId._id : null,
      scope: scope === 'public' ? 'public' : 'class',
      startAt: new Date(),
      endAt
    });

    return NextResponse.json({
      proposal: {
        id: proposal._id.toString(),
        title: proposal.title,
        description: proposal.description,
        state: proposal.status,
        scope: proposal.scope,
        className: scope === 'public' ? 'Public' : user.classId?.name || 'Class',
        startAt: proposal.startAt.getTime(),
        endAt: proposal.endAt.getTime()
      }
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
