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
    // Fetch settings with lean() and select only needed fields
    const settings = (await Settings.findOne()
      .select('logoUrl facebookUrl twitterUrl instagramUrl zelleLogoUrl')
      .lean()) as unknown as ISettings;
    
    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    // Destructure the properties
    const { logoUrl, facebookUrl, twitterUrl, instagramUrl, zelleLogoUrl } = settings;
    
    const response = NextResponse.json({
      logoUrl,
      facebookUrl,
      twitterUrl,
      instagramUrl,
      zelleLogoUrl,
    });
    
    // Add caching headers
    response.headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=43200');
    return response;
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}