const { Queue } = require('bullmq');
const IORedis = require('ioredis');

async function resumeQueue() {
  const connection = new IORedis('redis://localhost:6379');
  const ingestionQueue = new Queue('ingestion-queue', { connection });
  
  await ingestionQueue.resume();
  console.log('Ingestion queue has been resumed and is ready for future cron jobs.');
  
  await ingestionQueue.close();
  await connection.quit();
}

resumeQueue().catch(console.error);
