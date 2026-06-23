'use client'

import Image from 'next/image'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import type {
  Category,
  Photo,
} from '@/lib/supabase'
import styles from './PortfolioClient.module.css'

const fallback: Photo[] = [
  {
    id: 'd1',
    name: '',
    storage_path: '',
    url: '/demo/wedding.webp',
    category: 'brollop',
    title: 'Kväll vid sjön',
    location: 'Alingsås',
    date: null,
    created_at: '',
    is_hero: false,
  },
  {
    id: 'd2',
    name: '',
    storage_path: '',
    url: '/demo/baby.webp',
    category: 'baby-barn',
    title: 'Första tiden',
    location: 'Alingsås',
    date: null,
    created_at: '',
    is_hero: false,
  },
  {
    id: 'd3',
    name: '',
    storage_path: '',
    url: '/demo/portrait.webp',
    category: 'portratt',
    title: 'Ett naturligt porträtt',
    location: 'Göteborg',
    date: null,
    created_at: '',
    is_hero: false,
  },
  {
    id: 'd4',
    name: '',
    storage_path: '',
    url: '/demo/child.webp',
    category: 'baby-barn',
    title: 'Höstljus',
    location: 'Västsverige',
    date: null,
    created_at: '',
    is_hero: false,
  },
  {
    id: 'd5',
    name: '',
    storage_path: '',
    url: '/demo/portrait-man.webp',
    category: 'portratt',
    title: 'Karaktär',
    location: 'Alingsås',
    date: null,
    created_at: '',
    is_hero: false,
  },
  {
    id: 'd6',
    name: '',
    storage_path: '',
    url: '/demo/nature.webp',
    category: 'ovrigt',
    title: 'Stillhet',
    location: 'Sävelången',
    date: null,
    created_at: '',
    is_hero: false,
  },
]

type PortfolioClientProps = {
  photos: Photo[]
  categories: Category[]
}

