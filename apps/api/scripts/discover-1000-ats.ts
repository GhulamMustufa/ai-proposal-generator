import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env.development' });
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { targetCompanies } from '../src/db/schema';
import * as cheerio from 'cheerio';

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient);

async function run() {
  console.log('Starting Dynamic ATS Discovery...');
  
  // We will scrape a well-known open-source list of tech companies hiring remotely
  // The list often links to their careers pages or directly to ATS boards.
  const sourceUrls = [
    'https://raw.githubusercontent.com/poteto/hiring-without-whiteboards/master/README.md',
    'https://raw.githubusercontent.com/SimplifyJobs/Summer2025-Internships/dev/README.md',
    'https://raw.githubusercontent.com/Ovi/DummyJSON/master/README.md' 
  ];

  let totalText = '';
  for (const url of sourceUrls) {
    try {
      console.log(`Fetching ${url}...`);
      const res = await fetch(url);
      if (res.ok) {
        totalText += await res.text() + '\n';
      }
    } catch (e) {
      console.error(`Failed to fetch ${url}`, e);
    }
  }

  // Regex to find ATS board tokens
  const greenhouseRegex = /boards\.greenhouse\.io\/([a-zA-Z0-9-]+)/g;
  const leverRegex = /jobs\.lever\.co\/([a-zA-Z0-9-]+)/g;
  const workableRegex = /apply\.workable\.com\/([a-zA-Z0-9-]+)/g;
  
  const foundCompanies = new Map<string, { provider: string, token: string }>();

  // Extract Greenhouse
  let match;
  while ((match = greenhouseRegex.exec(totalText)) !== null) {
    const token = match[1].toLowerCase();
    if (token !== 'greenhouse') foundCompanies.set(token, { provider: 'greenhouse', token });
  }

  // Extract Lever
  while ((match = leverRegex.exec(totalText)) !== null) {
    const token = match[1].toLowerCase();
    if (token !== 'lever') foundCompanies.set(token, { provider: 'lever', token });
  }

  // Extract Workable
  while ((match = workableRegex.exec(totalText)) !== null) {
    const token = match[1].toLowerCase();
    if (token !== 'workable') foundCompanies.set(token, { provider: 'workable', token });
  }

  // Also hardcode some massive ones to ensure premium coverage
  const topTech = [
    { token: 'stripe', provider: 'greenhouse' },
    { token: 'discord', provider: 'greenhouse' },
    { token: 'figma', provider: 'greenhouse' },
    { token: 'airbnb', provider: 'greenhouse' },
    { token: 'plaid', provider: 'greenhouse' },
    { token: 'coinbase', provider: 'greenhouse' },
    { token: 'netflix', provider: 'lever' },
    { token: 'spotify', provider: 'lever' },
    { token: 'shopify', provider: 'smartrecruiters' }, 
    { token: 'kpmg', provider: 'lever' },
    { token: 'roberthalf', provider: 'workable' }, 
    { token: 'teksystems', provider: 'greenhouse' } 
  ];

  for (const tech of topTech) {
    foundCompanies.set(tech.token, tech);
  }

  console.log(`Discovered ${foundCompanies.size} unique ATS boards!`);

  // Bulk insert them into our database
  let inserted = 0;
  for (const [token, data] of foundCompanies.entries()) {
    try {
      await db.insert(targetCompanies).values({
        name: token.charAt(0).toUpperCase() + token.slice(1),
        atsProvider: data.provider,
        atsBoardToken: data.token,
      }).onConflictDoNothing();
      inserted++;
    } catch (e) {
      console.error(`Error inserting ${token}:`, e);
    }
  }

  console.log(`Successfully injected ${inserted} target companies into the ATS Engine database!`);
  process.exit(0);
}

run().catch(console.error);
