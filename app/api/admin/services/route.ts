import { NextResponse } from 'next/server'

import { isAdminRequest } from '@/lib/adminAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

const MAX_IMAGE_SIZE = 12 * 1024 * 1024

type ServiceRow = {
  id: string
  title: string
  description: string
  price: string
  image_path: string
  button_label: string
  sort_order: number
  created_at: string
  updated_at: string
}

function cleanFileName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9åäö.-]/gi, '')
}

function readRequiredText(
  formData: FormData,
  key: string,
  maxLength: number,
): string | null {
  const value = formData.get(key)

  if (typeof value !== 'string') return null

  const cleaned = value.trim()
  return cleaned.length > 0 && cleaned.length <= maxLength ? cleaned : null
}

function readSortOrder(formData: FormData): number | null {
  const value = formData.get('sort_order')

  if (typeof value !== 'string' || value.trim() === '') return null

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? Math.max(0, Math.min(parsed, 999)) : null
}

function withPublicUrl(service: ServiceRow) {
  const imageUrl =
    service.image_path.startsWith('/') || service.image_path.startsWith('http')
      ? service.image_path
      : getSupabaseAdmin().storage.from('photos').getPublicUrl(service.image_path).data
          .publicUrl

  return {
    ...service,
    image_url: imageUrl,
  }
}

export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let formData: FormData

  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Ogiltiga formulärdata' }, { status: 400 })
  }

  const title = readRequiredText(formData, 'title', 100)
  const description = readRequiredText(formData, 'description', 800)
  const price = readRequiredText(formData, 'price', 100)
  const buttonLabel =
    readRequiredText(formData, 'button_label', 50) || 'Boka eller fråga'
  const requestedSortOrder = readSortOrder(formData)
  const fileValue = formData.get('image')

  if (!title || !description || !price) {
    return NextResponse.json(
      { error: 'Titel, beskrivning och pris måste fyllas i' },
      { status: 400 },
    )
  }

  if (!(fileValue instanceof File)) {
    return NextResponse.json(
      { error: 'Välj en bild till tjänstekortet' },
      { status: 400 },
    )
  }

  if (!fileValue.type.startsWith('image/')) {
    return NextResponse.json(
      { error: 'Den valda filen är inte en bild' },
      { status: 400 },
    )
  }

  if (fileValue.size === 0 || fileValue.size > MAX_IMAGE_SIZE) {
    return NextResponse.json(
      { error: 'Bilden måste vara större än 0 byte och högst 12 MB' },
      { status: 400 },
    )
  }

  let sortOrder = requestedSortOrder

  if (sortOrder === null) {
    const { data: lastService, error: orderError } = await getSupabaseAdmin()
      .from('services')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (orderError) {
      console.error('Service sort-order lookup failed:', orderError.message)
      return NextResponse.json(
        { error: 'Kunde inte bestämma kortets position' },
        { status: 500 },
      )
    }

    sortOrder = (lastService?.sort_order ?? -1) + 1
  }

  const safeName =
    cleanFileName(fileValue.name) || `service-${crypto.randomUUID()}.webp`
  const storagePath = `services/${crypto.randomUUID()}-${safeName}`

  const { error: uploadError } = await getSupabaseAdmin()
    .storage.from('photos')
    .upload(storagePath, fileValue, {
      contentType: fileValue.type,
      cacheControl: '31536000',
      upsert: false,
    })

  if (uploadError) {
    console.error('Service image upload failed:', uploadError.message)
    return NextResponse.json(
      { error: 'Kunde inte ladda upp tjänstebilden' },
      { status: 500 },
    )
  }

  const { data: service, error: insertError } = await getSupabaseAdmin()
    .from('services')
    .insert({
      title,
      description,
      price,
      image_path: storagePath,
      button_label: buttonLabel,
      sort_order: sortOrder,
    })
    .select('*')
    .single()

  if (insertError) {
    console.error('Service creation failed:', insertError.message)
    await getSupabaseAdmin().storage.from('photos').remove([storagePath])

    return NextResponse.json(
      { error: 'Kunde inte skapa tjänstekortet' },
      { status: 500 },
    )
  }

  return NextResponse.json(
    {
      success: true,
      service: withPublicUrl(service as ServiceRow),
    },
    { status: 201 },
  )
}
