import { Worker, Job } from 'bullmq';
import webpush, { PushSubscription } from 'web-push';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

export const processPushJobData = async (jobId: string, tripId: string, userId: string, title: string, body: string) => {
    console.log(`Processing push job ${jobId} for trip ${tripId}`);

    try {
        // Get user's push subscription
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user || !user.push_subscription) {
            console.log(`User ${userId} does not have a push subscription.`);
            return;
        }

        const subscription = user.push_subscription as any as PushSubscription;

        const payload = JSON.stringify({
            title,
            body,
            url: '/profile' // When clicked, the notification will direct here
        });

        await webpush.sendNotification(subscription, payload);
        console.log(`Push notification sent successfully for trip ${tripId}`);

    } catch (error) {
        console.error(`Failed to send push notification for job ${jobId}:`, error);
        throw error; // Will retry if configured
    }
};

export const startWorker = () => {
    const worker = new Worker(
        'push-notifications',
        async (job: Job) => {
            const { userId, title, body } = job.data;
            await processPushJobData(job.id || 'unknown', job.data.tripId, userId, title, body);
        },
        { connection }
    );

    worker.on('ready', () => {
        console.log('Push notification worker is running...');
    });

    worker.on('failed', (job, err) => {
        console.error(`Job ${job?.id} failed with error ${err.message}`);
    });

    return worker;
};
