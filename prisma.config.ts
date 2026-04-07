import { defineConfig } from 'prisma/config'
import path from 'node:path'

export default defineConfig({
  schema: path.join(__dirname, 'prisma/schema.prisma'),
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: `file:${path.join(__dirname, 'prisma/dev.db')}`,
  },
})
