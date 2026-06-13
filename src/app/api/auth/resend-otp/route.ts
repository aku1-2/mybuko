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
    const limitKey = `${ip}:${normalizedEmail}`
    if (otpRateLimiter.isLimitExceeded(limitKey)) {
      return NextResponse.json(
        { error: 'Too many OTP requests. Please wait 5 minutes.' },
        { status: 429 }
      )
    }

    // 2. Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.isVerified) {
      return NextResponse.json(
        { error: 'Email already verified' },
        { status: 400 }
      )
    }

    // 3. Generate new OTP and update DB
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
    await sendOtpEmail(normalizedEmail, otp, 'register')

    return NextResponse.json({
      message: 'Verification OTP resent successfully',
      email: normalizedEmail
    })

  } catch (error) {
    console.error('Resend OTP error:', error)
    return NextResponse.json(
      { error: 'Failed to resend verification code' },
      { status: 500 }
    )
  }
}
