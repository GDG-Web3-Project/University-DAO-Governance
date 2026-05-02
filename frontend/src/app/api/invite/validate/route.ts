import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invite from '@/lib/models/Invite';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const code = (searchParams.get('code') || '').toUpperCase().trim();
    
    if (!code) {
      return NextResponse.json({ message: 'Invite code is required' }, { status: 400 });
    }

    const invite = await Invite.findOne({ code }).populate('classId');
    if (!invite) {
      return NextResponse.json({ message: 'Invite code not found' }, { status: 404 });
    }
    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ message: 'Invite code has expired' }, { status: 400 });
    }
    if (invite.usedBy) {
      return NextResponse.json({ message: 'Invite code has already been used' }, { status: 400 });
    }

    return NextResponse.json({
      code: invite.code,
      class: {
        id: invite.classId._id.toString(),
        name: invite.classId.name,
        slug: invite.classId.slug,
        isPublic: invite.classId.isPublic
      },
      expiresAt: invite.expiresAt
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
