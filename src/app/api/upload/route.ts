import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { put } from '@vercel/blob'
import { auth } from '@/lib/auth'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    // Whitelist : empêche une valeur arbitraire (ex. "../") d'être injectée dans le chemin du blob.
    const rawType = (formData.get('type') as string) ?? 'banner'
    const ALLOWED_FOLDERS = ['banner', 'avatar', 'logo'] as const
    type UploadFolder = (typeof ALLOWED_FOLDERS)[number]
    const type: UploadFolder = ALLOWED_FOLDERS.includes(rawType as UploadFolder) ? (rawType as UploadFolder) : 'banner'

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Format non supporté. Utilisez JPG, PNG, WebP ou GIF.' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Fichier trop lourd (max 5 Mo)' }, { status: 400 })
    }

    const ext = file.name.split('.').pop() ?? 'jpg'
    const filename = `${type}/${session.user.id}-${Date.now()}.${ext}`

    const blob = await put(filename, file, {
      access: 'public',
      contentType: file.type,
    })

    return NextResponse.json({ url: blob.url })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Erreur lors de l\'upload' }, { status: 500 })
  }
}
