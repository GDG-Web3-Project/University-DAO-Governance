import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { walletAddress } = await req.json();
    if (!walletAddress) {
      return NextResponse.json({ message: 'walletAddress is required' }, { status: 400 });
    }

    user.walletAddress = walletAddress.toLowerCase().trim();
    await user.save();

    return NextResponse.json({ walletAddress: user.walletAddress });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
