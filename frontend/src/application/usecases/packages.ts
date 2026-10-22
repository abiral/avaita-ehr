import { AppError } from '@/core/errors'
import {
  canChooseFormat,
  draftProblems,
  firstVisitMode,
  type ConsultationPackage,
  type PackageDraft,
  type PackageEnrollment,
  type PackageFormat,
} from '@/domain/packages'
import type { PackageRepository } from '../ports'
import { outcome, type Outcome } from './outcome'

/** Saves a draft, or saves and publishes it, after the same checks the server runs. */
export const savePackage =
  (deps: { packages: Pick<PackageRepository, 'save' | 'publish'> }) =>
  async (input: { draft: PackageDraft; publish: boolean }): Promise<Outcome<ConsultationPackage>> => {
    if (draftProblems(input.draft).length > 0) throw new AppError('Package draft incomplete', 'validation_failed')
    const saved = await deps.packages.save({ ...input.draft, published: input.publish })
    return outcome(input.publish ? await deps.packages.publish(saved.id) : saved)
  }

/** Books a package; the first visit mode comes from the format strategy (hybrid starts on-site). */
export const bookPackage =
  (deps: { packages: Pick<PackageRepository, 'enroll'> }) =>
  async (input: {
    pkg: Pick<ConsultationPackage, 'id' | 'format'>
    chosenFormat: PackageFormat
    start: Date
  }): Promise<Outcome<PackageEnrollment>> => {
    if (!canChooseFormat(input.pkg, input.chosenFormat)) throw new AppError('Format not offered', 'mode_not_offered')
    const firstVisit = { start: input.start, mode: firstVisitMode(input.chosenFormat) }
    return outcome(
      await deps.packages.enroll({ packageId: input.pkg.id, chosenFormat: input.chosenFormat, firstVisit }),
    )
  }
