'use client'

import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'

import PageHeader from '@/components/PageHeader'
import { siteConfig } from '@/lib/site'
import styles from './ContactSection.module.css'

type SubmissionState = 'idle' | 'sending' | 'sent'

export default function ContactSection() {
  const [submissionState, setSubmissionState] =
    useState<SubmissionState>('idle')

  useEffect(() => {
    if (submissionState !== 'sent') {
      return
    }

    const resetTimer = window.setTimeout(() => {
      setSubmissionState('idle')
    }, 5000)

    return () => {
      window.clearTimeout(resetTimer)
    }
  }, [submissionState])

  function resizeTextarea(
    event: FormEvent<HTMLTextAreaElement>,
  ) {
    const textarea = event.currentTarget

    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const form = event.currentTarget

    setSubmissionState('sending')

    // Temporary simulated submission.
    // Replace this with a real API request later.
    await new Promise((resolve) => {
      window.setTimeout(resolve, 600)
    })

    form.reset()

    const textarea = form.elements.namedItem(
      'message',
    ) as HTMLTextAreaElement | null

    if (textarea) {
      textarea.style.height = 'auto'
    }

    setSubmissionState('sent')
  }

  function resetForm() {
    setSubmissionState('idle')
  }

  const isSending = submissionState === 'sending'
  const isSent = submissionState === 'sent'

  return (
    <section
      id="kontakt"
      className={`section ${styles.section}`}
    >
      <div className={styles.inner}>
        <PageHeader
          title="Kontakta mig"
          intro="Har du frågor eller vill boka en fotografering? Fyll i formuläret så hör jag av mig."
        />

        {isSent ? (
          <div
            className={styles.confirmation}
            role="status"
            aria-live="polite"
          >
            <p className={styles.confirmationEyebrow}>
              Meddelandet är registrerat
            </p>

            <h2 className={styles.confirmationTitle}>
              Tack för ditt meddelande!
            </h2>

            <p className={styles.confirmationText}>
              Din förfrågan har registrerats och jag hör
              av mig så snart jag kan.
            </p>

            <button
              className={`button ${styles.confirmationButton}`}
              type="button"
              onClick={resetForm}
            >
              Skicka ett nytt meddelande
            </button>
          </div>
        ) : (
          <form
            className={styles.form}
            onSubmit={submit}
          >
            <label
              className="srOnly"
              htmlFor="contact-name"
            >
              Namn
            </label>

            <input
              id="contact-name"
              className={styles.field}
              required
              name="name"
              placeholder="Namn"
              autoComplete="name"
              disabled={isSending}
            />

            <label
              className="srOnly"
              htmlFor="contact-email"
            >
              E-post
            </label>

            <input
              id="contact-email"
              className={styles.field}
              required
              type="email"
              name="email"
              placeholder="E-post"
              autoComplete="email"
              disabled={isSending}
            />

            <label
              className="srOnly"
              htmlFor="contact-phone"
            >
              Telefon
            </label>

            <input
              id="contact-phone"
              className={styles.field}
              type="tel"
              name="phone"
              placeholder="Telefon"
              autoComplete="tel"
              disabled={isSending}
            />

            <label
              className="srOnly"
              htmlFor="contact-date"
            >
              Önskat datum
            </label>

            <input
              id="contact-date"
              className={styles.field}
              type="date"
              name="date"
              disabled={isSending}
            />

            <label
              className="srOnly"
              htmlFor="contact-message"
            >
              Meddelande
            </label>

            <textarea
              id="contact-message"
              className={styles.textarea}
              required
              name="message"
              placeholder="Berätta gärna lite om fotograferingen"
              rows={1}
              onInput={resizeTextarea}
              disabled={isSending}
            />

            <button
              className={`button ${styles.submit}`}
              type="submit"
              disabled={isSending}
            >
              {isSending
                ? 'Skickar...'
                : 'Skicka meddelande'}
            </button>
          </form>
        )}

        <div className={styles.details}>
          <a
            className={styles.detail}
            href={siteConfig.mapsUrl}
            target="_blank"
            rel="noreferrer"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 21s6-5.4 6-12a6 6 0 1 0-12 0c0 6.6 6 12 6 12Z" />
              <circle cx="12" cy="9" r="2.2" />
            </svg>

            <span>{siteConfig.location}</span>
          </a>

          <a
            className={styles.detail}
            href={`tel:${siteConfig.phoneHref}`}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M6.5 3.5 9 8l-2 2c1.3 2.7 3.3 4.7 6 6l2-2 4.5 2.5c.5.3.7.8.5 1.3-.5 1.5-1.9 3.2-4.2 3.2C9.2 21 3 14.8 3 7.2 3 4.9 4.7 3.5 6.2 3c.5-.2 1 .1 1.3.5Z" />
            </svg>

            <span>{siteConfig.phoneDisplay}</span>
          </a>

          <a
            className={styles.detail}
            href={`mailto:${siteConfig.email}`}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <rect
                x="3"
                y="5"
                width="18"
                height="14"
                rx="1.5"
              />

              <path d="m4 7 8 6 8-6" />
            </svg>

            <span>{siteConfig.email}</span>
          </a>
        </div>

        <div
          className={styles.socials}
          aria-label="Sociala medier"
        >
          <a
            className={styles.socialLink}
            href={siteConfig.instagramUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
          >
            <svg
              className={styles.socialIcon}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="5"
              />

              <circle cx="12" cy="12" r="4" />

              <circle
                className={styles.socialDot}
                cx="17.4"
                cy="6.6"
                r="1"
              />
            </svg>
          </a>

          <a
            className={styles.socialLink}
            href={siteConfig.facebookUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Facebook"
          >
            <svg
              className={`${styles.socialIcon} ${styles.facebookIcon}`}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M14 21v-8h3l.5-3H14V8.2c0-.9.3-1.7 1.8-1.7H18V3.8c-.6-.1-1.5-.3-2.7-.3-2.7 0-4.6 1.7-4.6 4.7V10H8v3h2.7v8H14Z" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}