export default function PortfolioClient({
  photos,
  categories,
}: PortfolioClientProps) {
  const source =
    photos.length > 0 ? photos : fallback

  const [active, setActive] = useState('all')
  const [viewerIndex, setViewerIndex] =
    useState<number | null>(null)

  const closeButtonRef =
    useRef<HTMLButtonElement | null>(null)

  const triggerButtonRef =
    useRef<HTMLButtonElement | null>(null)

  const labels = useMemo(
    () =>
      new Map(
        categories.map((category) => [
          category.key,
          category.label,
        ]),
      ),
    [categories],
  )

  const filters = useMemo(() => {
    const keys = [
      ...new Set(
        source.map((photo) => photo.category),
      ),
    ]

    return [
      {
        key: 'all',
        label: 'Allt',
      },
      ...keys.map((key) => ({
        key,
        label:
          labels.get(key) ??
          key.replaceAll('-', ' '),
      })),
    ]
  }, [labels, source])

  const visiblePhotos = useMemo(() => {
    if (active === 'all') {
      return source
    }

    return source.filter(
      (photo) => photo.category === active,
    )
  }, [active, source])

  const selectedPhoto =
    viewerIndex === null
      ? null
      : (visiblePhotos[viewerIndex] ?? null)

  function selectFilter(filterKey: string) {
    setActive(filterKey)
    setViewerIndex(null)
  }

  function openViewer(
    index: number,
    trigger: HTMLButtonElement,
  ) {
    triggerButtonRef.current = trigger
    setViewerIndex(index)
  }

  function closeViewer() {
    setViewerIndex(null)

    window.requestAnimationFrame(() => {
      triggerButtonRef.current?.focus()
    })
  }

  function showPreviousPhoto() {
    setViewerIndex((currentIndex) => {
      if (
        currentIndex === null ||
        visiblePhotos.length < 2
      ) {
        return currentIndex
      }

      return (
        (currentIndex - 1 + visiblePhotos.length) %
        visiblePhotos.length
      )
    })
  }

  function showNextPhoto() {
    setViewerIndex((currentIndex) => {
      if (
        currentIndex === null ||
        visiblePhotos.length < 2
      ) {
        return currentIndex
      }

      return (
        (currentIndex + 1) %
        visiblePhotos.length
      )
    })
  }

  useEffect(() => {
    if (viewerIndex === null) {
      return
    }

    const previousOverflow =
      document.body.style.overflow

    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setViewerIndex(null)

        window.requestAnimationFrame(() => {
          triggerButtonRef.current?.focus()
        })

        return
      }

      if (
        event.key === 'ArrowLeft' &&
        visiblePhotos.length > 1
      ) {
        event.preventDefault()

        setViewerIndex((currentIndex) => {
          if (currentIndex === null) {
            return null
          }

          return (
            (currentIndex -
              1 +
              visiblePhotos.length) %
            visiblePhotos.length
          )
        })
      }

      if (
        event.key === 'ArrowRight' &&
        visiblePhotos.length > 1
      ) {
        event.preventDefault()

        setViewerIndex((currentIndex) => {
          if (currentIndex === null) {
            return null
          }

          return (
            (currentIndex + 1) %
            visiblePhotos.length
          )
        })
      }
    }

    window.addEventListener(
      'keydown',
      handleKeyDown,
    )

    return () => {
      document.body.style.overflow =
        previousOverflow

      window.removeEventListener(
        'keydown',
        handleKeyDown,
      )
    }
  }, [viewerIndex, visiblePhotos.length])

  return (
    <>
      <div
        className={styles.filters}
        aria-label="Filtrera portfolio"
      >
        {filters.map((filter) => {
          const isActive =
            active === filter.key

          return (
            <button
              key={filter.key}
              type="button"
              className={`${styles.filter} ${
                isActive ? styles.active : ''
              }`}
              onClick={() =>
                selectFilter(filter.key)
              }
              aria-pressed={isActive}
            >
              {filter.label}
            </button>
          )
        })}
      </div>

      <div
        className={styles.grid}
        aria-live="polite"
      >
        {visiblePhotos.length === 0 ? (
          <p className={styles.empty}>
            Inga bilder finns i den här kategorin
            ännu.
          </p>
        ) : (
          visiblePhotos.map((photo, index) => {
            const categoryLabel =
              labels.get(photo.category) ??
              photo.category.replaceAll('-', ' ')

            const photoTitle =
              photo.title ||
              categoryLabel ||
              'Fotografi'

            return (
              <article
                className={styles.card}
                key={photo.id}
              >
                <button
                  type="button"
                  className={styles.openButton}
                  onClick={(event) =>
                    openViewer(
                      index,
                      event.currentTarget,
                    )
                  }
                  aria-label={`Öppna bilden ${photoTitle}`}
                >
                  <Image
                    className={styles.image}
                    src={photo.url}
                    alt={
                      photo.title ||
                      'Fotografi av Britt-Marie Ström'
                    }
                    fill
                    sizes="(max-width: 560px) 100vw, (max-width: 820px) 50vw, 33vw"
                  />

                  <div className={styles.overlay}>
                    <h2>{photoTitle}</h2>

                    <p>
                      {photo.location ||
                        categoryLabel}
                    </p>
                  </div>
                </button>
              </article>
            )
          })
        )}
      </div>

      {selectedPhoto &&
      viewerIndex !== null ? (
        <div
          className={styles.viewer}
          role="dialog"
          aria-modal="true"
          aria-labelledby="portfolio-viewer-title"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeViewer()
            }
          }}
        >
          <div className={styles.viewerPanel}>
            <button
              ref={closeButtonRef}
              type="button"
              className={styles.viewerClose}
              onClick={closeViewer}
              aria-label="Stäng bildvisaren"
            >
              <span aria-hidden="true">×</span>
            </button>

            {visiblePhotos.length > 1 ? (
              <>
                <button
                  type="button"
                  className={`${styles.viewerNavigation} ${styles.viewerPrevious}`}
                  onClick={showPreviousPhoto}
                  aria-label="Visa föregående bild"
                >
                  <span aria-hidden="true">‹</span>
                </button>

                <button
                  type="button"
                  className={`${styles.viewerNavigation} ${styles.viewerNext}`}
                  onClick={showNextPhoto}
                  aria-label="Visa nästa bild"
                >
                  <span aria-hidden="true">›</span>
                </button>
              </>
            ) : null}

            <div className={styles.viewerImageFrame}>
              <Image
                className={styles.viewerImage}
                src={selectedPhoto.url}
                alt={
                  selectedPhoto.title ||
                  'Fotografi av Britt-Marie Ström'
                }
                fill
                sizes="100vw"
                priority
              />
            </div>

            <div className={styles.viewerFooter}>
              <div className={styles.viewerCaption}>
                <h2 id="portfolio-viewer-title">
                  {selectedPhoto.title ||
                    labels.get(
                      selectedPhoto.category,
                    ) ||
                    'Fotografi'}
                </h2>

                <p>
                  {selectedPhoto.location ||
                    labels.get(
                      selectedPhoto.category,
                    ) ||
                    selectedPhoto.category.replaceAll(
                      '-',
                      ' ',
                    )}
                </p>
              </div>

              <p
                className={styles.viewerCounter}
                aria-label={`Bild ${
                  viewerIndex + 1
                } av ${visiblePhotos.length}`}
              >
                {viewerIndex + 1}
                <span aria-hidden="true"> / </span>
                {visiblePhotos.length}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
