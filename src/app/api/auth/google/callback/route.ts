import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const errorParam = searchParams.get('error')

    // Handle authentication cancelation or Google OAuth errors
    if (errorParam) {
      console.error('Google OAuth error from query param:', errorParam)
      return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(errorParam)}`, request.url))
    }

    if (!code) {
      console.error('No authorization code provided in Google OAuth callback')
      return NextResponse.redirect(new URL('/auth/login?error=Google+login+authorization+failed', request.url))
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/google/callback`

    if (!clientId || !clientSecret) {
      console.error('Google credentials missing in server environment variables')
      return NextResponse.redirect(new URL('/auth/login?error=Google+OAuth+credentials+are+not+configured', request.url))
    }

    // 1. Swap code for Google tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', errorText)
      return NextResponse.redirect(new URL('/auth/login?error=Google+token+exchange+failed', request.url))
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // 2. Query user information
    const userinfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!userinfoResponse.ok) {
      console.error('Google Userinfo request failed')
      return NextResponse.redirect(new URL('/auth/login?error=Failed+to+fetch+user+details+from+Google', request.url))
    }

    const googleUser = await userinfoResponse.json()
    const { email, name, picture } = googleUser

    if (!email) {
      return NextResponse.redirect(new URL('/auth/login?error=Google+account+email+not+provided', request.url))
    }

    const normalizedEmail = email.toLowerCase().trim()

    // 3. Upsert user in database
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    if (user) {
      // Login existing user. Update details if needed.
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: user.name || name || 'Google User',
          profileImage: user.profileImage || picture || null,
          isVerified: true // OAuth implies verification
        }
      })
    } else {
      // Create new user automatically
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: name || 'Google User',
          profileImage: picture || null,
          isVerified: true,
          authProvider: 'google'
        }
      })
    }

    // 4. Create local session token
    const token = createToken(user.id)

    // Build the frontend redirect callback URL
    const frontendCallbackUrl = new URL('/auth/google-callback', request.url)
    frontendCallbackUrl.searchParams.set('token', token)
    frontendCallbackUrl.searchParams.set('user', JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      createdAt: user.createdAt
    }))

    const response = NextResponse.redirect(frontendCallbackUrl)

    // Set cookie on response
    response.cookies.set('token', token, {
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      httpOnly: false, // matches email login setting
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    return response

  } catch (error) {
    console.error('Google OAuth callback handler error:', error)
    return NextResponse.redirect(new URL('/auth/login?error=Google+login+internal+server+error', request.url))
  }
}
