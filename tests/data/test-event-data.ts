import { z } from 'zod'

import { EventSchemas } from '../../src'

export type TestEventMap = {
  message: string
}

export const testSchemas = {
  message: z.string(),
} satisfies EventSchemas<TestEventMap>
