import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/adminAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

type CreateCategoryBody = {
  label?: unknown
}

function createCategoryKey(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9åäö-]/gi, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: CreateCategoryBody

  try {
    body = (await request.json()) as CreateCategoryBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (typeof body.label !== 'string') {
    return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
  }

  const label = body.label.trim()

  if (label.length < 2) {
    return NextResponse.json(
      { error: 'Category name must contain at least 2 characters' },
      { status: 400 },
    )
  }

  if (label.length > 40) {
    return NextResponse.json(
      { error: 'Category name may contain at most 40 characters' },
      { status: 400 },
    )
  }

  const key = createCategoryKey(label)

  if (!key) {
    return NextResponse.json({ error: 'Category name is invalid' }, { status: 400 })
  }

  if (key === 'okategoriserad') {
    return NextResponse.json({ error: 'That category is reserved' }, { status: 400 })
  }

  const { data: existingCategory, error: lookupError } = await getSupabaseAdmin()
    .from('categories')
    .select('key')
    .eq('key', key)
    .maybeSingle()

  if (lookupError) {
    console.error('Category lookup failed:', lookupError.message)

    return NextResponse.json({ error: 'Could not validate category' }, { status: 500 })
  }

  if (existingCategory) {
    return NextResponse.json({ error: 'Kategorin finns redan' }, { status: 409 })
  }

  const { data: category, error: insertError } = await getSupabaseAdmin()
    .from('categories')
    .insert({
      key,
      label,
    })
    .select('*')
    .single()

  if (insertError) {
    console.error('Category creation failed:', insertError.message)

    return NextResponse.json({ error: 'Could not create category' }, { status: 500 })
  }

  return NextResponse.json(
    {
      success: true,
      category,
    },
    { status: 201 },
  )
}
