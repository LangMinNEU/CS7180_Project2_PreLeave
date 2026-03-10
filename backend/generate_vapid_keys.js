const fs = require('fs');
const webpush = require('web-push');
const path = require('path');

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

const backendEnvPath = path.join(process.cwd(), '.env');
const frontendEnvPath = path.join(process.cwd(), '../frontend/.env.development');

// Append to Backend .env
const backendEnvContent = `\n# Web Push VAPID Keys\nVAPID_PUBLIC_KEY="${vapidKeys.publicKey}"\nVAPID_PRIVATE_KEY="${vapidKeys.privateKey}"\nVAPID_SUBJECT="mailto:test@example.com"\n`;
fs.appendFileSync(backendEnvPath, backendEnvContent);

// Append to Frontend .env.development
const frontendEnvContent = `\nVITE_VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"\n`;
fs.appendFileSync(frontendEnvPath, frontendEnvContent);

console.log('VAPID keys generated successfully!');
