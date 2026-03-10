import { Queue } from 'bullmq';
import webpush from 'web-push';
import dotenv from 'dotenv';

dotenv.config();

// Configure web-push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) {
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
} else {
    console.warn('VAPID keys are missing from environment variables. Push notifications will fail.');
}

const connection = {
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
    enableOfflineQueue: false,
    maxRetriesPerRequest: null,
    retryStrategy(times: number) {
        if (times > 1) {
            return null; // Stop retrying after 1 attempt
        }
        return 100; // Retry after 100ms
    }
};

// Create a queue for push notifications
export const pushQueue = new Queue('push-notifications', { connection });
