type PortraitIconProps = {
  className?: string
}

export default function PortraitIcon({ className }: PortraitIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="32" cy="20" r="10" stroke="currentColor" strokeWidth="2.2" />

      <path
        d="M15 53C16.5 41.5 23 35 32 35C41 35 47.5 41.5 49 53"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
