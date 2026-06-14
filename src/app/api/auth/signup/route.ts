import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateOtp } from '@/lib/auth'
import { sendOtpEmail } from '@/lib/email'

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    // Input validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    if (name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    if (existingUser) {
      // If user exists and is verified, block duplicate registration
      if (existingUser.isVerified) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 400 }
        )
      }

      // If user exists but is NOT verified, overwrite/update registration details
      const hashedPassword = await hashPassword(password)
      console.log(`[Signup API] Generating OTP for existing unverified user: ${normalizedEmail}`)
      const otp = generateOtp()
      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

      await prisma.user.update({
        where: { email: normalizedEmail },
        data: {
          name: name.trim(),
          password: hashedPassword,
          authProvider: 'email',
          otp,
          otpExpiry
        }
      })

      console.log(`[Signup API] Sending OTP email to ${normalizedEmail} with OTP: ${otp}`)
      const emailSent = await sendOtpEmail(normalizedEmail, otp, 'register')
      console.log(`[Signup API] OTP email send operation finished for ${normalizedEmail}. Result: ${emailSent}`)

      return NextResponse.json({
        message: 'Verification OTP sent successfully',
        email: normalizedEmail
      })
    }

    // Create a new unverified user in the database
    const hashedPassword = await hashPassword(password)
    console.log(`[Signup API] Generating OTP for new user: ${normalizedEmail}`)
    const otp = generateOtp()
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        isVerified: false,
        authProvider: 'email',
        otp,
        otpExpiry
      }
    })

    console.log(`[Signup API] Sending OTP email to ${normalizedEmail} with OTP: ${otp}`)
    const emailSent = await sendOtpEmail(normalizedEmail, otp, 'register')
    console.log(`[Signup API] OTP email send operation finished for ${normalizedEmail}. Result: ${emailSent}`)

    return NextResponse.json({
      message: 'Verification OTP sent successfully',
      email: normalizedEmail
    })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}