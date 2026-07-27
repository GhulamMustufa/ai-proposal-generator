const { Queue } = require('bullmq');
const IORedis = require('ioredis');

async function triggerAll() {
  console.log('Connecting to Redis...');
  const connection = new IORedis('redis://localhost:6379');
  
  const ingestionQueue = new Queue('ingestion-queue', { connection });
  
  const sources = [
    'scrape-remotive',
    'scrape-wwr',
    'scrape-remoteok',
    'scrape-upwork',
    'scrape-freelancer',
    'scrape-workingnomads',
    'scrape-himalayas',
    'scrape-jobicy',
    'scrape-arbeitnow',
    'scrape-remoteco',
    'scrape-dribbble',
    'scrape-relocateme',
    'scrape-ats-greenhouse',
    'scrape-ats-lever',
    'scrape-ats-smartrecruiters',
    'scrape-ats-workable',
    'scrape-ats-breezy',
    'scrape-ats-ashby',
    'scrape-dorks',
    'scrape-jobcity',
    'scrape-hackernews',
    'scrape-braintrust',
  ];

  console.log(`Adding ${sources.length} jobs to ingestion-queue...`);
  
  for (const source of sources) {
    await ingestionQueue.add(source, { manual: true });
    console.log(`Enqueued: ${source}`);
  }
  
  console.log('All jobs triggered successfully!');
  await ingestionQueue.close();
  await connection.quit();
}

triggerAll().catch(console.error);
