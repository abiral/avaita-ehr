import type { PractitionerId } from '@/core/branded'
import { PACKAGE_FORMATS, VALIDITY_OPTIONS, type DraftProblem, type PackageFormat } from '@/domain/packages'
import type { Practitioner } from '@/domain/scheduling/types'
import { t } from '@/i18n'
import { cx } from '@/shared/cx'
import { Button, Card, Field, SegmentedControl, Select, Switch, Textarea, TextField, TextInput } from '@/ui'
import { validityLabel } from '@/features/patient-packages'
import styles from '../AdminPackages.module.css'
import type { PackageForm } from '../model/packageForm'
import type { SaveNotice } from '../model/useAdminPackages'
import { ItemsEditor } from './ItemsEditor'
import { StatusTag } from './PackageTable'

export interface EditorCardProps {
  readonly form: PackageForm
  readonly doctors: readonly Practitioner[]
  readonly problems: readonly DraftProblem[]
  readonly notice: SaveNotice
  readonly saving: boolean
  readonly onEdit: (patch: Partial<PackageForm>) => void
  readonly onSubmit: (publish: boolean) => void
}

type Props = Pick<EditorCardProps, 'form' | 'doctors' | 'problems' | 'onEdit'>
const problemText = (problems: readonly DraftProblem[], p: DraftProblem): string | undefined =>
  problems.includes(p) ? t(`admin.packages.problems.${p}`) : undefined

function Basics({ form, doctors, problems, onEdit }: Props) {
  const doctor = doctors.find((d) => d.id === form.practitionerId)
  return (
    <>
      <TextField
        label={t('admin.packages.name')}
        value={form.name}
        onValue={(name) => onEdit({ name })}
        error={problemText(problems, 'name-required')}
      />
      <div className={styles.pair}>
        <Field label={t('admin.packages.doctor')} error={problemText(problems, 'doctor-required')}>
          {(c) => (
            <Select
              {...c}
              value={form.practitionerId ?? ''}
              onChange={(e) => onEdit({ practitionerId: e.target.value as PractitionerId })}
              options={doctors.map((d) => ({ value: d.id, label: d.displayName }))}
            />
          )}
        </Field>
        <Field label={t('admin.packages.category')}>
          {(c) => <TextInput {...c} value={doctor?.category ?? ''} readOnly />}
        </Field>
      </div>
      <Field label={t('admin.packages.description')}>
        {(c) => (
          <Textarea
            {...c}
            rows={2}
            value={form.description}
            onChange={(e) => onEdit({ description: e.target.value })}
          />
        )}
      </Field>
      <div className={styles.group}>
        <span className={styles.groupLabel} aria-hidden="true">
          {t('admin.packages.format')}
        </span>
        <SegmentedControl<PackageFormat>
          label={t('admin.packages.format')}
          value={form.format}
          onChange={(format) => onEdit({ format })}
          options={PACKAGE_FORMATS.map((f) => ({ value: f, label: t(`portal.packages.formats.${f}.name`) }))}
        />
      </div>
    </>
  )
}

function Terms({ form, problems, onEdit }: Props) {
  return (
    <div className={styles.triple}>
      <Field label={t('admin.packages.validFor')}>
        {(c) => (
          <Select
            {...c}
            value={String(form.validityDays)}
            onChange={(e) => onEdit({ validityDays: Number(e.target.value) })}
            options={VALIDITY_OPTIONS.map((d) => ({ value: String(d), label: validityLabel(d) }))}
          />
        )}
      </Field>
      <TextField
        label={t('admin.packages.price')}
        value={form.price}
        inputMode="decimal"
        placeholder={t('admin.packages.pricePlaceholder')}
        onValue={(price) => onEdit({ price })}
      />
      <TextField
        label={t('admin.packages.cap')}
        value={form.cap}
        inputMode="numeric"
        onValue={(cap) => onEdit({ cap })}
        error={problemText(problems, 'cap-invalid')}
      />
    </div>
  )
}

function Actions({ notice, saving, onSubmit }: Pick<EditorCardProps, 'notice' | 'saving' | 'onSubmit'>) {
  return (
    <div className={styles.actions}>
      <span className={cx(styles.notice, notice?.tone === 'error' && styles.noticeError)} role="status">
        {notice?.text}
      </span>
      <Button disabled={saving} onClick={() => onSubmit(false)}>
        {t('admin.packages.saveDraft')}
      </Button>
      <Button variant="primary" disabled={saving} onClick={() => onSubmit(true)}>
        {saving ? t('admin.packages.saving') : t('admin.packages.publish')}
      </Button>
    </div>
  )
}

/** A3 editor: every field feeds the live preview through the same form state. */
export function EditorCard(props: EditorCardProps) {
  const { form, onEdit } = props
  return (
    <Card as="section" className={styles.editor} labelledBy="pkg-editor">
      <div className={styles.editorHead}>
        <h2 id="pkg-editor" className={styles.editorTitle}>
          {form.id ? t('admin.packages.editTitle') : t('admin.packages.newTitle')}
        </h2>
        <StatusTag published={form.published} />
      </div>
      <Basics {...props} />
      <ItemsEditor
        items={form.items}
        error={problemText(props.problems, 'items-required')}
        onChange={(items) => onEdit({ items })}
      />
      <Terms {...props} />
      <div className={styles.portal}>
        <span className={styles.portalText}>
          <span className={styles.portalTitle}>{t('admin.packages.showInPortal')}</span>
          <span className={styles.meta}>{t('admin.packages.showInPortalHint')}</span>
        </span>
        <Switch
          label={t('admin.packages.showInPortal')}
          checked={form.published}
          onChange={(published) => onEdit({ published })}
        />
      </div>
      <Actions notice={props.notice} saving={props.saving} onSubmit={props.onSubmit} />
    </Card>
  )
}
