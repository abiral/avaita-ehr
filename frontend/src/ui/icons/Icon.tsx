import { ICON_PATHS, type IconName } from './paths'

export interface IconProps {
  readonly name: IconName
  readonly size?: number
  readonly strokeWidth?: number
  readonly className?: string
}

/** Decorative icon. Pair it with visible text or an accessible label on the control. */
export function Icon({ name, size = 18, strokeWidth = 1.7, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {ICON_PATHS[name]}
    </svg>
  )
}
