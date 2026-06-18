import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts']
  },
  resolve: {
    alias: {
      '@triggerix/core': resolve(__dirname, 'packages/core/src/index.ts'),
      '@triggerix/schema': resolve(__dirname, 'packages/schema/src/index.ts'),
      '@triggerix/validator': resolve(__dirname, 'packages/validator/src/index.ts'),
      '@triggerix/json-schema': resolve(__dirname, 'packages/json-schema/src/index.ts'),
      '@triggerix/runtime': resolve(__dirname, 'packages/runtime/src/index.ts'),
      '@triggerix/registry': resolve(__dirname, 'packages/registry/src/index.ts'),
      '@triggerix/editor': resolve(__dirname, 'packages/editor/src/index.ts')
    }
  }
})
