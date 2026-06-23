'use client'

import { useEffect, useRef, useState } from 'react'
import {
  type Photo,
  getPhotos,
  getStorageUsage,
  getCategories,
  getHeroImageUrl,
  type Category,
} from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import ServiceManager from '@/components/ServiceManager'
import { compressImage } from '@/lib/compressImage'
import styles from './AdminDashboard.module.css'


function LocalFilePreview({
  file,
}: {
  file: File
}) {
  const [previewUrl, setPreviewUrl] =
    useState<string | null>(null)

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file)

    setPreviewUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [file])

  if (!previewUrl) {
    return (
      <div
        aria-hidden="true"
        style={{
          width: '100%',
          height: '100%',
          background: 'var(--admin-media)',
        }}
      />
    )
  }

  return (
    // Local blob URLs cannot be optimized by next/image.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={previewUrl}
      alt={file.name}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        objectFit: 'cover',
      }}
    />
  )
}

export default function AdminDashboard() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([])
  const [deletingSelected, setDeletingSelected] = useState(false)

  const [categories, setCategories] = useState<Category[]>([])
  const [category, setCategory] = useState('okategoriserad')
  const [newCategoryLabel, setNewCategoryLabel] = useState('')
  const [categoryLoading, setCategoryLoading] = useState(false)

  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [date, setDate] = useState('')
  const [storageUsage, setStorageUsage] = useState<{
    total_bytes: number
    total_mb: number
    file_count: number
  } | null>(null)

  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [savingHero, setSavingHero] = useState(false)
  const heroFileInputRef = useRef<HTMLInputElement | null>(null)

  const [heroFile, setHeroFile] = useState<File | null>(null)
  const [heroPreviewUrl, setHeroPreviewUrl] = useState<string | null>(null)
  const [currentHeroUrl, setCurrentHeroUrl] = useState<string | null>(null)

  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null)
  const [editCategory, setEditCategory] = useState('okategoriserad')
  const [editLocation, setEditLocation] = useState('')
  const [editDate, setEditDate] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  const STORAGE_LIMIT_MB = 500
  const usedMb = storageUsage?.total_mb ?? 0
  const remainingMb = STORAGE_LIMIT_MB - usedMb
  const usedPercent = Math.min((usedMb / STORAGE_LIMIT_MB) * 100, 100)

  const router = useRouter()

  useEffect(() => {
    loadPhotos()
    loadHeroImage()
    // Run once when the admin dashboard mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadHeroImage() {
    const url = await getHeroImageUrl()
    setCurrentHeroUrl(url)
  }

  function selectHeroFile(file: File | null) {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Välj en bildfil.')
      return
    }

    if (file.size > 15 * 1024 * 1024) {
      alert('Hero-bilden får vara högst 15 MB.')
      return
    }

    if (heroPreviewUrl) {
      URL.revokeObjectURL(heroPreviewUrl)
    }

    setHeroFile(file)
    setHeroPreviewUrl(URL.createObjectURL(file))
  }

  async function loadPhotos() {
    setLoading(true)

    const [photoData, usageData, categoryData] = await Promise.all([
      getPhotos(),
      getStorageUsage(),
      getCategories(),
    ])

    setPhotos(photoData)
    setStorageUsage(usageData)
    setCategories(categoryData)

    if (categoryData.length > 0) {
      const categoryStillExists = categoryData.some((cat) => cat.key === category)

      if (!categoryStillExists) {
        setCategory(categoryData[0].key)
      }
    }

    setLoading(false)
  }

  async function handleLogout() {
    const res = await fetch('/api/admin/logout', {
      method: 'POST',
    })

    if (!res.ok) {
      console.error('Logout failed')
      return
    }

    router.refresh()
  }

  async function uploadFiles(files: File[]) {
    if (!files.length) {
      return
    }

    if (!category) {
      alert('Välj en kategori.')
      return
    }

    setUploading(true)

    try {
      const compressedFiles: File[] = []
      const originalNames: string[] = []

      for (const originalFile of files) {
        if (!originalFile.type.startsWith('image/')) {
          console.warn(`${originalFile.name} is not an image`)
          continue
        }

        try {
          const compressedFile = await compressImage(originalFile, {
            maxWidth: 2000,
            maxHeight: 2000,
            quality: 0.84,
            outputType: 'image/webp',
          })

          compressedFiles.push(compressedFile)
          originalNames.push(originalFile.name)
        } catch (error) {
          console.error(`Could not compress ${originalFile.name}:`, error)

          throw new Error(`Kunde inte komprimera ${originalFile.name}`)
        }
      }

      if (compressedFiles.length === 0) {
        throw new Error('Inga giltiga bilder kunde bearbetas.')
      }

      const formData = new FormData()

      for (const compressedFile of compressedFiles) {
        formData.append('files', compressedFile)
      }

      formData.append('originalNames', JSON.stringify(originalNames))

      formData.append('category', category)
      formData.append('title', title)
      formData.append('location', location)
      formData.append('date', date)

      const response = await fetch('/api/admin/photos/upload', {
        method: 'POST',
        credentials: 'same-origin',
        body: formData,
      })

      const responseText = await response.text()

      let result: {
        success?: boolean
        uploadedCount?: number
        error?: string
      } | null = null

      if (responseText) {
        try {
          result = JSON.parse(responseText)
        } catch {
          result = null
        }
      }

      if (!response.ok) {
        throw new Error(result?.error || `Upload failed with status ${response.status}`)
      }

      setTitle('')
      setLocation('')
      setDate('')
      setSelectedFiles([])

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      await loadPhotos()

      console.log(`${result?.uploadedCount ?? compressedFiles.length} photos uploaded`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown upload error'

      console.error('Gallery upload failed:', message)
      alert(`Kunde inte ladda upp fotona: ${message}`)
    } finally {
      setUploading(false)
    }
  }

  async function deletePhoto(photo: Photo) {
    const confirmed = window.confirm(`Radera "${photo.title || photo.name}"?`)

    if (!confirmed) return

    try {
      const response = await fetch(
        `/api/admin/photos/${encodeURIComponent(photo.id)}`,
        {
          method: 'DELETE',
          credentials: 'same-origin',
        },
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Delete failed')
      }

      setSelectedPhotoIds((current) => current.filter((id) => id !== photo.id))

      await loadPhotos()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'

      console.error('Photo delete failed:', message)
      alert(`Kunde inte radera fotot: ${message}`)
    }
  }

  function startEditing(photo: Photo) {
    setEditingPhotoId(photo.id)
    setEditCategory(photo.category)
    setEditLocation(photo.location || '')
    setEditDate(photo.date || '')
  }

  function cancelEditing() {
    setEditingPhotoId(null)
    setEditCategory(categories[0]?.key || 'okategoriserad')
    setEditLocation('')
    setEditDate('')
  }

  async function saveHeroPhoto() {
    if (!heroFile) {
      alert('Välj en hero-bild först.')
      return
    }

    const confirmed = window.confirm('Vill du ersätta den nuvarande hero-bilden?')

    if (!confirmed) return

    setSavingHero(true)

    try {
      const compressedHero = await compressImage(heroFile, {
        maxWidth: 2560,
        maxHeight: 2560,
        quality: 0.88,
        outputType: 'image/webp',
      })

      const formData = new FormData()
      formData.append('file', compressedHero)

      const response = await fetch('/api/admin/hero', {
        method: 'POST',
        credentials: 'same-origin',
        body: formData,
      })

      const responseText = await response.text()

      let result: {
        success?: boolean
        path?: string
        url?: string
        error?: string
      } | null = null

      if (responseText) {
        try {
          result = JSON.parse(responseText)
        } catch {
          result = null
        }
      }

      if (!response.ok) {
        throw new Error(
          result?.error || `Hero replacement failed with status ${response.status}`,
        )
      }

      setHeroFile(null)

      if (heroPreviewUrl) {
        URL.revokeObjectURL(heroPreviewUrl)
      }

      setHeroPreviewUrl(null)

      if (heroFileInputRef.current) {
        heroFileInputRef.current.value = ''
      }

      if (result?.url) {
        setCurrentHeroUrl(result.url)
      } else {
        await loadHeroImage()
      }

      await loadPhotos()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown hero replacement error'

      console.error('Hero replacement failed:', message)

      alert(`Kunde inte uppdatera hero-bilden: ${message}`)
    } finally {
      setSavingHero(false)
    }
  }

  async function savePhotoEdit(photoId: string) {
    setSavingEdit(true)

    try {
      const response = await fetch(`/api/admin/photos/${encodeURIComponent(photoId)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: editCategory,
          location: editLocation || null,
          date: editDate || null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Update failed')
      }

      cancelEditing()
      await loadPhotos()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown update error'

      console.error('Photo update failed:', message)
      alert(`Kunde inte uppdatera fotot: ${message}`)
    } finally {
      setSavingEdit(false)
    }
  }

  function togglePhotoSelection(photoId: string) {
    setSelectedPhotoIds((current) =>
      current.includes(photoId)
        ? current.filter((id) => id !== photoId)
        : [...current, photoId],
    )
  }

  function clearSelection() {
    setSelectedPhotoIds([])
  }

  async function deleteSelectedPhotos() {
    if (selectedPhotoIds.length === 0) {
      return
    }

    const confirmed = window.confirm(
      `Vill du radera ${selectedPhotoIds.length} markerade foton?`,
    )

    if (!confirmed) return

    setDeletingSelected(true)

    try {
      const response = await fetch('/api/admin/photos/bulk-delete', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photoIds: selectedPhotoIds,
        }),
      })

      const responseText = await response.text()

      let result: {
        success?: boolean
        deletedCount?: number
        error?: string
      } | null = null

      if (responseText) {
        try {
          result = JSON.parse(responseText)
        } catch {
          result = null
        }
      }

      if (!response.ok) {
        throw new Error(
          result?.error || `Bulk deletion failed with status ${response.status}`,
        )
      }

      setSelectedPhotoIds([])

      await loadPhotos()

      console.log(`${result?.deletedCount ?? selectedPhotoIds.length} photos deleted`)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown bulk deletion error'

      console.error('Bulk deletion failed:', message)

      alert(`Kunde inte radera fotona: ${message}`)
    } finally {
      setDeletingSelected(false)
    }
  }

  function addSelectedFiles(files: File[]) {
    const imageFiles = files.filter((file) => file.type.startsWith('image/'))

    setSelectedFiles((current) => [...current, ...imageFiles])
  }

  function removeSelectedFile(indexToRemove: number) {
    setSelectedFiles((current) => current.filter((_, index) => index !== indexToRemove))
  }

  function clearSelectedFiles() {
    setSelectedFiles([])
  }

  async function handleAddCategory() {
    const label = newCategoryLabel.trim()

    if (!label) {
      alert('Skriv ett kategorinamn.')
      return
    }

    setCategoryLoading(true)

    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          label,
        }),
      })

      const responseText = await response.text()

      let result: {
        success?: boolean
        category?: {
          key: string
          label: string
        }
        error?: string
      } | null = null

      if (responseText) {
        try {
          result = JSON.parse(responseText)
        } catch {
          result = null
        }
      }

      if (!response.ok) {
        throw new Error(
          result?.error || `Category creation failed with status ${response.status}`,
        )
      }

      setNewCategoryLabel('')

      await loadPhotos()

      if (result?.category?.key) {
        setCategory(result.category.key)
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown category creation error'

      console.error('Category creation failed:', message)

      alert(`Kunde inte lägga till kategorin: ${message}`)
    } finally {
      setCategoryLoading(false)
    }
  }

  async function handleDeleteCategory(key: string, label: string) {
    if (key === 'okategoriserad') {
      alert('Okategoriserad kan inte raderas.')
      return
    }

    const confirmed = window.confirm(
      `Radera kategorin "${label}"? Foton i kategorin flyttas till Okategoriserad.`,
    )

    if (!confirmed) return

    setCategoryLoading(true)

    try {
      const response = await fetch(`/api/admin/categories/${encodeURIComponent(key)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })

      const responseText = await response.text()

      let result: {
        success?: boolean
        deletedCategory?: {
          key: string
          label: string
        }
        error?: string
      } | null = null

      if (responseText) {
        try {
          result = JSON.parse(responseText)
        } catch {
          result = null
        }
      }

      if (!response.ok) {
        throw new Error(
          result?.error || `Category deletion failed with status ${response.status}`,
        )
      }

      // Avoid keeping a deleted category selected in the upload form.
      if (category === key) {
        setCategory('okategoriserad')
      }

      // Avoid keeping a deleted category selected in the edit form.
      if (editCategory === key) {
        setEditCategory('okategoriserad')
      }

      await loadPhotos()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown category deletion error'

      console.error('Category deletion failed:', message)

      alert(`Kunde inte radera kategorin: ${message}`)
    } finally {
      setCategoryLoading(false)
    }
  }

  function getCategoryLabel(key: string) {
    return categories.find((cat) => cat.key === key)?.label || key
  }

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div
          className={styles.container}
          style={{ maxWidth: '1100px', margin: '0 auto' }}
        >
          <header
            className={styles.header}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: '1rem',
              marginBottom: '3rem',
              flexWrap: 'wrap',
            }}
          >
          <div className={styles.headerCopy}>
            <p className={styles.eyebrow}>
              Pixelmagi Studio
            </p>

            <h1 className={styles.title}>
              Dashboard
            </h1>

            <p className={styles.intro}>
              Hantera bilder, kategorier, startsidans hero och
              tjänstekorten från samma plats.
            </p>
          </div>


            {storageUsage && (
              <div
                className={styles.storagePanel}
                style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  border: '1px solid var(--admin-line)',
                  background: 'var(--admin-surface)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem',
                    gap: '1rem',
                    color: 'var(--admin-muted)',
                    fontSize: '0.85rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <span> {storageUsage.total_mb} MB använt</span>
                  <span> {remainingMb.toFixed(2)} MB kvar</span>
                </div>

                <div
                  style={{
                    height: '6px',
                    background: 'var(--admin-surface-muted)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${usedPercent}%`,
                      background: 'var(--admin-gold)',
                    }}
                  />
                </div>
              </div>
            )}

            <button
              className={styles.headerButton}
              type="button"
              onClick={loadPhotos}
              style={{
                background: 'transparent',
                color: 'var(--admin-muted)',
                border: '1px solid var(--admin-line-strong)',
                padding: '0.8rem 1rem',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                fontSize: '0.72rem',
              }}
            >
              Uppdatera
            </button>
            <button
              type="button"
              onClick={handleLogout}
              style={{
                background: 'transparent',
                color: 'var(--admin-danger)',
                border: '1px solid var(--admin-danger-line)',
                padding: '0.8rem 1rem',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                fontSize: '0.72rem',
              }}
            >
              Logga ut
            </button>
          </header>

          <section
            style={{
              border: '1px solid var(--admin-line)',
              background: 'var(--admin-surface)',
              padding: 'clamp(1.25rem, 4vw, 2rem)',
              marginBottom: '3rem',
            }}
          >
            <h2
              style={{
                fontWeight: 300,
                fontSize: '1.4rem',
                marginTop: 0,
                marginBottom: '1.5rem',
              }}
            >
              Ladda upp nya foton
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <span
                  style={{
                    color: 'var(--admin-muted)',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                  }}
                >
                  Kategori
                </span>

                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={inputStyle}
                  disabled={categories.length === 0}
                >
                  {categories.length === 0 ? (
                    <option value="">Inga kategorier</option>
                  ) : (
                    categories.map((cat) => (
                      <option key={cat.key} value={cat.key}>
                        {cat.label}
                      </option>
                    ))
                  )}
                </select>
              </label>

              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <span
                  style={{
                    color: 'var(--admin-muted)',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                  }}
                >
                  Titel
                </span>

                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Valfritt"
                  style={inputStyle}
                />
              </label>

              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <span
                  style={{
                    color: 'var(--admin-muted)',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                  }}
                >
                  Plats
                </span>

                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Valfritt"
                  style={inputStyle}
                />
              </label>

              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <span
                  style={{
                    color: 'var(--admin-muted)',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                  }}
                >
                  Datum
                </span>

                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={inputStyle}
                />
              </label>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragActive(true)
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragActive(false)
                addSelectedFiles(Array.from(e.dataTransfer.files))
              }}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: dragActive
                  ? '1px solid var(--admin-gold)'
                  : '1px dashed var(--admin-line-strong)',
                background: dragActive ? 'var(--admin-gold-soft)' : 'var(--admin-bg)',
                padding: 'clamp(2rem, 6vw, 4rem)',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'border 0.2s, background 0.2s',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  addSelectedFiles(Array.from(e.target.files ?? []))
                  e.target.value = ''
                }}
              />

              <p
                style={{
                  margin: 0,
                  fontSize: 'clamp(1.1rem, 3vw, 1.8rem)',
                  fontWeight: 300,
                }}
              >
                {uploading ? 'Laddar...' : 'Släpp foton här'}
              </p>

              <p style={{ color: 'var(--admin-soft)', marginBottom: 0 }}>
                eller klicka för att välja filer <br /> (max {remainingMb.toFixed(2)} MB
                kvar)
              </p>
            </div>
            {selectedFiles.length > 0 && (
              <div
                style={{
                  marginTop: '1.5rem',
                  border: '1px solid var(--admin-line)',
                  background: 'var(--admin-bg)',
                  padding: '1rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    marginBottom: '1rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      color: 'var(--admin-muted)',
                      fontSize: '0.85rem',
                    }}
                  >
                    {selectedFiles.length} foton valda
                  </p>

                  <button
                    type="button"
                    onClick={clearSelectedFiles}
                    disabled={uploading}
                    style={{
                      background: 'transparent',
                      color: 'var(--admin-muted)',
                      border: '1px solid var(--admin-line-strong)',
                      padding: '0.65rem 0.85rem',
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      fontSize: '0.68rem',
                      opacity: uploading ? 0.6 : 1,
                    }}
                  >
                    Rensa
                  </button>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fill, minmax(min(100%, 220px), 1fr))',
                    gap: '0.75rem',
                    marginBottom: '1rem',
                  }}
                >
                  {selectedFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      style={{
                        border: '1px solid var(--admin-line)',
                        background: 'var(--admin-surface)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          aspectRatio: '4 / 3',
                          background: '#0b0b0b',
                          overflow: 'hidden',
                        }}
                      >
                        <LocalFilePreview file={file} />
                      </div>

                      <div style={{ padding: '0.65rem' }}>
                        <p
                          style={{
                            margin: '0 0 0.5rem',
                            color: 'var(--admin-muted)',
                            fontSize: '0.72rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={file.name}
                        >
                          {file.name}
                        </p>

                        <button
                          type="button"
                          onClick={() => removeSelectedFile(index)}
                          disabled={uploading}
                          style={{
                            width: '100%',
                            background: 'transparent',
                            color: 'var(--admin-danger)',
                            border: '1px solid var(--admin-danger-line)',
                            padding: '0.5rem',
                            cursor: uploading ? 'not-allowed' : 'pointer',
                            textTransform: 'uppercase',
                            letterSpacing: '0.12em',
                            fontSize: '0.65rem',
                            opacity: uploading ? 0.6 : 1,
                          }}
                        >
                          Ta bort
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => uploadFiles(selectedFiles)}
                  disabled={uploading || selectedFiles.length === 0}
                  style={{
                    width: '100%',
                    background: 'var(--admin-gold)',
                    color: 'var(--admin-on-gold)',
                    border: 'none',
                    padding: '0.9rem 1rem',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    fontSize: '0.75rem',
                    opacity: uploading ? 0.6 : 1,
                  }}
                >
                  {uploading ? 'Laddar upp...' : 'Ladda upp valda foton'}
                </button>
              </div>
            )}
          </section>

          <div
            className={styles.managementGrid}
            style={{
              display: 'grid',
              gap: '1rem',
              alignItems: 'stretch',
              marginBottom: '3rem',
            }}
          >
            {/* Category management */}
            <section
              className={styles.categoryPanel}
              style={{
                border: '1px solid var(--admin-line)',
                background: 'var(--admin-surface)',
                padding: 'clamp(1.25rem, 4vw, 2rem)',
              }}
            >
              <h2
                style={{
                  fontWeight: 300,
                  fontSize: '1.4rem',
                  marginTop: 0,
                  marginBottom: '1.5rem',
                }}
              >
                Kategorier
              </h2>

              <div
                className={styles.categoryForm}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  marginBottom: '1.5rem',
                  flexWrap: 'wrap',
                }}
              >
                <input
                  className={styles.categoryInput}
                  value={newCategoryLabel}
                  onChange={(e) => setNewCategoryLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddCategory()
                    }
                  }}
                  placeholder="Ny kategori"
                  style={{
                    ...inputStyle,
                    flex: '1 1 220px',
                  }}
                />

                <button
                  className={styles.categoryAddButton}
                  type="button"
                  onClick={handleAddCategory}
                  disabled={categoryLoading || !newCategoryLabel.trim()}
                  style={{
                    background: 'var(--admin-gold)',
                    color: 'var(--admin-on-gold)',
                    border: 'none',
                    padding: '0.8rem 1rem',
                    cursor: categoryLoading ? 'not-allowed' : 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    fontSize: '0.72rem',
                    opacity: categoryLoading || !newCategoryLabel.trim() ? 0.6 : 1,
                  }}
                >
                  Lägg till
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                {categories.map((cat) => (
                  <div
                    key={cat.key}
                    className={styles.categoryChip}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      border: '1px solid var(--admin-line-strong)',
                      padding: '0.65rem 0.85rem',
                      background: 'var(--admin-bg)',
                      minWidth: 0,
                      maxWidth: '100%',
                    }}
                  >
                    <span
                      style={{
                        color: 'var(--admin-muted)',
                        fontSize: '0.8rem',
                        overflowWrap: 'anywhere',
                        minWidth: 0,
                      }}
                    >
                      {cat.label}
                    </span>

                    {cat.key !== 'okategoriserad' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.key, cat.label)}
                        disabled={categoryLoading}
                        aria-label={`Radera kategorin ${cat.label}`}
                        style={{
                          background: 'transparent',
                          color: 'var(--admin-danger)',
                          border: 'none',
                          cursor: categoryLoading ? 'not-allowed' : 'pointer',
                          fontSize: '1.1rem',
                          padding: '0.2rem 0.35rem',
                          flexShrink: 0,
                          minWidth: '32px',
                          minHeight: '32px',
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Hero editor */}
            <section
              className={styles.heroPanel}
              style={{
                border: '1px solid var(--admin-line)',
                background: 'var(--admin-surface)',
                padding: 'clamp(1rem, 4vw, 1.5rem)',
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
              }}
            >
              <h2
                style={{
                  fontWeight: 300,
                  fontSize: '1.1rem',
                  margin: '0 0 1rem',
                }}
              >
                Hero-bild
              </h2>

              <div
                className={styles.heroPreview}
                style={{
                  position: 'relative',
                  aspectRatio: '16 / 10',
                  width: '100%',
                  minHeight: 0,
                  overflow: 'hidden',
                  background: '#0b0b0b',
                  marginBottom: '1rem',
                }}
              >
                {heroPreviewUrl || currentHeroUrl ? (
                  // The source may be a temporary blob URL from a local file.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={heroPreviewUrl || currentHeroUrl || ''}
                    alt="Förhandsvisning av hero-bild"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'grid',
                      placeItems: 'center',
                      color: 'var(--admin-soft)',
                      fontSize: '0.75rem',
                      textAlign: 'center',
                      padding: '1rem',
                    }}
                  >
                    Ingen hero-bild vald
                  </div>
                )}

                {heroPreviewUrl && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '0.6rem',
                      left: '0.6rem',
                      background: 'rgba(0,0,0,0.75)',
                      color: '#fff',
                      padding: '0.4rem 0.55rem',
                      fontSize: '0.62rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}
                  >
                    Ny förhandsvisning
                  </span>
                )}
              </div>

              <input
                ref={heroFileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  selectHeroFile(e.target.files?.[0] || null)
                }}
              />

              <button
                type="button"
                onClick={() => heroFileInputRef.current?.click()}
                disabled={savingHero}
                style={{
                  width: '100%',
                  background: 'transparent',
                  color: 'var(--admin-muted)',
                  border: '1px solid var(--admin-line-strong)',
                  padding: '0.8rem',
                  cursor: savingHero ? 'not-allowed' : 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  fontSize: '0.7rem',
                  marginBottom: '0.75rem',
                  opacity: savingHero ? 0.6 : 1,
                }}
              >
                Välj ny bild
              </button>

              {heroFile && (
                <button
                  type="button"
                  onClick={saveHeroPhoto}
                  disabled={savingHero}
                  style={{
                    width: '100%',
                    marginTop: 'auto',
                    background: 'var(--admin-gold)',
                    color: 'var(--admin-on-gold)',
                    border: '1px solid var(--admin-gold)',
                    padding: '0.8rem',
                    cursor: savingHero ? 'not-allowed' : 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    fontSize: '0.7rem',
                    opacity: savingHero ? 0.6 : 1,
                  }}
                >
                  {savingHero ? 'Laddar upp...' : 'Spara hero-bild'}
                </button>
              )}
            </section>
          </div>

          <ServiceManager />

          <section className={styles.photoSection}>
            <div
              className={styles.photoListHeader}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.5rem',
              }}
            >
              <h2
                style={{
                  fontWeight: 300,
                  fontSize: '1.4rem',
                  margin: 0,
                }}
              >
                Nuvarande foton
              </h2>

              <div
                className={styles.photoListActions}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ color: 'var(--admin-soft)', fontSize: '0.85rem' }}>
                  {photos.length} foton
                </span>

                {selectedPhotoIds.length > 0 && (
                  <>
                    <span style={{ color: 'var(--admin-muted)', fontSize: '0.85rem' }}>
                      {selectedPhotoIds.length} markerade
                    </span>

                    <button
                      type="button"
                      onClick={clearSelection}
                      style={{
                        background: 'transparent',
                        color: 'var(--admin-muted)',
                        border: '1px solid var(--admin-line-strong)',
                        padding: '0.55rem 0.75rem',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                        fontSize: '0.68rem',
                      }}
                    >
                      Avmarkera
                    </button>

                    <button
                      type="button"
                      onClick={deleteSelectedPhotos}
                      disabled={deletingSelected}
                      style={{
                        background: 'transparent',
                        color: 'var(--admin-danger)',
                        border: '1px solid var(--admin-danger-line)',
                        padding: '0.55rem 0.75rem',
                        cursor: deletingSelected ? 'not-allowed' : 'pointer',
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                        fontSize: '0.68rem',
                        opacity: deletingSelected ? 0.6 : 1,
                      }}
                    >
                      {deletingSelected ? 'Raderar...' : 'Radera markerade'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {loading ? (
              <p style={{ color: 'var(--admin-muted)' }}>Laddar foton...</p>
            ) : photos.length === 0 ? (
              <p style={{ color: 'var(--admin-muted)' }}>Inga foton laddade ännu.</p>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fill, minmax(min(100%, 220px), 1fr))',
                  gap: '1rem',
                }}
              >
                {photos.map((photo) => (
                  <article
                    key={photo.id}
                    style={{
                      background: 'var(--admin-surface)',
                      border: '1px solid var(--admin-line)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        aspectRatio: '4 / 3',
                        background: '#0b0b0b',
                        overflow: 'hidden',
                      }}
                    >
                      <label
                        style={{
                          position: 'absolute',
                          top: '0.75rem',
                          left: '0.75rem',
                          zIndex: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          background: 'rgba(0,0,0,0.7)',
                          color: '#fff',
                          padding: '0.45rem 0.55rem',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPhotoIds.includes(photo.id)}
                          onChange={() => togglePhotoSelection(photo.id)}
                        />
                        Markera
                      </label>
                      {/* Admin thumbnails favor immediate previews over image optimization. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt={photo.title || photo.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    </div>

                    <div
                      style={{
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1,
                      }}
                    >
                      <h3
                        style={{
                          fontSize: '1rem',
                          fontWeight: 400,
                          margin: '0 0 0.5rem',
                        }}
                      >
                        {photo.title || photo.name}
                      </h3>

                      {editingPhotoId === photo.id ? (
                        <div
                          style={{
                            display: 'grid',
                            gap: '0.6rem',
                            marginBottom: '1rem',
                            minHeight: '4.2rem',
                          }}
                        >
                          <select
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            style={inputStyle}
                          >
                            {categories.map((cat) => (
                              <option key={cat.key} value={cat.key}>
                                {cat.label}
                              </option>
                            ))}
                          </select>

                          <input
                            value={editLocation}
                            onChange={(e) => setEditLocation(e.target.value)}
                            placeholder="Plats"
                            style={inputStyle}
                          />

                          <input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            style={inputStyle}
                          />
                        </div>
                      ) : (
                        <div
                          style={{
                            display: 'grid',
                            gap: '0.25rem',
                            marginBottom: '1rem',
                            minHeight: '4.2rem',
                          }}
                        >
                          <p
                            style={{
                              margin: 0,
                              color: 'var(--admin-muted)',
                              fontSize: '0.8rem',
                            }}
                          >
                            Kategori: {getCategoryLabel(photo.category)}
                          </p>

                          <p
                            style={{
                              margin: 0,
                              color: 'var(--admin-muted)',
                              fontSize: '0.8rem',
                            }}
                          >
                            Plats: {photo.location || '—'}
                          </p>

                          <p
                            style={{
                              margin: 0,
                              color: 'var(--admin-muted)',
                              fontSize: '0.8rem',
                            }}
                          >
                            Datum: {photo.date || '—'}
                          </p>
                        </div>
                      )}

                      {editingPhotoId === photo.id ? (
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '0.5rem',
                            marginTop: 'auto',
                            marginBottom: '0.5rem',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => savePhotoEdit(photo.id)}
                            disabled={savingEdit}
                            style={{
                              background: 'transparent',
                              color: 'var(--admin-ink)',
                              border: '1px solid var(--admin-line-strong)',
                              padding: '0.75rem',
                              cursor: savingEdit ? 'not-allowed' : 'pointer',
                              textTransform: 'uppercase',
                              letterSpacing: '0.12em',
                              fontSize: '0.72rem',
                              opacity: savingEdit ? 0.6 : 1,
                            }}
                          >
                            {savingEdit ? 'Sparar...' : 'Spara'}
                          </button>

                          <button
                            type="button"
                            onClick={cancelEditing}
                            style={{
                              background: 'transparent',
                              color: 'var(--admin-muted)',
                              border: '1px solid var(--admin-line-strong)',
                              padding: '0.75rem',
                              cursor: 'pointer',
                              textTransform: 'uppercase',
                              letterSpacing: '0.12em',
                              fontSize: '0.72rem',
                            }}
                          >
                            Avbryt
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditing(photo)}
                          style={{
                            width: '100%',
                            marginTop: 'auto',
                            marginBottom: '0.5rem',
                            background: 'transparent',
                            color: 'var(--admin-muted)',
                            border: '1px solid var(--admin-line-strong)',
                            padding: '0.75rem',
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            letterSpacing: '0.12em',
                            fontSize: '0.72rem',
                          }}
                        >
                          Redigera
                        </button>
                      )}

                      <button
                        onClick={() => deletePhoto(photo)}
                        style={{
                          width: '100%',
                          background: 'transparent',
                          color: 'var(--admin-danger)',
                          border: '1px solid var(--admin-danger-line)',
                          padding: '0.75rem',
                          cursor: 'pointer',
                          textTransform: 'uppercase',
                          letterSpacing: '0.12em',
                          fontSize: '0.72rem',
                        }}
                      >
                        Radera
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  minWidth: 0,
  maxWidth: '100%',
  boxSizing: 'border-box',
  background: 'var(--admin-surface)',
  color: 'var(--admin-ink)',
  border: '1px solid var(--admin-line-strong)',
  padding: '0.8rem 1rem',
  fontSize: '16px',
}
