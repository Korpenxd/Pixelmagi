import Image from 'next/image'
import Link from 'next/link'

import styles from './Hero.module.css'

type HeroProps = {
  imageUrl?: string | null
}

export default function Hero({
  imageUrl,
}: HeroProps) {
  const heroImage =
    imageUrl || '/demo/hero-wedding.png'

  return (
    <section
      className={styles.hero}
      aria-labelledby="hero-title"
    >
      <Image
        className={styles.image}
        src={heroImage}
        alt="Brudpar under en stämningsfull bröllopsceremoni"
        fill
        priority
        sizes="100vw"
      />

      <div
        className={styles.shade}
        aria-hidden="true"
      />

      <div className={styles.content}>
        <p className={styles.eyebrow}>
          Naturliga minnen. Äkta känslor.
        </p>

        <h1
          id="hero-title"
          className={styles.title}
        >
          Förevigar er
        </h1>

        <p className={styles.script}>
          kärlekshistoria
        </p>

        <p className={styles.intro}>
          Tidlösa bilder med känsla, närvaro och ljus
          – för minnen som varar livet ut.
        </p>

        <Link
          href="/portfolio"
          className={styles.button}
        >
          <span>Se portfolio</span>

          <span
            className={styles.buttonArrow}
            aria-hidden="true"
          >
            →
          </span>
        </Link>
      </div>
    </section>
  )
}