import { Queue } from 'bullmq';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const queue = new Queue('ingestion-queue', {
  connection: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
  }
});

async function run() {
  await queue.add('scrape-jobcity', { manual: true });
  console.log('Added Jobcity scrape job to BullMQ.');
  process.exit(0);
}
run();
