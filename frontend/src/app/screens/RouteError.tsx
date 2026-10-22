import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { errorCodeOf } from '@/core/errors'
import { errorMessage, t } from '@/i18n'
import styles from './Status.module.css'

function Message({ title, body }: { readonly title: string; readonly body: string }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.card} role="alert">
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.body}>{body}</p>
        <Link to="/">{t('common.forbidden.home')}</Link>
      </div>
    </div>
  )
}

/** Route error boundary: 403 shows "no access", 404 shows not found, anything else a generic error. */
export function RouteError() {
  const error = useRouteError()
  if (isRouteErrorResponse(error) && error.status === 403) {
    return <Message title={t('common.forbidden.title')} body={t('common.forbidden.body')} />
  }
  if (isRouteErrorResponse(error) && error.status === 404) {
    return <Message title={t('common.notFound.title')} body={t('common.notFound.body')} />
  }
  return <Message title={t('common.errors.unknown')} body={errorMessage(errorCodeOf(error))} />
}

export function NotFound() {
  return <Message title={t('common.notFound.title')} body={t('common.notFound.body')} />
}
