import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const rootDir = resolve(__dirname, '..')
const rootReadme = join(rootDir, 'README.md')
const packagesDir = join(rootDir, 'packages')

if (!existsSync(rootReadme)) {
  console.error(`[update-readme] Root README.md not found at ${rootReadme}`)
  process.exit(1)
}

const content = readFileSync(rootReadme, 'utf8')

const packages = readdirSync(packagesDir).filter((name) => {
  const fullPath = join(packagesDir, name)
  return statSync(fullPath).isDirectory()
})

if (packages.length === 0) {
  console.warn('[update-readme] No sub-packages found under packages/')
  process.exit(0)
}

console.log(`[update-readme] Syncing root README.md to ${packages.length} package(s)...`)

for (const pkg of packages) {
  const target = join(packagesDir, pkg, 'README.md')
  writeFileSync(target, content, 'utf8')
  console.log(`  ✓ synced -> packages/${pkg}/README.md`)
}

console.log(`[update-readme] Done. Synchronized packages: ${packages.join(', ')}`)
