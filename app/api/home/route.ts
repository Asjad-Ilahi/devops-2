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
    // Fetch settings with lean() and select all needed fields, including dimensions
    const settings = (await Settings.findOne()
      .select('logoUrl logoWidth logoHeight facebookUrl twitterUrl instagramUrl zelleLogoUrl zelleLogoWidth zelleLogoHeight')
      .lean()) as unknown as ISettings;
    
    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    // Destructure the properties with defaults for dimensions
    const {
      logoUrl,
      logoWidth = 0,
      logoHeight = 0,
      facebookUrl,
      twitterUrl,
      instagramUrl,
      zelleLogoUrl,
      zelleLogoWidth = 0,
      zelleLogoHeight = 0,
    } = settings;
    
    const response = NextResponse.json({
      logoUrl,
      logoWidth,
      logoHeight,
      facebookUrl,
      twitterUrl,
      instagramUrl,
      zelleLogoUrl,
      zelleLogoWidth,
      zelleLogoHeight,
    });
    
    // Add caching headers
    response.headers.set('Cache-Control', 'public, max-age=1, s-maxage=1, stale-while-revalidate=1');
    return response;
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
