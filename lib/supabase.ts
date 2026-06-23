import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null

export type Photo = {
  id: string
  name: string
  storage_path: string
  url: string
  category: string
  title: string | null
  location: string | null
  date: string | null
  created_at: string
  is_hero: boolean
}

type PhotoRow = Omit<Photo, 'url'>

export type Category = {
  id: string
  key: string
  label: string
  created_at: string
}

export type Service = {
  id: string
  title: string
  description: string
  price: string
  image_path: string
  image_url: string
  button_label: string
  sort_order: number
  created_at: string
  updated_at: string
}

type ServiceRow = Omit<Service, 'image_url'>

function toPhoto(row: PhotoRow): Photo {
  const publicUrl = supabase
    ? supabase.storage.from('photos').getPublicUrl(row.storage_path).data.publicUrl
    : ''

  return {
    ...row,
    url: publicUrl,
  }
}

function toService(row: ServiceRow): Service {
  const imageUrl =
    row.image_path.startsWith('/') || row.image_path.startsWith('http')
      ? row.image_path
      : supabase
        ? supabase.storage.from('photos').getPublicUrl(row.image_path).data.publicUrl
        : ''

  return {
    ...row,
    image_url: imageUrl,
  }
}

function warnMissingConfiguration() {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      'Supabase is not configured. The site will use local demo content where available.',
    )
  }
}

export async function getPhotos(): Promise<Photo[]> {
  if (!supabase) {
    warnMissingConfiguration()
    return []
  }

  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Could not load photos:', error.message)
    return []
  }

  return (data as PhotoRow[]).map(toPhoto)
}

export async function getLatestPhotos(limit = 8): Promise<Photo[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Could not load latest photos:', error.message)
    return []
  }

  return (data as PhotoRow[]).map(toPhoto)
}

export async function getPhotosByCategory(category: string): Promise<Photo[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('category', category)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Could not load category photos:', error.message)
    return []
  }

  return (data as PhotoRow[]).map(toPhoto)
}

export async function getHeroImagePath(): Promise<string | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'hero_image_path')
    .maybeSingle()

  if (error) {
    console.error('Failed to fetch hero setting:', error.message)
    return null
  }

  return typeof data?.value === 'string' ? data.value : null
}

export async function getHeroImageUrl(): Promise<string | null> {
  const path = await getHeroImagePath()

  if (!path || !supabase) return null

  return supabase.storage.from('photos').getPublicUrl(path).data.publicUrl || null
}

export async function getStorageUsage() {
  if (!supabase) return null

  const { data, error } = await supabase.rpc('get_photos_storage_usage')

  if (error) {
    console.error('Storage usage failed:', error.message)
    return null
  }

  return data?.[0] ?? null
}

export async function getCategories(): Promise<Category[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('label', { ascending: true })

  if (error) {
    console.error('Could not load categories:', error.message)
    return []
  }

  return data as Category[]
}

export async function getServices(): Promise<Service[]> {
  if (!supabase) {
    warnMissingConfiguration()
    return []
  }

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Could not load services:', error.message)
    return []
  }

  return (data as ServiceRow[]).map(toService)
}
