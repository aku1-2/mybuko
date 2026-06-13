import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { comparePassword, createToken } from '@/lib/auth'

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if the user is verified
    if (!user.isVerified) {
      return NextResponse.json({
        error: 'Email not verified. Please verify your email to log in.',
        isNotVerified: true,
        email: normalizedEmail
      }, { status: 400 })
    }

    // Ensure it's not a Google account trying to log in with an empty password
    if (user.authProvider === 'google' && !user.password) {
      return NextResponse.json(
        { error: 'This account uses Google login. Please click "Continue with Google".' },
        { status: 400 }
      )
    }

    // Compare password
    const isValid = user.password ? await comparePassword(password, user.password) : false

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Create token
    const token = createToken(user.id)

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      },
      token
    })

    // Set cookie
    response.cookies.set('token', token, {
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      httpOnly: false, // Accessible by client js just like before
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}