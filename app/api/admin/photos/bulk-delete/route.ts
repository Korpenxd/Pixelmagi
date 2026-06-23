import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/adminAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

type BulkDeleteBody = {
  photoIds?: unknown
}

export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: BulkDeleteBody

  try {
    body = (await request.json()) as BulkDeleteBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (
    !Array.isArray(body.photoIds) ||
    body.photoIds.length === 0 ||
    !body.photoIds.every(
      (photoId) => typeof photoId === 'string' && photoId.trim().length > 0,
    )
  ) {
    return NextResponse.json(
      { error: 'A valid list of photo IDs is required' },
      { status: 400 },
    )
  }

  // Remove duplicate IDs.
  const photoIds = [...new Set(body.photoIds)]

  // Safety limit for one request.
  if (photoIds.length > 100) {
    return NextResponse.json(
      { error: 'A maximum of 100 photos can be deleted at once' },
      { status: 400 },
    )
  }

  // Find the selected photos and their Storage paths.
  const { data: photos, error: lookupError } = await getSupabaseAdmin()
    .from('photos')
    .select('id, storage_path')
    .in('id', photoIds)

  if (lookupError) {
    console.error('Bulk photo lookup failed:', lookupError.message)

    return NextResponse.json(
      { error: 'Could not load the selected photos' },
      { status: 500 },
    )
  }

  if (!photos || photos.length === 0) {
    return NextResponse.json(
      { error: 'No matching photos were found' },
      { status: 404 },
    )
  }

  const storagePaths = photos
    .map((photo) => photo.storage_path)
    .filter((path): path is string => typeof path === 'string' && path.length > 0)

  // Delete the actual image files first.
  if (storagePaths.length > 0) {
    const { error: storageError } = await getSupabaseAdmin()
      .storage.from('photos')
      .remove(storagePaths)

    if (storageError) {
      console.error('Bulk Storage deletion failed:', storageError.message)

      return NextResponse.json(
        { error: 'Could not delete the stored image files' },
        { status: 500 },
      )
    }
  }

  const foundPhotoIds = photos.map((photo) => photo.id)

  // Delete the database rows.
  const { error: databaseError } = await getSupabaseAdmin()
    .from('photos')
    .delete()
    .in('id', foundPhotoIds)

  if (databaseError) {
    console.error('Bulk database deletion failed:', databaseError.message)

    return NextResponse.json(
      { error: 'Could not delete the photo records' },
      { status: 500 },
    )
  }

  return NextResponse.json({
    success: true,
    deletedCount: foundPhotoIds.length,
  })
}
