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
    
    return NextResponse.json(settings);
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
        linkedinUrl: data.linkedinUrl || '',
        privacyPolicy: data.privacyPolicy,
        termsOfService: data.termsOfService
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ message: 'Settings updated successfully', settings });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Invalid token or server error' }, { status: 500 });
  }
}