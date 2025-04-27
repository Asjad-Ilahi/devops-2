import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Admin from '@/models/Admin';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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

    const decoded = jwt.verify(token, JWT_SECRET) as { adminId: string };
    const adminId = decoded.adminId;

    await mongoose.connect(process.env.MONGODB_URI!);
    const admin = await Admin.findById(adminId).select('username email').lean() as { username?: string; email?: string } | null;
    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }
    console.log('Fetched profile:', admin); // Debug
    return NextResponse.json({
      username: admin.username || '',
      email: admin.email || '',
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Invalid token or server error' }, { status: 401 });
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

    const decoded = jwt.verify(token, JWT_SECRET) as { adminId: string };
    const adminId = decoded.adminId;

    const data = await request.json();
    await mongoose.connect(process.env.MONGODB_URI!);
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Handle profile updates (username, email)
    if (data.username || data.email) {
      console.log('Updating profile for admin:', adminId, 'with data:', data);
      const updateFields: { username?: string; email?: string } = {};
      let changesMade = false;

      if (data.username && data.username !== admin.username) {
        updateFields.username = data.username;
        changesMade = true;
      }

      if (data.email && data.email !== admin.email) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
          console.log('Invalid email format for admin:', adminId, 'email:', data.email);
          return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
        }
        // Check for duplicate email
        const existingAdmin = await Admin.findOne({ email: data.email, _id: { $ne: adminId } });
        if (existingAdmin) {
          console.log('Duplicate email detected for admin:', adminId, 'email:', data.email);
          return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
        }
        updateFields.email = data.email;
        changesMade = true;
        console.log('Email prepared for update for admin:', adminId, 'new email:', data.email);
      }

      if (changesMade) {
        console.log('Update fields to be applied:', updateFields); // Debug
        try {
          // Use updateOne to simplify the update
          const updateResult = await Admin.updateOne(
            { _id: adminId },
            { $set: updateFields },
            { writeConcern: { w: 'majority' } }
          );
          console.log('Update result:', updateResult); // Debug

          if (updateResult.matchedCount === 0) {
            console.log('Failed to find admin:', adminId);
            return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
          }

          // Fetch the updated document to confirm changes
          const updatedAdmin = await Admin.findById(adminId).select('username email');
          if (!updatedAdmin) {
            console.log('Failed to fetch updated admin:', adminId);
            return NextResponse.json({ error: 'Failed to fetch updated profile' }, { status: 500 });
          }
          console.log('Updated admin document:', updatedAdmin); // Debug
          
          // Verify email update
          if (updateFields.email && updatedAdmin.email !== updateFields.email) {
            console.log('Email update failed in database, expected:', updateFields.email, 'got:', updatedAdmin.email);
            return NextResponse.json(
              { error: 'Failed to update email in database' },
              { status: 500 }
            );
          }

          console.log('Profile updated successfully for admin:', adminId, 'new email:', updatedAdmin.email);
          return NextResponse.json({
            message: 'Profile updated successfully',
            admin: { username: updatedAdmin.username, email: updatedAdmin.email },
          });
        } catch (error: any) {
          console.error('Profile update error:', error);
          if (error.code === 11000) {
            console.log('Duplicate key error for admin:', adminId, 'email:', data.email);
            return NextResponse.json(
              { error: 'Email already in use' },
              { status: 400 }
            );
          }
          return NextResponse.json(
            { error: 'Failed to update profile: Invalid data or server error' },
            { status: 400 }
          );
        }
      } else {
        console.log('No changes detected for admin:', adminId);
        return NextResponse.json({
          message: 'No changes to update',
          admin: { username: admin.username, email: admin.email },
        });
      }
    }

    // Handle password change
    if (data.currentPassword && data.newPassword) {
      console.log('Changing password for admin:', adminId);
      const isPasswordValid = await admin.comparePassword(data.currentPassword);
      if (!isPasswordValid) {
        console.log('Invalid current password for admin:', adminId);
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }

      admin.password = data.newPassword; // Pre-save hook will hash
      try {
        await admin.save();
        console.log('Password updated successfully for admin:', adminId);
        return NextResponse.json({ message: 'Password changed successfully' });
      } catch (error) {
        console.error('Password update error:', error);
        return NextResponse.json(
          { error: 'Failed to update password' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Invalid request: Provide username/email or currentPassword/newPassword' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Invalid token or server error' }, { status: 401 });
  }
}