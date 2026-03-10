import fs from 'fs';
import webpush from 'web-push';
import path from 'path';

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

const backendEnvPath = path.join(process.cwd(), '.env');
const frontendEnvPath = path.join(process.cwd(), '../frontend/.env.local');

// Append to Backend .env
const backendEnvContent = `\n# Web Push VAPID Keys\nVAPID_PUBLIC_KEY="${vapidKeys.publicKey}"\nVAPID_PRIVATE_KEY="${vapidKeys.privateKey}"\nVAPID_SUBJECT="mailto:test@example.com"\n`;
fs.appendFileSync(backendEnvPath, backendEnvContent);

// Append to Frontend .env.local
const frontendEnvContent = `\nVITE_VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"\n`;
fs.appendFileSync(frontendEnvPath, frontendEnvContent);

console.log('VAPID keys generated successfully!');
