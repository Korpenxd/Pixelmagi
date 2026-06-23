import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/adminAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

const MAX_HERO_SIZE = 15 * 1024 * 1024

function cleanFileName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9åäö.-]/gi, '')
}

export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let formData: FormData

  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid upload data' }, { status: 400 })
  }

  const fileValue = formData.get('file')

  if (!(fileValue instanceof File)) {
    return NextResponse.json({ error: 'Hero image is required' }, { status: 400 })
  }

  if (!fileValue.type.startsWith('image/')) {
    return NextResponse.json(
      { error: 'The selected file is not an image' },
      { status: 400 },
    )
  }

  if (fileValue.size === 0) {
    return NextResponse.json({ error: 'The selected image is empty' }, { status: 400 })
  }

  if (fileValue.size > MAX_HERO_SIZE) {
    return NextResponse.json(
      { error: 'Hero image exceeds the 15 MB limit' },
      { status: 400 },
    )
  }

  // Load the previous hero path on the server.
  const { data: currentSetting, error: lookupError } = await getSupabaseAdmin()
    .from('site_settings')
    .select('value')
    .eq('key', 'hero_image_path')
    .maybeSingle()

  if (lookupError) {
    console.error('Hero setting lookup failed:', {
      message: lookupError.message,
      code: lookupError.code,
      details: lookupError.details,
    })

    return NextResponse.json(
      { error: 'Could not load the current hero setting' },
      { status: 500 },
    )
  }

  const currentHeroPath =
    typeof currentSetting?.value === 'string' ? currentSetting.value : null

  const safeName = cleanFileName(fileValue.name) || `hero-${crypto.randomUUID()}.webp`

  const newStoragePath = `hero/${crypto.randomUUID()}-${safeName}`

  // Upload the new hero before changing the setting.
  const { error: uploadError } = await getSupabaseAdmin()
    .storage.from('photos')
    .upload(newStoragePath, fileValue, {
      contentType: fileValue.type,
      cacheControl: '31536000',
      upsert: false,
    })

  if (uploadError) {
    console.error('Hero Storage upload failed:', {
      message: uploadError.message,
    })

    return NextResponse.json(
      { error: 'Could not upload the hero image' },
      { status: 500 },
    )
  }

  // Point the site setting to the newly uploaded file.
  const { error: settingsError } = await getSupabaseAdmin()
    .from('site_settings')
    .upsert(
      {
        key: 'hero_image_path',
        value: newStoragePath,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'key',
      },
    )

  if (settingsError) {
    console.error('Hero setting update failed:', {
      message: settingsError.message,
      code: settingsError.code,
      details: settingsError.details,
    })

    // Avoid leaving the new upload behind if the setting update fails.
    await getSupabaseAdmin().storage.from('photos').remove([newStoragePath])

    return NextResponse.json(
      { error: 'Could not save the hero setting' },
      { status: 500 },
    )
  }

  // Only delete the previous hero after the new setting is saved.
  if (currentHeroPath && currentHeroPath !== newStoragePath) {
    const { error: removeError } = await getSupabaseAdmin()
      .storage.from('photos')
      .remove([currentHeroPath])

    if (removeError) {
      // The replacement still succeeded, so log this rather than failing.
      console.warn('Old hero image could not be removed:', {
        message: removeError.message,
        path: currentHeroPath,
      })
    }
  }

  const publicUrl = getSupabaseAdmin()
    .storage.from('photos')
    .getPublicUrl(newStoragePath).data.publicUrl

  return NextResponse.json(
    {
      success: true,
      path: newStoragePath,
      url: `${publicUrl}?v=${Date.now()}`,
    },
    { status: 201 },
  )
}
