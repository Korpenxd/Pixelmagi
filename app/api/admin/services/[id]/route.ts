import { NextResponse } from 'next/server'

import { isAdminRequest } from '@/lib/adminAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

const MAX_IMAGE_SIZE = 12 * 1024 * 1024

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

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

function isStoredFile(path: string): boolean {
  return !path.startsWith('/') && !path.startsWith('http')
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  const serviceId = decodeURIComponent(id).trim()

  if (!serviceId) {
    return NextResponse.json({ error: 'Tjänstens id saknas' }, { status: 400 })
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
  const sortOrder = readSortOrder(formData)

  if (!title || !description || !price || sortOrder === null) {
    return NextResponse.json(
      { error: 'Titel, beskrivning, pris och position måste fyllas i' },
      { status: 400 },
    )
  }

  const { data: currentService, error: lookupError } = await getSupabaseAdmin()
    .from('services')
    .select('*')
    .eq('id', serviceId)
    .maybeSingle()

  if (lookupError) {
    console.error('Service lookup failed:', lookupError.message)
    return NextResponse.json(
      { error: 'Kunde inte läsa tjänstekortet' },
      { status: 500 },
    )
  }

  if (!currentService) {
    return NextResponse.json({ error: 'Tjänstekortet hittades inte' }, { status: 404 })
  }

  const fileValue = formData.get('image')
  let nextImagePath = currentService.image_path as string
  let uploadedPath: string | null = null

  if (fileValue instanceof File && fileValue.size > 0) {
    if (!fileValue.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Den valda filen är inte en bild' },
        { status: 400 },
      )
    }

    if (fileValue.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: 'Bilden får vara högst 12 MB' },
        { status: 400 },
      )
    }

    const safeName =
      cleanFileName(fileValue.name) || `service-${crypto.randomUUID()}.webp`
    uploadedPath = `services/${crypto.randomUUID()}-${safeName}`

    const { error: uploadError } = await getSupabaseAdmin()
      .storage.from('photos')
      .upload(uploadedPath, fileValue, {
        contentType: fileValue.type,
        cacheControl: '31536000',
        upsert: false,
      })

    if (uploadError) {
      console.error('Service image replacement failed:', uploadError.message)
      return NextResponse.json(
        { error: 'Kunde inte ladda upp den nya bilden' },
        { status: 500 },
      )
    }

    nextImagePath = uploadedPath
  }

  const { data: service, error: updateError } = await getSupabaseAdmin()
    .from('services')
    .update({
      title,
      description,
      price,
      image_path: nextImagePath,
      button_label: buttonLabel,
      sort_order: sortOrder,
      updated_at: new Date().toISOString(),
    })
    .eq('id', serviceId)
    .select('*')
    .single()

  if (updateError) {
    console.error('Service update failed:', updateError.message)

    if (uploadedPath) {
      await getSupabaseAdmin().storage.from('photos').remove([uploadedPath])
    }

    return NextResponse.json(
      { error: 'Kunde inte spara tjänstekortet' },
      { status: 500 },
    )
  }

  if (
    uploadedPath &&
    currentService.image_path !== uploadedPath &&
    isStoredFile(currentService.image_path)
  ) {
    const { error: removeError } = await getSupabaseAdmin()
      .storage.from('photos')
      .remove([currentService.image_path])

    if (removeError) {
      console.warn('Old service image could not be removed:', removeError.message)
    }
  }

  return NextResponse.json({
    success: true,
    service: withPublicUrl(service as ServiceRow),
  })
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  const serviceId = decodeURIComponent(id).trim()

  if (!serviceId) {
    return NextResponse.json({ error: 'Tjänstens id saknas' }, { status: 400 })
  }

  const { data: currentService, error: lookupError } = await getSupabaseAdmin()
    .from('services')
    .select('id, title, image_path')
    .eq('id', serviceId)
    .maybeSingle()

  if (lookupError) {
    console.error('Service lookup failed:', lookupError.message)
    return NextResponse.json(
      { error: 'Kunde inte läsa tjänstekortet' },
      { status: 500 },
    )
  }

  if (!currentService) {
    return NextResponse.json({ error: 'Tjänstekortet hittades inte' }, { status: 404 })
  }

  const { error: deleteError } = await getSupabaseAdmin()
    .from('services')
    .delete()
    .eq('id', serviceId)

  if (deleteError) {
    console.error('Service deletion failed:', deleteError.message)
    return NextResponse.json(
      { error: 'Kunde inte radera tjänstekortet' },
      { status: 500 },
    )
  }

  if (isStoredFile(currentService.image_path)) {
    const { error: removeError } = await getSupabaseAdmin()
      .storage.from('photos')
      .remove([currentService.image_path])

    if (removeError) {
      console.warn('Deleted service image could not be removed:', removeError.message)
    }
  }

  return NextResponse.json({
    success: true,
    deletedService: {
      id: currentService.id,
      title: currentService.title,
    },
  })
}
