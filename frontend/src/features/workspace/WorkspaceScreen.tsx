import { branding } from '@/app/branding'
import { initials } from '@/domain/identity'
import { t } from '@/i18n'
import { Avatar, Button, Logo, SkeletonRows, TextAction } from '@/ui'
import { DepartmentChips } from './components/DepartmentChips'
import { FacilityOption } from './components/FacilityOption'
import { useWorkspaceScreen } from './model/useWorkspaceScreen'
import styles from './Workspace.module.css'

/** C1: choose a facility and department after staff sign in. */
export function WorkspaceScreen() {
  const w = useWorkspaceScreen()
  const facilities = w.query.data ?? []
  const live = facilities.filter((f) => f.status === 'live' && f.membershipNote !== null).length
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Logo />
        {w.staff ? (
          <span className={styles.user}>
            <Avatar initials={initials(w.staff.displayName)} />
            <span>{w.staff.displayName}</span>
            <TextAction onClick={() => void w.signOut()}>{t('common.signOut')}</TextAction>
          </span>
        ) : null}
      </header>
      <main id="main" className={styles.body}>
        <div className={styles.intro}>
          <h1 className={styles.title}>{t('auth.workspace.title')}</h1>
          <p className={styles.lead}>{t('auth.workspace.sub', { count: live, org: branding.organizationName })}</p>
        </div>
        <section className={styles.section} aria-labelledby="ws-fac">
          <h2 id="ws-fac" className="cap">
            {t('auth.workspace.facility')}
          </h2>
          {w.query.isPending ? <SkeletonRows label={t('auth.workspace.loading')} rows={2} /> : null}
          <div className={styles.grid}>
            {facilities.map((f) => (
              <FacilityOption
                key={f.id}
                facility={f}
                selected={f.id === w.facilityId}
                onPick={() => w.pickFacility(f.id)}
              />
            ))}
          </div>
        </section>
        <section className={styles.section} aria-labelledby="ws-dep">
          <h2 id="ws-dep" className="cap">
            {t('auth.workspace.department')}
          </h2>
          <DepartmentChips
            departments={w.departments}
            selectedId={w.department?.id ?? null}
            onPick={w.setDepartmentId}
          />
        </section>
        <div className={styles.foot}>
          <label className={styles.remember}>
            <input type="checkbox" checked={w.remember} onChange={(e) => w.setRemember(e.target.checked)} />
            {t('auth.workspace.remember')}
          </label>
          <Button variant="primary" size="lg" disabled={!w.facilityId} onClick={w.open}>
            {t('auth.workspace.open')}
          </Button>
        </div>
      </main>
    </div>
  )
}
