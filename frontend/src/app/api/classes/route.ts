import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ClassModel from '@/lib/models/Class';

export async function GET() {
  try {
    await dbConnect();
    const classes = await ClassModel.find().select('name slug description isPublic');
    return NextResponse.json({ classes });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
