import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Settings from '@/models/Settings';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("cookie")
      ?.split("; ")
      .find((row) => row.startsWith("adminToken="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    jwt.verify(token, JWT_SECRET);

    await mongoose.connect(process.env.MONGODB_URI!);
    
    const settings = await Settings.findOne().lean();
    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }
    
    const response = NextResponse.json(settings);
    response.headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=43200');
    return response;
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json({ error: 'Invalid token or server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get("cookie")
      ?.split("; ")
      .find((row) => row.startsWith("adminToken="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    jwt.verify(token, JWT_SECRET);

    const data = await request.json();
    
    if (!data.siteName || !data.supportEmail || !data.supportPhone || !data.privacyPolicy || !data.termsOfService) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await mongoose.connect(process.env.MONGODB_URI!);
    
    const settings = await Settings.findOneAndUpdate(
      {},
      {
        siteName: data.siteName,
        supportEmail: data.supportEmail,
        supportPhone: data.supportPhone,
        instagramUrl: data.instagramUrl || '',
        twitterUrl: data.twitterUrl || '',
        facebookUrl: data.facebookUrl || '',
        privacyPolicy: data.privacyPolicy,
        termsOfService: data.termsOfService,
        primaryColor: data.primaryColor || '#5f6cd3',
        secondaryColor: data.secondaryColor || '#9c65d2',
        logoUrl: data.logoUrl || '',
        logoWidth: data.logoWidth,
        logoHeight: data.logoHeight,
        zelleLogoUrl: data.zelleLogoUrl || '',
        zelleLogoWidth: data.zelleLogoWidth,
        zelleLogoHeight: data.zelleLogoHeight,
        checkingIcon: data.checkingIcon || '',
        savingsIcon: data.savingsIcon || ''
      },
      { upsert: true, new: true }
    );

    const response = NextResponse.json({ message: 'Settings updated successfully', settings });
    response.headers.set('Cache-Control', 'public, max-age=1, s-maxage=1, stale-while-revalidate=1');
    return response;
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Invalid token or server error' }, { status: 500 });
  }
}
