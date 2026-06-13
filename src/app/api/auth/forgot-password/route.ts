import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateOtp } from '@/lib/auth'
import { sendOtpEmail } from '@/lib/email'
import { otpRateLimiter } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // 1. Rate Limiting check
    const ip = request.headers.get('x-forwarded-for') || 'local'
    const limitKey = `forgot:${ip}:${normalizedEmail}`
    if (otpRateLimiter.isLimitExceeded(limitKey)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait 5 minutes.' },
        { status: 429 }
      )
    }

    // 2. Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    // Security practice: Return success even if user is not found, to prevent email enumeration.
    // However, if we want to show friendly UI errors, we can check. Since MyBuko is a developer app, returning a clear error is usually preferred. Let's return error if user doesn't exist or is not verified, to be explicit.
    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email address' },
        { status: 404 }
      )
    }

    if (!user.isVerified) {
      return NextResponse.json(
        { error: 'This email is registered but not verified. Please sign up again.' },
        { status: 400 }
      )
    }

    // 3. Generate reset OTP and update DB
    const otp = generateOtp()
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp,
        otpExpiry
      }
    })

    // 4. Send email
    await sendOtpEmail(normalizedEmail, otp, 'reset')

    return NextResponse.json({
      message: 'Reset verification code sent successfully',
      email: normalizedEmail
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Failed to process forgot password request' },
      { status: 500 }
    )
  }
}
