'use client'

import { useEffect, useRef, useState } from 'react'

import { compressImage } from '@/lib/compressImage'
import { getServices, type Service } from '@/lib/supabase'
import styles from './ServiceManager.module.css'

type ServiceForm = {
  title: string
  description: string
  price: string
  buttonLabel: string
  sortOrder: string
}

const EMPTY_FORM: ServiceForm = {
  title: '',
  description: '',
  price: '',
  buttonLabel: 'Boka eller fråga',
  sortOrder: '',
}

function FilePreview({
  file,
  alt,
}: {
  file: File
  alt: string
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
      alt={alt}
    />
  )
}


function readErrorMessage(payload: unknown, fallback: string): string {
  if (
    payload &&
    typeof payload === 'object' &&
    'error' in payload &&
    typeof payload.error === 'string'
  ) {
    return payload.error
  }

  return fallback
}

export default function ServiceManager() {
  const createImageInputRef = useRef<HTMLInputElement | null>(null)
  const editImageInputRef = useRef<HTMLInputElement | null>(null)

  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const [createForm, setCreateForm] = useState<ServiceForm>(EMPTY_FORM)
  const [createImage, setCreateImage] = useState<File | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<ServiceForm>(EMPTY_FORM)
  const [editImage, setEditImage] = useState<File | null>(null)

  useEffect(() => {
    void loadServices()
  }, [])

  async function loadServices() {
    setLoading(true)
    const data = await getServices()
    setServices(data)
    setLoading(false)
  }

  function selectImage(file: File | null, mode: 'create' | 'edit') {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMessage('Välj en giltig bildfil.')
      return
    }

    if (file.size > 15 * 1024 * 1024) {
      setMessage('Bilden får vara högst 15 MB före komprimering.')
      return
    }

    setMessage('')

    if (mode === 'create') {
      setCreateImage(file)
    } else {
      setEditImage(file)
    }
  }

  function updateCreateForm(field: keyof ServiceForm, value: string) {
    setCreateForm((current) => ({ ...current, [field]: value }))
  }

  function updateEditForm(field: keyof ServiceForm, value: string) {
    setEditForm((current) => ({ ...current, [field]: value }))
  }

  async function prepareImage(file: File): Promise<File> {
    return compressImage(file, {
      maxWidth: 1800,
      maxHeight: 1800,
      quality: 0.86,
      outputType: 'image/webp',
    })
  }

  async function createService(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!createImage) {
      setMessage('Välj en bild till det nya tjänstekortet.')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const image = await prepareImage(createImage)
      const formData = new FormData()

      formData.append('title', createForm.title)
      formData.append('description', createForm.description)
      formData.append('price', createForm.price)
      formData.append('button_label', createForm.buttonLabel)
      formData.append('sort_order', createForm.sortOrder)
      formData.append('image', image)

      const response = await fetch('/api/admin/services', {
        method: 'POST',
        credentials: 'same-origin',
        body: formData,
      })

      const payload = (await response.json().catch(() => null)) as unknown

      if (!response.ok) {
        throw new Error(readErrorMessage(payload, 'Kunde inte skapa tjänstekortet.'))
      }

      setCreateForm(EMPTY_FORM)
      setCreateImage(null)

      if (createImageInputRef.current) {
        createImageInputRef.current.value = ''
      }

      setMessage('Tjänstekortet har lagts till.')
      await loadServices()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Ett oväntat fel uppstod.')
    } finally {
      setSaving(false)
    }
  }

  function startEditing(service: Service) {
    setEditingId(service.id)
    setEditForm({
      title: service.title,
      description: service.description,
      price: service.price,
      buttonLabel: service.button_label,
      sortOrder: String(service.sort_order),
    })
    setEditImage(null)
    setMessage('')

    if (editImageInputRef.current) {
      editImageInputRef.current.value = ''
    }
  }

  function cancelEditing() {
    setEditingId(null)
    setEditForm(EMPTY_FORM)
    setEditImage(null)
    setMessage('')
  }

  async function saveService(service: Service) {
    setSaving(true)
    setMessage('')

    try {
      const formData = new FormData()

      formData.append('title', editForm.title)
      formData.append('description', editForm.description)
      formData.append('price', editForm.price)
      formData.append('button_label', editForm.buttonLabel)
      formData.append('sort_order', editForm.sortOrder)

      if (editImage) {
        formData.append('image', await prepareImage(editImage))
      }

      const response = await fetch(
        `/api/admin/services/${encodeURIComponent(service.id)}`,
        {
          method: 'PATCH',
          credentials: 'same-origin',
          body: formData,
        },
      )

      const payload = (await response.json().catch(() => null)) as unknown

      if (!response.ok) {
        throw new Error(readErrorMessage(payload, 'Kunde inte spara tjänstekortet.'))
      }

      setMessage('Ändringarna har sparats.')
      setEditingId(null)
      setEditImage(null)
      await loadServices()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Ett oväntat fel uppstod.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteService(service: Service) {
    const confirmed = window.confirm(`Radera tjänstekortet “${service.title}”?`)

    if (!confirmed) return

    setDeletingId(service.id)
    setMessage('')

    try {
      const response = await fetch(
        `/api/admin/services/${encodeURIComponent(service.id)}`,
        {
          method: 'DELETE',
          credentials: 'same-origin',
        },
      )

      const payload = (await response.json().catch(() => null)) as unknown

      if (!response.ok) {
        throw new Error(readErrorMessage(payload, 'Kunde inte radera tjänstekortet.'))
      }

      setMessage('Tjänstekortet har raderats.')
      await loadServices()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Ett oväntat fel uppstod.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className={styles.section} aria-labelledby="service-manager-title">
      <div className={styles.headingRow}>
        <div>
          <p className={styles.eyebrow}>Innehåll</p>
          <h2 id="service-manager-title">Tjänstekort</h2>
          <p className={styles.intro}>
            Lägg till, redigera, sortera och ta bort korten som visas på tjänstesidan.
          </p>
        </div>
        <span className={styles.count}>{services.length} kort</span>
      </div>

      {message ? (
        <p className={styles.message} role="status">
          {message}
        </p>
      ) : null}

      <form className={styles.createPanel} onSubmit={createService}>
        <div className={styles.formHeading}>
          <h3>Lägg till nytt kort</h3>
          <p>Alla fält utom position måste fyllas i.</p>
        </div>

        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span>Titel</span>
            <input
              required
              value={createForm.title}
              onChange={(event) => updateCreateForm('title', event.target.value)}
              maxLength={100}
              placeholder="Till exempel Familjefotografering"
            />
          </label>

          <label className={styles.field}>
            <span>Prisrad</span>
            <input
              required
              value={createForm.price}
              onChange={(event) => updateCreateForm('price', event.target.value)}
              maxLength={100}
              placeholder="Session från 2 900 kr"
            />
          </label>

          <label className={styles.field}>
            <span>Knapptext</span>
            <input
              required
              value={createForm.buttonLabel}
              onChange={(event) => updateCreateForm('buttonLabel', event.target.value)}
              maxLength={50}
            />
          </label>

          <label className={styles.field}>
            <span>Position</span>
            <input
              type="number"
              min="0"
              max="999"
              value={createForm.sortOrder}
              onChange={(event) => updateCreateForm('sortOrder', event.target.value)}
              placeholder="Automatisk"
            />
          </label>

          <label className={`${styles.field} ${styles.fullWidth}`}>
            <span>Beskrivning</span>
            <textarea
              required
              rows={4}
              value={createForm.description}
              onChange={(event) => updateCreateForm('description', event.target.value)}
              maxLength={800}
              placeholder="Beskriv fotograferingen och vad kunden kan förvänta sig."
            />
          </label>

          <div className={`${styles.imageField} ${styles.fullWidth}`}>
            <div className={styles.imagePicker}>
              <input
                ref={createImageInputRef}
                type="file"
                accept="image/*"
                onChange={(event) =>
                  selectImage(event.target.files?.[0] ?? null, 'create')
                }
              />
              <span>Bild till kortet</span>
              <small>JPG, PNG eller WebP. Bilden komprimeras före uppladdning.</small>
            </div>

            {createImage ? (
              <div className={styles.smallPreview}>
                <FilePreview
                  file={createImage}
                  alt="Förhandsvisning av nytt tjänstekort"
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className={styles.formActions}>
          <button className={styles.primaryButton} type="submit" disabled={saving}>
            {saving ? 'Sparar…' : 'Lägg till kort'}
          </button>
        </div>
      </form>

      {loading ? (
        <p className={styles.empty}>Laddar tjänstekort…</p>
      ) : services.length === 0 ? (
        <div className={styles.empty}>
          <strong>Inga databasstyrda tjänstekort ännu.</strong>
          <span>
            Kör SQL-filen <code>docs/SERVICES_MIGRATION.sql</code> i Supabase och
            uppdatera sedan sidan.
          </span>
        </div>
      ) : (
        <div className={styles.cards}>
          {services.map((service) => {
            const isEditing = editingId === service.id

            return (
              <article className={styles.card} key={service.id}>
                <div className={styles.cardImage}>
                  {isEditing && editImage ? (
                    <FilePreview file={editImage} alt="Ny förhandsvisning" />
                  ) : (
                    // Service images may be local demo files or public Supabase URLs.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={service.image_url} alt={service.title} />
                  )}
                  <span className={styles.position}>Position {service.sort_order}</span>
                </div>

                {isEditing ? (
                  <div className={styles.editForm}>
                    <label className={styles.field}>
                      <span>Titel</span>
                      <input
                        value={editForm.title}
                        onChange={(event) =>
                          updateEditForm('title', event.target.value)
                        }
                        maxLength={100}
                      />
                    </label>

                    <label className={styles.field}>
                      <span>Beskrivning</span>
                      <textarea
                        rows={5}
                        value={editForm.description}
                        onChange={(event) =>
                          updateEditForm('description', event.target.value)
                        }
                        maxLength={800}
                      />
                    </label>

                    <div className={styles.editColumns}>
                      <label className={styles.field}>
                        <span>Prisrad</span>
                        <input
                          value={editForm.price}
                          onChange={(event) =>
                            updateEditForm('price', event.target.value)
                          }
                          maxLength={100}
                        />
                      </label>

                      <label className={styles.field}>
                        <span>Position</span>
                        <input
                          type="number"
                          min="0"
                          max="999"
                          value={editForm.sortOrder}
                          onChange={(event) =>
                            updateEditForm('sortOrder', event.target.value)
                          }
                        />
                      </label>
                    </div>

                    <label className={styles.field}>
                      <span>Knapptext</span>
                      <input
                        value={editForm.buttonLabel}
                        onChange={(event) =>
                          updateEditForm('buttonLabel', event.target.value)
                        }
                        maxLength={50}
                      />
                    </label>

                    <label className={styles.replaceImage}>
                      <span>Byt bild</span>
                      <input
                        ref={editImageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(event) =>
                          selectImage(event.target.files?.[0] ?? null, 'edit')
                        }
                      />
                    </label>

                    <div className={styles.cardActions}>
                      <button
                        className={styles.primaryButton}
                        type="button"
                        onClick={() => saveService(service)}
                        disabled={saving}
                      >
                        {saving ? 'Sparar…' : 'Spara'}
                      </button>
                      <button
                        className={styles.secondaryButton}
                        type="button"
                        onClick={cancelEditing}
                        disabled={saving}
                      >
                        Avbryt
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.cardCopy}>
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                    <strong>{service.price}</strong>
                    <span className={styles.buttonPreview}>
                      {service.button_label} →
                    </span>

                    <div className={styles.cardActions}>
                      <button
                        className={styles.secondaryButton}
                        type="button"
                        onClick={() => startEditing(service)}
                      >
                        Redigera
                      </button>
                      <button
                        className={styles.dangerButton}
                        type="button"
                        onClick={() => deleteService(service)}
                        disabled={deletingId === service.id}
                      >
                        {deletingId === service.id ? 'Raderar…' : 'Radera'}
                      </button>
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
