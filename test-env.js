const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
const key = process.env.FIREBASE_PRIVATE_KEY;
console.log("Starts with quote?", key?.startsWith('"'))
console.log("Has newlines?", key?.includes('\n'))
console.log("Has literal backslash-n?", key?.includes('\\n'))
console.log("JSON stringified:", JSON.stringify(key))
