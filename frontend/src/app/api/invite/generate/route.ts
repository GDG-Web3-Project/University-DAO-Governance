import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Invite from '@/lib/models/Invite';
import ClassModel from '@/lib/models/Class';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const user = await getAuthUser(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ message: 'Only admin users can generate invite codes' }, { status: 403 });
    }

    const { classSlug, expiresInHours } = await req.json();
    if (!classSlug) {
      return NextResponse.json({ message: 'classSlug is required' }, { status: 400 });
    }

    const classDoc = await ClassModel.findOne({ slug: classSlug });
    if (!classDoc) {
      return NextResponse.json({ message: 'Class not found' }, { status: 404 });
    }

    const code = `UNI-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * (expiresInHours || 72));

    const invite = await Invite.create({
      code,
      classId: classDoc._id,
      createdBy: user._id,
      expiresAt
    });

    return NextResponse.json({
      invite: {
        code: invite.code,
        class: classDoc.name,
        expiresAt: invite.expiresAt
      }
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
