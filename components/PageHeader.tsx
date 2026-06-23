import BranchOrnament from '@/components/BranchOrnament'
import styles from './PageHeader.module.css'

type PageHeaderProps = {
  title: string
  eyebrow?: string
  intro?: string
}

export default function PageHeader({ title, eyebrow, intro }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1 className={`display ${styles.title}`}>{title}</h1>
      <BranchOrnament className={styles.branch} />
      {intro ? <p className={styles.intro}>{intro}</p> : null}
    </header>
  )
}
