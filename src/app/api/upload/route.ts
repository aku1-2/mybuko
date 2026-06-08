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
        const file = formData.get('file') as File
        if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const base64 = `data:${file.type};base64,${buffer.toString('base64')}`

        const isVideo = file.type.startsWith('video/')

        const hasCloudinary =
            process.env.CLOUDINARY_CLOUD_NAME &&
            process.env.CLOUDINARY_API_KEY &&
            process.env.CLOUDINARY_API_SECRET
        if (hasCloudinary) {
            try {
                const result = await cloudinary.uploader.upload(base64, {
                    resource_type: isVideo ? 'video' : 'image',
                    folder: 'mybuko-stories',
                })
                return NextResponse.json({
                    url: result.secure_url,
                    mediaType: isVideo ? 'video' : 'image',
                })
            } catch (err) {
                console.error('Cloudinary upload failed, falling back to base64:', err)
            }
        } else {
            console.log('Cloudinary credentials missing or placeholders, using base64 fallback')
        }

        // Fallback to base64 data URL
        return NextResponse.json({
            url: base64,
            mediaType: isVideo ? 'video' : 'image',
        })
    } catch (err: any) {
        console.error('Upload route error:', err)
        return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 })
    }
}