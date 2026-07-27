const { Queue } = require('bullmq');
const IORedis = require('ioredis');

async function clearQueue() {
  console.log('Connecting to Redis to clear ingestion-queue...');
  const connection = new IORedis('redis://localhost:6379');
  
  const ingestionQueue = new Queue('ingestion-queue', { connection });
  
  // Pause queue
  await ingestionQueue.pause();
  
  // Clean all jobs
  await ingestionQueue.obliterate({ force: true });
  
  console.log('All pending and active ingestion jobs have been successfully cancelled and removed.');
  
  await ingestionQueue.close();
  await connection.quit();
}

clearQueue().catch(console.error);
