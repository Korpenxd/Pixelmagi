import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/adminAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

type UpdatePhotoBody = {
  category?: unknown
  location?: unknown
  date?: unknown
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params

  if (!id) {
    return NextResponse.json({ error: 'Photo ID is required' }, { status: 400 })
  }

  let body: UpdatePhotoBody

  try {
    body = (await request.json()) as UpdatePhotoBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (typeof body.category !== 'string' || body.category.trim().length === 0) {
    return NextResponse.json({ error: 'A valid category is required' }, { status: 400 })
  }

  if (
    body.location !== null &&
    body.location !== undefined &&
    typeof body.location !== 'string'
  ) {
    return NextResponse.json({ error: 'Invalid location' }, { status: 400 })
  }

  if (body.date !== null && body.date !== undefined && typeof body.date !== 'string') {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
  }

  // Confirm the selected category actually exists.
  const { data: category, error: categoryError } = await getSupabaseAdmin()
    .from('categories')
    .select('key')
    .eq('key', body.category)
    .maybeSingle()

  if (categoryError) {
    console.error('Category lookup failed:', categoryError.message)

    return NextResponse.json({ error: 'Could not validate category' }, { status: 500 })
  }

  if (!category) {
    return NextResponse.json({ error: 'Category does not exist' }, { status: 400 })
  }

  const location =
    typeof body.location === 'string' && body.location.trim()
      ? body.location.trim()
      : null

  const date = typeof body.date === 'string' && body.date ? body.date : null

  const { data, error } = await getSupabaseAdmin()
    .from('photos')
    .update({
      category: body.category,
      location,
      date,
    })
    .eq('id', id)
    .select('*')
    .maybeSingle()

  if (error) {
    console.error('Photo update failed:', error.message)

    return NextResponse.json({ error: 'Could not update photo' }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    photo: data,
  })
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params

  if (!id) {
    return NextResponse.json({ error: 'Photo ID is required' }, { status: 400 })
  }

  // First retrieve the Storage path belonging to this photo.
  const { data: photo, error: findError } = await getSupabaseAdmin()
    .from('photos')
    .select('id, storage_path')
    .eq('id', id)
    .maybeSingle()

  if (findError) {
    console.error('Photo lookup failed:', findError.message)

    return NextResponse.json({ error: 'Could not find photo' }, { status: 500 })
  }

  if (!photo) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
  }

  // Remove the actual image from Supabase Storage.
  const { error: storageError } = await getSupabaseAdmin()
    .storage.from('photos')
    .remove([photo.storage_path])

  if (storageError) {
    console.error('Storage deletion failed:', storageError.message)

    return NextResponse.json(
      { error: 'Could not delete stored image' },
      { status: 500 },
    )
  }

  // Remove the corresponding database row.
  const { error: databaseError } = await getSupabaseAdmin()
    .from('photos')
    .delete()
    .eq('id', id)

  if (databaseError) {
    console.error('Database deletion failed:', databaseError.message)

    return NextResponse.json(
      { error: 'Could not delete photo record' },
      { status: 500 },
    )
  }

  return NextResponse.json({
    success: true,
  })
}
