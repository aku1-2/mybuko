import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/google/callback`

    if (!clientId) {
      console.error('GOOGLE_CLIENT_ID environment variable is not defined')
      return NextResponse.json(
        { error: 'Google OAuth Client ID is not configured on the server' },
        { status: 500 }
      )
    }

    // Construct the Google OAuth authorization URL
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      clientId
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${encodeURIComponent(
      'openid email profile'
    )}&access_type=offline&prompt=consent`

    return NextResponse.redirect(googleAuthUrl)
  } catch (error) {
    console.error('Google Auth Route Error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate Google Authentication' },
      { status: 500 }
    )
  }
}
