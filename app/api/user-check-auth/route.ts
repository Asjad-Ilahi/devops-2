import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]
  try {
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined')
    }
    jwt.verify(token, JWT_SECRET)
    return NextResponse.json({ authenticated: true }, { status: 200 })
  } catch (error) {
    console.error('Token verification failed:', error)
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}