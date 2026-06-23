import styles from './BranchOrnament.module.css'

type BranchOrnamentProps = {
  className?: string
}

export default function BranchOrnament({ className = '' }: BranchOrnamentProps) {
  return (
    <svg
      className={`${styles.ornament} ${className}`.trim()}
      viewBox="0 0 220 50"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      {/* Left branch */}
      <g>
        <path
          className={styles.stem}
          d="M114 42
             C96 40 79 35 61 29
             C56 27 52 24 48 22"
        />

        <path
          className={styles.leaf}
          d="M98 39
             C91 34 84 34 79 37
             C84 41 91 42 98 39Z"
        />

        <path
          className={styles.leaf}
          d="M88 36
             C87 30 90 26 95 24
             C97 29 94 34 88 36Z"
        />

        <path
          className={styles.leaf}
          d="M80 34
             C74 29 67 29 62 32
             C67 36 74 38 80 34Z"
        />

        <path
          className={styles.leaf}
          d="M69 30
             C69 25 72 21 77 19
             C79 24 76 28 69 30Z"
        />

        <path
          className={styles.leaf}
          d="M63 29
             C57 25 51 25 46 28
             C51 32 57 33 63 29Z"
        />

        <path
          className={styles.leaf}
          d="M53 25
             C53 21 56 17 60 15
             C62 19 59 23 53 25Z"
        />
      </g>

      {/* Mirrored right branch, shifted slightly upward so the stems barely cross */}
      <g transform="translate(220 -1) scale(-1 1)">
        <path
          className={styles.stem}
          d="M114 42
             C96 40 79 35 61 29
             C56 27 52 24 48 22"
        />

        <path
          className={styles.leaf}
          d="M98 39
             C91 34 84 34 79 37
             C84 41 91 42 98 39Z"
        />

        <path
          className={styles.leaf}
          d="M88 36
             C87 30 90 26 95 24
             C97 29 94 34 88 36Z"
        />

        <path
          className={styles.leaf}
          d="M80 34
             C74 29 67 29 62 32
             C67 36 74 38 80 34Z"
        />

        <path
          className={styles.leaf}
          d="M69 30
             C69 25 72 21 77 19
             C79 24 76 28 69 30Z"
        />

        <path
          className={styles.leaf}
          d="M63 29
             C57 25 51 25 46 28
             C51 32 57 33 63 29Z"
        />

        <path
          className={styles.leaf}
          d="M53 25
             C53 21 56 17 60 15
             C62 19 59 23 53 25Z"
        />
      </g>
    </svg>
  )
}
