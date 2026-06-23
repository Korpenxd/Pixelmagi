type WeddingRingsIcon = {
  className?: string
  title?: string
}

export default function WeddingRingsIcon({
  className,
  title = 'Wedding rings',
}: WeddingRingsIcon) {
  return (
    <svg
      className={className}
      viewBox="0 0 160 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
    >
      {/* Shine lines */}
      <path d="M80 25V8" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />

      <path
        d="M45 42 32 29"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
      />

      <path
        d="m115 42 13-13"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
      />

      {/* Diamond outline */}
      <path
        d="M52 58h56l9 22-37 27-37-27 9-22Z"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinejoin="round"
      />

      {/* Diamond facets */}
      <path
        d="m52 58 28 17 28-17"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinejoin="round"
      />

      <path d="M43 80h74" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />

      <path
        d="m52 58-9 22 37 27 37-27-9-22"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinejoin="round"
      />

      <path
        d="m80 75-37 5"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
      />

      <path
        d="m80 75 37 5"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
      />

      {/* Ring */}
      <circle cx="80" cy="155" r="52" stroke="currentColor" strokeWidth="7" />

      <circle cx="80" cy="155" r="36" stroke="currentColor" strokeWidth="7" />
    </svg>
  )
}
