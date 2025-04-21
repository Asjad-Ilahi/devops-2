import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Settings from '@/models/Settings'; // Adjust the import path as necessary

export async function GET() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!); // Ensure MongoDB URI is set in .env
    const settings = await Settings.findOne(); // Fetch the first settings document
    if (!settings || !settings.primaryColor) {
      return NextResponse.json({ error: 'Primary color not found' }, { status: 404 });
    }
    return NextResponse.json({ primaryColor: settings.primaryColor }); // Return hex code
  } catch (error) {
    console.error('Error fetching primary color:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}