import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Admin from '@/models/Admin';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(request: NextRequest) {
  try {
    // Extract token from Cookie header as in check-auth
    const token = request.headers.get("cookie")
      ?.split("; ")
      .find((row) => row.startsWith("adminToken="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as { adminId: string };
    const adminId = decoded.adminId;

    await mongoose.connect(process.env.MONGODB_URI!);
    const admin = await Admin.findById(adminId).select('-password');
    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }
    return NextResponse.json(admin);
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Invalid token or server error' }, { status: 401 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Extract token from Cookie header as in check-auth
    const token = request.headers.get("cookie")
      ?.split("; ")
      .find((row) => row.startsWith("adminToken="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as { adminId: string };
    const adminId = decoded.adminId;

    const data = await request.json();
    await mongoose.connect(process.env.MONGODB_URI!);
    const admin = await Admin.findByIdAndUpdate(adminId, data, { new: true }).select('-password');
    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Profile updated successfully', admin });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Invalid token or server error' }, { status: 401 });
  }
}