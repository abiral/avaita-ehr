import DOMPurify from 'dompurify'
import { useMemo } from 'react'

const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a']
const ALLOWED_ATTR = ['href']

const hook = { installed: false }
const ensureHook = () => {
  if (hook.installed) return
  hook.installed = true
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank')
      node.setAttribute('rel', 'noopener noreferrer')
    }
  })
}

export const sanitize = (html: string): string => {
  ensureHook()
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR })
}

/** The only place allowed to set inner HTML. Short allow-list; links open safely. */
export function SafeHtml({ html, className }: { readonly html: string; readonly className?: string }) {
  const clean = useMemo(() => sanitize(html), [html])
  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />
}
