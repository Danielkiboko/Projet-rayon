import { loadEnvConfig } from '@next/env'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectDir = process.cwd()

loadEnvConfig(projectDir)

const key = process.env.FIREBASE_PRIVATE_KEY
console.log("Starts with quote?", key?.startsWith('"'))
console.log("Has newlines?", key?.includes('\n'))
console.log("Has literal backslash-n?", key?.includes('\\n'))
console.log("JSON stringified:", JSON.stringify(key))
