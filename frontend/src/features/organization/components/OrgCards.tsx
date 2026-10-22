import type { FacilityDetail, OrganizationOverview, SettingScope } from '@/domain/identity'
import { formatNumber, formatShortDate, t } from '@/i18n'
import { cx } from '@/shared/cx'
import { Card, Table, Tag, type TableColumn } from '@/ui'
import styles from '../Organization.module.css'

type Onboarding = NonNullable<OrganizationOverview['onboarding']>

const num = (n: number | null, fallback: string) => (
  <span className={styles.num}>{n === null ? fallback : formatNumber(n)}</span>
)

const facilityColumns = (): TableColumn<FacilityDetail>[] => [
  {
    key: 'name',
    header: t('admin.organization.columns.facility'),
    cell: (f) => (
      <span className={styles.facility}>
        <span className={styles.strong}>{f.name}</span>
        <span className={styles.code}>{f.code}</span>
      </span>
    ),
  },
  { key: 'type', header: t('admin.organization.columns.type'), cell: (f) => f.type },
  {
    key: 'beds',
    header: t('admin.organization.columns.beds'),
    align: 'right',
    width: '90px',
    cell: (f) => num(f.beds, t('admin.organization.notApplicable')),
  },
  {
    key: 'staff',
    header: t('admin.organization.columns.staff'),
    align: 'right',
    width: '90px',
    cell: (f) => num(f.staffCount, ''),
  },
  {
    key: 'patients',
    header: t('admin.organization.columns.patients'),
    align: 'right',
    width: '100px',
    cell: (f) => num(f.patientCount, t('admin.organization.migrating')),
  },
  {
    key: 'status',
    header: t('admin.organization.columns.status'),
    width: '140px',
    cell: (f) => <Tag tone={f.status === 'live' ? 'info' : 'warn'}>{t(`admin.organization.status.${f.status}`)}</Tag>,
  },
]

export function Facilities({ facilities }: { readonly facilities: readonly FacilityDetail[] }) {
  return (
    <Card as="section" labelledBy="org-facilities" className={styles.clip}>
      <div className={styles.hd}>
        <h2 id="org-facilities" className={styles.hdTitle}>
          {t('admin.organization.facilities')}
        </h2>
        <span className={styles.muted}>{t('admin.organization.facilitiesSub')}</span>
      </div>
      <Table
        caption={t('admin.organization.facilities')}
        rows={facilities}
        rowKey={(f) => f.id}
        minWidth={820}
        columns={facilityColumns()}
      />
    </Card>
  )
}

export function OnboardingCard({
  onboarding,
  timeZone,
}: {
  readonly onboarding: Onboarding
  readonly timeZone: string
}) {
  return (
    <Card as="section" labelledBy="org-onboarding" className={styles.half}>
      <div className={styles.hd}>
        <h2 id="org-onboarding" className={styles.hdTitle}>
          {t('admin.organization.onboarding', { facility: onboarding.facilityName })}
        </h2>
        {onboarding.goLive ? (
          <Tag tone="warn">
            {t('admin.organization.goLive', { date: formatShortDate(onboarding.goLive, timeZone) })}
          </Tag>
        ) : null}
      </div>
      <ol className={styles.steps}>
        {onboarding.steps.map((s, i) => (
          <li key={s.title} className={styles.step} aria-current={s.state === 'in-progress' ? 'step' : undefined}>
            <span
              className={cx(
                styles.stepNum,
                s.state === 'done' && styles.done,
                s.state === 'in-progress' && styles.current,
              )}
              aria-hidden="true"
            >
              {i + 1}
            </span>
            <span className={styles.stepText}>
              <span className={styles.strong}>{s.title}</span>
              <span className={styles.muted}>{s.detail}</span>
            </span>
            <span className={styles.stepState}>
              <span className="visually-hidden">{t(`admin.organization.stepState.${s.state}`)}: </span>
              {s.progress}
            </span>
          </li>
        ))}
      </ol>
    </Card>
  )
}

export function SharedSettings({ settings }: { readonly settings: readonly SettingScope[] }) {
  return (
    <Card as="section" labelledBy="org-shared" className={styles.half}>
      <div className={styles.hd}>
        <h2 id="org-shared" className={styles.hdTitle}>
          {t('admin.organization.shared')}
        </h2>
      </div>
      <Table
        caption={t('admin.organization.shared')}
        rows={settings}
        rowKey={(s) => s.name}
        minWidth={420}
        columns={[
          { key: 'name', header: t('admin.organization.setting'), cell: (s) => s.name },
          {
            key: 'scope',
            header: t('admin.organization.scopeColumn'),
            cell: (s) => (
              <Tag tone={s.scope === 'organization' ? 'info' : 'neutral'}>
                {t(`admin.organization.scope.${s.scope}`)}
              </Tag>
            ),
          },
        ]}
      />
    </Card>
  )
}

export function Roles({ overview }: { readonly overview: OrganizationOverview }) {
  return (
    <Card as="section" labelledBy="org-roles" className={styles.clip}>
      <div className={styles.hd}>
        <h2 id="org-roles" className={styles.hdTitle}>
          {t('admin.organization.roles')}
        </h2>
      </div>
      <Table
        caption={t('admin.organization.roles')}
        rows={overview.roles}
        rowKey={(r) => r.role}
        minWidth={720}
        columns={[
          {
            key: 'role',
            header: t('admin.organization.role'),
            cell: (r) => <span className={styles.strong}>{r.role}</span>,
          },
          ...overview.facilities.map((f) => ({
            key: f.id,
            header: f.name,
            cell: (r: (typeof overview.roles)[number]) => r.access[f.code] ?? '',
          })),
        ]}
      />
    </Card>
  )
}
