import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Settings from '@/models/Settings';

export async function GET() {
  try {
    // Ensure MongoDB connection (assuming it's set up elsewhere in the app)
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI as string);
    }

    const settings = await Settings.findOne().select('primaryColor secondaryColor');
    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    return NextResponse.json({
      primaryColor: settings.primaryColor || '#4f46e5', // Default indigo-600
      secondaryColor: settings.secondaryColor || '#7c3aed', // Default purple-600
    });
  } catch (error) {
    console.error('Error fetching colors:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}