import styles from './BranchOrnament.module.css'

type BranchOrnamentProps = {
  className?: string
}

export default function BranchOrnament({
  className = '',
}: BranchOrnamentProps) {
  return (
    <img
      className={`${styles.ornament} ${className}`.trim()}
      src="/images/branches.svg"
      alt=""
      aria-hidden="true"
      draggable="false"
    />
  )
}
