const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
console.log("Service Account Key:", !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    console.log("Parse success");
  } catch(e) {
    console.error("Parse fail", e.message);
  }
}
console.log("Project ID:", !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
console.log("Client Email:", !!process.env.FIREBASE_CLIENT_EMAIL);
