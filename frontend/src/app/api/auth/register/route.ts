import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import ClassModel from '@/lib/models/Class';
import Invite from '@/lib/models/Invite';
import { createToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { name, email, password, inviteCode, walletAddress } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Name, email, and password are required' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return NextResponse.json({ message: 'Email already registered' }, { status: 409 });
    }

    let classId = null;
    let classDoc = null;

    if (inviteCode) {
      const invite = await Invite.findOne({ code: inviteCode.toUpperCase().trim() });
      if (!invite) {
        return NextResponse.json({ message: 'Invalid invite code' }, { status: 400 });
      }
      if (invite.expiresAt < new Date()) {
        return NextResponse.json({ message: 'Invite code has expired' }, { status: 400 });
      }
      if (invite.usedBy) {
        return NextResponse.json({ message: 'Invite code has already been used' }, { status: 400 });
      }

      classDoc = await ClassModel.findById(invite.classId);
      if (!classDoc) {
        return NextResponse.json({ message: 'Invite class could not be found' }, { status: 400 });
      }
      classId = classDoc._id;

      invite.usedBy = null; // temporary
      invite.usedAt = new Date();
      await invite.save();
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      walletAddress: walletAddress ? walletAddress.toLowerCase().trim() : null,
      classId
    });

    if (inviteCode) {
      const invite = await Invite.findOne({ code: inviteCode.toUpperCase().trim() });
      if (invite) {
        invite.usedBy = user._id;
        await invite.save();
      }
    }

    const token = createToken(user);

    return NextResponse.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        class: classDoc
          ? {
              id: classDoc._id.toString(),
              name: classDoc.name,
              slug: classDoc.slug,
              isPublic: classDoc.isPublic
            }
          : null
      }
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
