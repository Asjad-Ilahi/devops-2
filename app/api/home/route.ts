import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Settings, { ISettings } from '@/models/Settings';

// Connect to MongoDB
async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    // Fetch settings with lean() and safely cast to ISettings
    const settings = (await Settings.findOne().lean()) as unknown as ISettings;
    
    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    // Destructure the properties
    const { facebookUrl, twitterUrl, instagramUrl } = settings;
    
    return NextResponse.json({
      facebookUrl,
      twitterUrl,
      instagramUrl,
    });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}