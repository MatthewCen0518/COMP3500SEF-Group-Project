import { cn } from '@/lib/utils'

interface BrandMarkProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function BrandMark({ className, size = 'md' }: BrandMarkProps) {
  const dimensions =
    size === 'sm' ? 'h-8 w-8 rounded-lg' : size === 'lg' ? 'h-11 w-11 rounded-xl' : 'h-9 w-9 rounded-lg'
  const iconSize = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'

  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm ring-1 ring-blue-500/20',
        dimensions,
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={iconSize}
        aria-hidden="true"
      >
        <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
        <path d="M12 12l8-4.5" />
        <path d="M12 12v9" />
        <path d="M12 12L4 7.5" />
      </svg>
    </div>
  )
}
