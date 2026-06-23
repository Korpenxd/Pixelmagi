import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/adminAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

const MAX_FILES = 20
const MAX_FILE_SIZE = 15 * 1024 * 1024

function cleanFileName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9åäö.-]/gi, '')
}

function getOptionalString(formData: FormData, key: string): string | null {
  const value = formData.get(key)

  if (typeof value !== 'string') {
    return null
  }

  const trimmedValue = value.trim()

  return trimmedValue || null
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

  const files = formData
    .getAll('files')
    .filter((value): value is File => value instanceof File)

  const categoryValue = formData.get('category')

  if (typeof categoryValue !== 'string' || !categoryValue.trim()) {
    return NextResponse.json({ error: 'Category is required' }, { status: 400 })
  }

  const category = categoryValue.trim()

  if (files.length === 0) {
    return NextResponse.json(
      { error: 'At least one image is required' },
      { status: 400 },
    )
  }

  if (files.length > MAX_FILES) {
    return NextResponse.json(
      {
        error: `A maximum of ${MAX_FILES} images can be uploaded at once`,
      },
      { status: 400 },
    )
  }

  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: `${file.name} is not a valid image` },
        { status: 400 },
      )
    }

    if (file.size === 0) {
      return NextResponse.json({ error: `${file.name} is empty` }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `${file.name} exceeds the 15 MB file limit`,
        },
        { status: 400 },
      )
    }
  }

  // Confirm that the submitted category really exists.
  const { data: existingCategory, error: categoryError } = await getSupabaseAdmin()
    .from('categories')
    .select('key')
    .eq('key', category)
    .maybeSingle()

  if (categoryError) {
    console.error('Category validation failed:', {
      message: categoryError.message,
      code: categoryError.code,
      details: categoryError.details,
    })

    return NextResponse.json(
      { error: 'Could not validate the selected category' },
      { status: 500 },
    )
  }

  if (!existingCategory) {
    return NextResponse.json(
      { error: 'The selected category does not exist' },
      { status: 400 },
    )
  }

  const title = getOptionalString(formData, 'title')
  const location = getOptionalString(formData, 'location')
  const date = getOptionalString(formData, 'date')

  let originalNames: string[] = []

  const originalNamesValue = formData.get('originalNames')

  if (typeof originalNamesValue === 'string') {
    try {
      const parsedValue = JSON.parse(originalNamesValue)

      if (
        Array.isArray(parsedValue) &&
        parsedValue.every((value) => typeof value === 'string')
      ) {
        originalNames = parsedValue
      }
    } catch {
      originalNames = []
    }
  }

  const uploadedPaths: string[] = []
  const insertedPhotoIds: string[] = []

  try {
    for (const [index, file] of files.entries()) {
      const safeName = cleanFileName(file.name) || `photo-${crypto.randomUUID()}.webp`

      const storagePath = `uploads/${crypto.randomUUID()}-${safeName}`

      const { error: uploadError } = await getSupabaseAdmin()
        .storage.from('photos')
        .upload(storagePath, file, {
          contentType: file.type,
          cacheControl: '31536000',
          upsert: false,
        })

      if (uploadError) {
        throw new Error(
          `Storage upload failed for ${file.name}: ${uploadError.message}`,
        )
      }

      uploadedPaths.push(storagePath)

      const originalName = originalNames[index]?.trim() || file.name

      const fallbackTitle = originalName.replace(/\.[^/.]+$/, '')

      const { data: insertedPhoto, error: insertError } = await getSupabaseAdmin()
        .from('photos')
        .insert({
          name: originalName,
          storage_path: storagePath,
          category,
          title: title || fallbackTitle,
          location,
          date,
        })
        .select('id')
        .single()

      if (insertError) {
        throw new Error(
          `Database insert failed for ${originalName}: ${insertError.message}`,
        )
      }

      insertedPhotoIds.push(insertedPhoto.id)
    }

    return NextResponse.json(
      {
        success: true,
        uploadedCount: insertedPhotoIds.length,
      },
      { status: 201 },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed'

    console.error('Gallery upload failed:', message)

    // Remove database rows created earlier in this request.
    if (insertedPhotoIds.length > 0) {
      const { error: cleanupDatabaseError } = await getSupabaseAdmin()
        .from('photos')
        .delete()
        .in('id', insertedPhotoIds)

      if (cleanupDatabaseError) {
        console.error('Upload database cleanup failed:', cleanupDatabaseError.message)
      }
    }

    // Remove Storage files created earlier in this request.
    if (uploadedPaths.length > 0) {
      const { error: cleanupStorageError } = await getSupabaseAdmin()
        .storage.from('photos')
        .remove(uploadedPaths)

      if (cleanupStorageError) {
        console.error('Upload Storage cleanup failed:', cleanupStorageError.message)
      }
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
