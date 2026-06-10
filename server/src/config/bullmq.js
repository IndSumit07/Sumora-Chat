import { Queue, Worker, QueueEvents } from 'bullmq';
import { getRedisClient } from './redis.js';
import logger from './logger.js';
import { sendEmailDirect } from '../services/email.service.js';

const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
};

// Email Queue
export const emailQueue = new Queue('email', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

// Email Worker
export const emailWorker = new Worker(
  'email',
  async (job) => {
    const { to, subject, html, text } = job.data;
    logger.info(`Processing email job ${job.id}: to=${to}, subject=${subject}`);

    await sendEmailDirect({ to, subject, html, text });

    logger.info(`Email job ${job.id} completed: sent to ${to}`);
    return { sent: true, to, jobId: job.id };
  },
  {
    connection,
    concurrency: 5,
    limiter: {
      max: 50,
      duration: 60000, // 50 emails per minute
    },
  }
);

// Queue Events for monitoring
const emailQueueEvents = new QueueEvents('email', { connection });

emailQueueEvents.on('completed', ({ jobId, returnvalue }) => {
  logger.info(`Email queue job ${jobId} completed`);
});

emailQueueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error(`Email queue job ${jobId} failed: ${failedReason}`);
});

emailWorker.on('error', (err) => {
  logger.error(`Email worker error: ${err.message}`);
});

// Helper to add email to queue
export const queueEmail = async ({ to, subject, html, text }) => {
  const job = await emailQueue.add(
    'send-email',
    { to, subject, html, text },
    {
      priority: 1,
      delay: 0,
    }
  );
  logger.info(`Email queued: job=${job.id}, to=${to}`);
  return job;
};

export const closeBullMQ = async () => {
  await emailWorker.close();
  await emailQueue.close();
  await emailQueueEvents.close();
  logger.info('BullMQ queues and workers closed');
};

export default emailQueue;
