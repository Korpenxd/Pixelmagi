type HeartIconProps = {
  className?: string
}

export default function HeartIcon({ className }: HeartIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M32 53C17 43 10 34 10 23.5C10 15.8 15.4 11 22 11C26.6 11 30.1 13.7 32 17.2C33.9 13.7 37.4 11 42 11C48.6 11 54 15.8 54 23.5C54 34 47 43 32 53Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M14 32C19 39 25 44 32 49C39 44 45 39 50 32"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}
