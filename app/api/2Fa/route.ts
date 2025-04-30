import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

export async function PUT(request: Request) {
  await dbConnect()

  try {
    const { userId, enabled } = await request.json()
    if (!userId || typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { twoFactorEnabled: enabled },
      { new: true }
    )

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ message: '2FA setting updated successfully' })
  } catch (error) {
    console.error('Error updating 2FA setting:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}