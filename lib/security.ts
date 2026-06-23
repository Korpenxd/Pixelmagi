import { timingSafeEqual } from 'node:crypto'

export function safeCompare(first: string, second: string): boolean {
  const firstBuffer = Buffer.from(first)
  const secondBuffer = Buffer.from(second)

  if (firstBuffer.length !== secondBuffer.length) {
    return false
  }

  return timingSafeEqual(firstBuffer, secondBuffer)
}
