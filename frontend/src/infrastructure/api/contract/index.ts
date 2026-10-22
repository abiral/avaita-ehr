import { schedulingEndpoints } from './scheduling'
import { clinicalLabEndpoints } from './labs'
import { serviceEndpoints } from './services'
import { sessionEndpoints } from './session'
import type { Endpoint } from './types'

export const ENDPOINTS: readonly Endpoint[] = [
  ...sessionEndpoints,
  ...schedulingEndpoints,
  ...serviceEndpoints,
  ...clinicalLabEndpoints,
]
export type { Endpoint, Who } from './types'
