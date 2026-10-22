import type { SeedPatient } from './patients'

const O = (id: string, displayName: string, sex: 'male' | 'female', birthDate: string, mrn: string): SeedPatient => ({
  id,
  mrn,
  displayName,
  givenName: displayName.split(' ')[0] ?? displayName,
  sex,
  birthDate,
  facilityId: 'fac_nvg',
  bed: null,
  ward: null,
  attendingId: null,
  admittedAt: null,
  diagnosis: '',
  flags: ['nkda'],
  next: '',
  nextTone: 'neutral',
  seenAt: null,
})

/** Outpatients from the clinic schedule, refill queue and leave impact designs. */
export const OUTPATIENTS: readonly SeedPatient[] = [
  O('pt_laxmi', 'Laxmi Thapa', 'female', '1969-02-11', 'NVG-202214'),
  O('pt_rajan', 'Rajan KC', 'male', '1977-05-30', 'NVG-197731'),
  O('pt_anita', 'Anita Sherpa', 'female', '1983-08-08', 'NVG-200455'),
  O('pt_prem', 'Prem Lama', 'male', '1990-12-01', 'NVG-201118'),
  O('pt_bhim', 'Bhim Gurung', 'male', '1959-06-21', 'NVG-196602'),
  O('pt_sarita', 'Sarita Rana', 'female', '1988-04-17', 'NVG-205870'),
  O('pt_kiran', 'Kiran Bista', 'male', '1971-09-03', 'NVG-193340'),
  O('pt_usha', 'Usha Magar', 'female', '1966-01-25', 'NVG-191207'),
  O('pt_nabin', 'Nabin Thakuri', 'male', '1980-07-14', 'NVG-204990'),
  O('pt_gita', 'Gita Shrestha', 'female', '1975-03-19', 'NVG-198812'),
  O('pt_plama', 'Prakash Lama', 'male', '1962-10-02', 'NVG-190033'),
  O('pt_sunitakc', 'Sunita KC', 'female', '1993-11-27', 'NVG-206311'),
  O('pt_bishnu', 'Bishnu Tamang', 'male', '1956-02-06', 'NVG-187954'),
]
