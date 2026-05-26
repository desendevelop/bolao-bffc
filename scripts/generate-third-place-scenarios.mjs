import fs from 'node:fs'
import path from 'node:path'

const [inputPath, outputPath] = process.argv.slice(2)

if (!inputPath || !outputPath) {
  console.error('Uso: node scripts/generate-third-place-scenarios.mjs <input> <output>')
  process.exit(1)
}

const raw = fs.readFileSync(inputPath, 'utf8')
const lines = raw.split(/\r?\n/)
const scenarios = {}

for (const line of lines) {
  const trimmed = line.trim()
  if (!trimmed.startsWith('| ')) continue

  const parts = trimmed
    .split('|')
    .map(part => part.trim())
    .filter(Boolean)

  if (parts.length !== 17) continue
  if (!/^\d+$/.test(parts[0])) continue

  const groups = parts.slice(1, 9)
  const assignments = parts.slice(9, 17)
  const signature = groups.join('')

  scenarios[signature] = {
    A: assignments[0].replace(/^3/, ''),
    B: assignments[1].replace(/^3/, ''),
    D: assignments[2].replace(/^3/, ''),
    E: assignments[3].replace(/^3/, ''),
    G: assignments[4].replace(/^3/, ''),
    I: assignments[5].replace(/^3/, ''),
    K: assignments[6].replace(/^3/, ''),
    L: assignments[7].replace(/^3/, ''),
  }
}

const content =
  '// Arquivo gerado automaticamente a partir da tabela de combinações da Copa 2026.\n' +
  `export const THIRD_PLACE_SCENARIOS = ${JSON.stringify(scenarios, null, 2)}\n`

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, content, 'utf8')

console.log(`Cenários gerados: ${Object.keys(scenarios).length}`)
