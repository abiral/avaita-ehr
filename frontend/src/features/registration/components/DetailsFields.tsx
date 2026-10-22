import { t } from '@/i18n'
import { Field, Select, TextField } from '@/ui'
import styles from '../Registration.module.css'
import type { DetailsForm } from '../model/form'

export interface DetailsFieldsProps {
  readonly form: DetailsForm
  readonly errors: Readonly<Record<string, string>>
  readonly onChange: (patch: Partial<DetailsForm>) => void
}

const SEXES = ['male', 'female', 'other', 'undisclosed'] as const
export const fieldError = (code: string | undefined): string | undefined =>
  code ? t(`auth.register.fieldErrors.${code as 'required'}`) : undefined

/** Name, date of birth and sex, with registration autocomplete tokens. */
export function IdentityFields({ form, errors, onChange }: DetailsFieldsProps) {
  return (
    <div className={styles.grid}>
      <TextField
        label={t('auth.register.givenName')}
        error={fieldError(errors.givenName)}
        size="lg"
        autoComplete="given-name"
        value={form.givenName}
        onValue={(givenName) => onChange({ givenName })}
      />
      <TextField
        label={t('auth.register.familyName')}
        error={fieldError(errors.familyName)}
        size="lg"
        autoComplete="family-name"
        value={form.familyName}
        onValue={(familyName) => onChange({ familyName })}
      />
      <TextField
        label={t('auth.register.birthDate')}
        error={fieldError(errors.birthDate)}
        size="lg"
        type="date"
        autoComplete="bday"
        value={form.birthDate}
        onValue={(birthDate) => onChange({ birthDate })}
      />
      <Field label={t('auth.register.sex')}>
        {(c) => (
          <Select
            {...c}
            size="lg"
            value={form.sex}
            options={SEXES.map((s) => ({ value: s, label: t(`auth.register.sexes.${s}`) }))}
            onChange={(e) => onChange({ sex: e.target.value as DetailsForm['sex'] })}
          />
        )}
      </Field>
    </div>
  )
}

/** Mobile, email, password and the optional hospital number. */
export function ContactFields({ form, errors, onChange }: DetailsFieldsProps) {
  return (
    <>
      <TextField
        label={t('auth.register.mobile')}
        hint={t('auth.register.mobileHint')}
        error={fieldError(errors.mobile)}
        size="lg"
        type="tel"
        autoComplete="tel"
        value={form.mobile}
        onValue={(mobile) => onChange({ mobile })}
      />
      <TextField
        label={t('auth.register.email')}
        error={fieldError(errors.email)}
        size="lg"
        type="email"
        autoComplete="email"
        value={form.email}
        onValue={(email) => onChange({ email })}
      />
      <TextField
        label={t('auth.register.password')}
        hint={t('auth.register.passwordHint')}
        error={fieldError(errors.password)}
        size="lg"
        type="password"
        autoComplete="new-password"
        value={form.password}
        onValue={(password) => onChange({ password })}
      />
      <TextField
        label={t('auth.register.hospitalNumber')}
        hint={t('auth.register.hospitalNumberHint')}
        size="lg"
        autoComplete="off"
        placeholder={t('auth.register.hospitalNumberPlaceholder')}
        value={form.hospitalNumber}
        onValue={(hospitalNumber) => onChange({ hospitalNumber })}
      />
    </>
  )
}
