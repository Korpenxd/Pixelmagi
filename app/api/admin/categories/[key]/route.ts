import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/adminAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

type RouteContext = {
  params: Promise<{
    key: string
  }>
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { key } = await context.params
  const categoryKey = decodeURIComponent(key).trim()

  if (!categoryKey) {
    return NextResponse.json({ error: 'Category key is required' }, { status: 400 })
  }

  if (categoryKey === 'okategoriserad') {
    return NextResponse.json(
      { error: 'Okategoriserad cannot be deleted' },
      { status: 400 },
    )
  }

  const { data: category, error: lookupError } = await getSupabaseAdmin()
    .from('categories')
    .select('key, label')
    .eq('key', categoryKey)
    .maybeSingle()

  if (lookupError) {
    console.error('Category lookup failed:', {
      message: lookupError.message,
      code: lookupError.code,
      details: lookupError.details,
    })

    return NextResponse.json({ error: 'Could not validate category' }, { status: 500 })
  }

  if (!category) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 })
  }

  // Move all photos out of the category before deleting it.
  const { error: moveError } = await getSupabaseAdmin()
    .from('photos')
    .update({
      category: 'okategoriserad',
    })
    .eq('category', categoryKey)

  if (moveError) {
    console.error('Photo reassignment failed:', {
      message: moveError.message,
      code: moveError.code,
      details: moveError.details,
    })

    return NextResponse.json(
      { error: 'Could not move photos to Okategoriserad' },
      { status: 500 },
    )
  }

  const { error: deleteError } = await getSupabaseAdmin()
    .from('categories')
    .delete()
    .eq('key', categoryKey)

  if (deleteError) {
    console.error('Category deletion failed:', {
      message: deleteError.message,
      code: deleteError.code,
      details: deleteError.details,
    })

    return NextResponse.json({ error: 'Could not delete category' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    deletedCategory: category,
  })
}
