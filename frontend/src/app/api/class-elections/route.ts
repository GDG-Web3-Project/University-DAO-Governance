import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ClassElection from '@/lib/models/ClassElection';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const elections = await ClassElection.find().sort({ createdAt: -1 }).populate('classId', 'name slug');
    
    // In Next.js, we get headers from the request object
    const wallet = (req.headers.get('x-wallet-address') || '').toLowerCase();

    const payload = elections.map((item: any) => ({
      id: item.contractElectionId.toString(),
      title: item.title,
      description: item.description,
      state: item.finalized ? 'Finalized' : 'Active',
      forVotes: item.forVotes,
      againstVotes: item.againstVotes,
      className: item.classId?.name || 'Class',
      startAt: item.startAt.getTime(),
      endAt: item.endAt.getTime(),
      canVote: wallet ? item.invitedWallets.map((w: string) => w.toLowerCase()).includes(wallet) : false
    }));

    return NextResponse.json({ elections: payload });
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

    const { title, description, classId, startAt, endAt, invitedWallets = [], contractElectionId, txHash } = await req.json();
    
    const election = await ClassElection.create({
      title,
      description,
      classId,
      creatorId: user._id,
      contractElectionId: Number(contractElectionId || 0),
      txHash: txHash || '',
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      invitedWallets
    });

    return NextResponse.json({ electionId: election._id.toString() }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
