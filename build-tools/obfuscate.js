import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'
import JavaScriptObfuscator from 'javascript-obfuscator'

const DIST_DIR = join(process.cwd(), 'dist', 'assets')

const OBFUSCATOR_OPTIONS = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.5,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.2,
  stringEncryption: true,
  stringEncryptionThreshold: 0.5,
  rotateStringArray: true,
  shuffleStringArray: true,
  stringArrayThreshold: 0.7,
  unicodeEscapeSequence: false,
  numbersToExpressions: false,
  simplify: true,
  selfDefending: false,
}

function obfuscateDir(dir) {
  let files
  try {
    files = readdirSync(dir)
  } catch {
    console.warn(`Warning: dist/assets not found. Run "npm run build" first.`)
    process.exit(1)
  }

  let count = 0
  for (const file of files) {
    const filePath = join(dir, file)
    const stat = statSync(filePath)
    if (stat.isDirectory()) {
      obfuscateDir(filePath)
      continue
    }
    if (extname(file) !== '.js') continue
    if (file.includes('.map')) continue

    console.log(`Obfuscating: ${file}`)
    try {
      const code = readFileSync(filePath, 'utf8')
      const result = JavaScriptObfuscator.obfuscate(code, OBFUSCATOR_OPTIONS)
      writeFileSync(filePath, result.getObfuscatedCode(), 'utf8')
      count++
    } catch (err) {
      console.error(`Failed to obfuscate ${file}: ${err.message}`)
    }
  }

  if (count > 0) {
    console.log(`\n✓ Obfuscated ${count} JS file(s) in ${dir}`)
  }
}

console.log('\n🔒 CBC Worship Portal — Obfuscating build output...\n')
obfuscateDir(DIST_DIR)
console.log('\n✓ Obfuscation complete. Ready to deploy.\n')
