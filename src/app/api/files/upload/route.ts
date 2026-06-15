import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as any
    if (!file) return NextResponse.json({ error: 'file is required' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = `data:${file.type || 'application/octet-stream'};base64,${buffer.toString('base64')}`

    const isVideoOrAudio = file.type?.startsWith('video/') || file.type?.startsWith('audio/')
    const isImage = file.type?.startsWith('image/')
    const resourceType = isImage ? 'image' : isVideoOrAudio ? 'video' : 'raw'

    const hasCloudinary =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET

    if (hasCloudinary) {
      try {
        const result = await cloudinary.uploader.upload(base64, {
          resource_type: resourceType,
          folder: 'mybuko-chats',
        })
        return NextResponse.json({
          url: result.secure_url,
          filename: file.name || 'upload'
        })
      } catch (err) {
        console.error('Cloudinary upload failed in chats API:', err)
      }
    }

    // Fallback: If Cloudinary fails or is not configured, we fallback to base64,
    // which is 100% database-persisted (in the Message fileUrl field) and completely
    // avoids writing to the public directory!
    return NextResponse.json({
      url: base64,
      filename: file.name || 'upload'
    })

  } catch (err: any) {
    console.error('File upload error', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
