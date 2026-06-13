import fs from 'fs'
import path from 'path'

// Environment variables for SMTP
const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = process.env.SMTP_PORT
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASSWORD = process.env.SMTP_PASSWORD
const SMTP_FROM = process.env.SMTP_FROM || 'MyBuko <no-reply@mybuko.com>'

export async function sendOtpEmail(email: string, otp: string, purpose: 'register' | 'reset') {
  const subject = purpose === 'register' 
    ? 'Verify your MyBuko Account' 
    : 'Reset your MyBuko Password'

  const messageText = purpose === 'register'
    ? `Welcome to MyBuko! Your verification code is: ${otp}. It will expire in 5 minutes.`
    : `You requested a password reset. Your reset code is: ${otp}. It will expire in 5 minutes.`

  const messageHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg; background-color: #ffffff;">
      <h2 style="color: #4f46e5; text-align: center; margin-bottom: 20px;">MyBuko Authentication</h2>
      <p style="font-size: 16px; color: #334155; line-height: 1.5;">Hello,</p>
      <p style="font-size: 16px; color: #334155; line-height: 1.5;">
        ${purpose === 'register' 
          ? 'Thank you for signing up for MyBuko! Please use the following 6-digit verification code to complete your registration:' 
          : 'You are receiving this email because you requested a password reset for your MyBuko account. Please use the following 6-digit code to reset your password:'}
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4f46e5; background-color: #f1f5f9; padding: 10px 20px; border-radius: 8px;">
          ${otp}
        </span>
      </div>
      <p style="font-size: 14px; color: #64748b; line-height: 1.5;">This code will expire in 5 minutes. If you did not request this, please ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">MyBuko © 2026. All rights reserved.</p>
    </div>
  `

  // Always write OTP to scratch file for development ease
  try {
    const scratchDir = path.join(process.cwd(), 'scratch')
    if (!fs.existsSync(scratchDir)) {
      fs.mkdirSync(scratchDir, { recursive: true })
    }
    const filePath = path.join(scratchDir, 'otps.txt')
    const logMessage = `[${new Date().toISOString()}] Email: ${email} | OTP: ${otp} | Purpose: ${purpose}\n`
    fs.appendFileSync(filePath, logMessage)
    console.log(`\n--- OTP SENT TO ${email} ---`)
    console.log(`OTP Code: ${otp}`)
    console.log(`Purpose: ${purpose}`)
    console.log(`Log file: ${filePath}`)
    console.log(`---------------------------\n`)
  } catch (err) {
    console.error('Failed to write OTP to scratch file:', err)
  }

  // Attempt real email sending if SMTP configured
  if (SMTP_HOST && SMTP_USER && SMTP_PASSWORD) {
    try {
      // Dynamically import nodemailer to avoid startup errors if not installed/needed
      const nodemailer = await import('nodemailer')
      const transporter = nodemailer.default.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT || '587'),
        secure: SMTP_PORT === '465',
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASSWORD,
        },
      })

      await transporter.sendMail({
        from: SMTP_FROM,
        to: email,
        subject: subject,
        text: messageText,
        html: messageHtml,
      })

      console.log(`Real email sent to ${email} via SMTP.`)
      return true
    } catch (error) {
      console.error('Failed to send real SMTP email. Falling back to log-only.', error)
      return false
    }
  }

  return true
}
