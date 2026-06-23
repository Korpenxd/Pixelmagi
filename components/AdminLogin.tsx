'use client'

import { useState } from 'react'

import Navbar from '@/components/Navbar'
import styles from './AdminLogin.module.css'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        setError('Fel lösenord')
        return
      }

      window.location.reload()
    } catch {
      setError('Inloggningen kunde inte genomföras. Försök igen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <form className={styles.form} onSubmit={handleLogin}>
          <h1 className={styles.title}>Admin</h1>
          <label className="srOnly" htmlFor="admin-password">
            Lösenord
          </label>
          <input
            id="admin-password"
            className={styles.input}
            type="password"
            placeholder="Lösenord"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? 'Loggar in...' : 'Logga in'}
          </button>
          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}
        </form>
      </main>
    </>
  )
}
