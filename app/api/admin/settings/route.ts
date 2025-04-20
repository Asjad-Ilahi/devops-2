import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Settings from '@/models/Settings';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(request: NextRequest) {
  try {
    // Extract token from Cookie header
    const token = request.headers.get("cookie")
      ?.split("; ")
      .find((row) => row.startsWith("adminToken="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as { adminId: string };

    await mongoose.connect(process.env.MONGODB_URI!);
    
    // Since settings are global, we don't need adminId; fetch the first settings document
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
    // Extract token from Cookie header
    const token = request.headers.get("cookie")
      ?.split("; ")
      .find((row) => row.startsWith("adminToken="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as { adminId: string };

    const data = await request.json();
    
    // Validate required fields
    if (!data.siteName || !data.supportEmail || !data.supportPhone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await mongoose.connect(process.env.MONGODB_URI!);
    
    // Update or create settings (upsert)
    const settings = await Settings.findOneAndUpdate(
      {},
      {
        siteName: data.siteName,
        supportEmail: data.supportEmail,
        supportPhone: data.supportPhone,
        instagramUrl: data.instagramUrl || '',
        twitterUrl: data.twitterUrl || '',
        facebookUrl: data.facebookUrl || '',
        linkedinUrl: data.linkedinUrl || ''
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ message: 'Settings updated successfully', settings });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Invalid token or server error' }, { status: 500 });
  }
}