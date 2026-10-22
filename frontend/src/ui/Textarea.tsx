import type { TextareaHTMLAttributes } from 'react'
import styles from './Form.module.css'

export type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'>

export function Textarea(props: TextareaProps) {
  return <textarea className={styles.control} {...props} />
}
