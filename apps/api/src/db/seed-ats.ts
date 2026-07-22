import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { targetCompanies } from './schema';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const companies = [
  // --- GREENHOUSE (30 companies) ---
  { name: 'Stripe', atsProvider: 'greenhouse', atsBoardToken: 'stripe' },
  { name: 'Airbnb', atsProvider: 'greenhouse', atsBoardToken: 'airbnb' },
  { name: 'Coinbase', atsProvider: 'greenhouse', atsBoardToken: 'coinbase' },
  { name: 'Discord', atsProvider: 'greenhouse', atsBoardToken: 'discord' },
  { name: 'Pinterest', atsProvider: 'greenhouse', atsBoardToken: 'pinterest' },
  { name: 'Figma', atsProvider: 'greenhouse', atsBoardToken: 'figma' },
  { name: 'Vercel', atsProvider: 'greenhouse', atsBoardToken: 'vercel' },
  { name: 'Plaid', atsProvider: 'greenhouse', atsBoardToken: 'plaid' },
  { name: 'Dropbox', atsProvider: 'greenhouse', atsBoardToken: 'dropbox' },
  { name: 'Lyft', atsProvider: 'greenhouse', atsBoardToken: 'lyft' },
  { name: 'GitLab', atsProvider: 'greenhouse', atsBoardToken: 'gitlab' },
  { name: 'HashiCorp', atsProvider: 'greenhouse', atsBoardToken: 'hashicorp' },
  { name: 'Datadog', atsProvider: 'greenhouse', atsBoardToken: 'datadog' },
  { name: 'Twilio', atsProvider: 'greenhouse', atsBoardToken: 'twilio' },
  { name: 'Snowflake', atsProvider: 'greenhouse', atsBoardToken: 'snowflake' },
  { name: 'Cloudflare', atsProvider: 'greenhouse', atsBoardToken: 'cloudflare' },
  { name: 'OpenAI', atsProvider: 'greenhouse', atsBoardToken: 'openai' },
  { name: 'Anthropic', atsProvider: 'greenhouse', atsBoardToken: 'anthropic' },
  { name: 'Scale AI', atsProvider: 'greenhouse', atsBoardToken: 'scaleai' },
  { name: 'Hugging Face', atsProvider: 'greenhouse', atsBoardToken: 'huggingface' },
  { name: 'Vanta', atsProvider: 'greenhouse', atsBoardToken: 'vanta' },
  { name: 'Brex', atsProvider: 'greenhouse', atsBoardToken: 'brex' },
  { name: 'Deel', atsProvider: 'greenhouse', atsBoardToken: 'deel' },
  { name: 'Gusto', atsProvider: 'greenhouse', atsBoardToken: 'gusto' },
  { name: 'Canva', atsProvider: 'greenhouse', atsBoardToken: 'canva' },
  { name: 'Miro', atsProvider: 'greenhouse', atsBoardToken: 'miro' },
  { name: 'Airtable', atsProvider: 'greenhouse', atsBoardToken: 'airtable' },
  { name: 'Webflow', atsProvider: 'greenhouse', atsBoardToken: 'webflow' },
  { name: 'Zapier', atsProvider: 'greenhouse', atsBoardToken: 'zapier' },
  { name: 'Supabase', atsProvider: 'greenhouse', atsBoardToken: 'supabase' },

  // --- LEVER (30 companies) ---
  { name: 'Shopify', atsProvider: 'lever', atsBoardToken: 'shopify' },
  { name: 'Affirm', atsProvider: 'lever', atsBoardToken: 'affirm' },
  { name: 'Asana', atsProvider: 'lever', atsBoardToken: 'asana' },
  { name: 'Atlassian', atsProvider: 'lever', atsBoardToken: 'atlassian' },
  { name: 'Eventbrite', atsProvider: 'lever', atsBoardToken: 'eventbrite' },
  { name: 'Palantir', atsProvider: 'lever', atsBoardToken: 'palantir' },
  { name: 'Peloton', atsProvider: 'lever', atsBoardToken: 'peloton' },
  { name: 'Roblox', atsProvider: 'lever', atsBoardToken: 'roblox' },
  { name: 'Robinhood', atsProvider: 'lever', atsBoardToken: 'robinhood' },
  { name: 'Roku', atsProvider: 'lever', atsBoardToken: 'roku' },
  { name: 'Splunk', atsProvider: 'lever', atsBoardToken: 'splunk' },
  { name: 'Block', atsProvider: 'lever', atsBoardToken: 'block' },
  { name: 'Zillow', atsProvider: 'lever', atsBoardToken: 'zillow' },
  { name: 'Instacart', atsProvider: 'lever', atsBoardToken: 'instacart' },
  { name: 'DoorDash', atsProvider: 'lever', atsBoardToken: 'doordash' },
  { name: 'Reddit', atsProvider: 'lever', atsBoardToken: 'reddit' },
  { name: 'Quora', atsProvider: 'lever', atsBoardToken: 'quora' },
  { name: 'Medium', atsProvider: 'lever', atsBoardToken: 'medium' },
  { name: 'Patreon', atsProvider: 'lever', atsBoardToken: 'patreon' },
  { name: 'Gumroad', atsProvider: 'lever', atsBoardToken: 'gumroad' },
  { name: 'Substack', atsProvider: 'lever', atsBoardToken: 'substack' },
  { name: 'Twitch', atsProvider: 'lever', atsBoardToken: 'twitch' },
  { name: 'Vimeo', atsProvider: 'lever', atsBoardToken: 'vimeo' },
  { name: 'Dribbble', atsProvider: 'lever', atsBoardToken: 'dribbble' },
  { name: 'InVision', atsProvider: 'lever', atsBoardToken: 'invision' },
  { name: 'Framer', atsProvider: 'lever', atsBoardToken: 'framer' },
  { name: 'Yelp', atsProvider: 'lever', atsBoardToken: 'yelp' },
  { name: 'Klaviyo', atsProvider: 'lever', atsBoardToken: 'klaviyo' },
  { name: 'Notion', atsProvider: 'lever', atsBoardToken: 'notion' },
  { name: 'Loom', atsProvider: 'lever', atsBoardToken: 'loom' },

  // --- SMARTRECRUITERS (10 companies) ---
  { name: 'Ubisoft', atsProvider: 'smartrecruiters', atsBoardToken: 'ubisoft' },
  { name: 'Visa', atsProvider: 'smartrecruiters', atsBoardToken: 'visa' },
  { name: 'Bosch', atsProvider: 'smartrecruiters', atsBoardToken: 'bosch' },
  { name: 'Biogen', atsProvider: 'smartrecruiters', atsBoardToken: 'biogen' },
  { name: 'Equinox', atsProvider: 'smartrecruiters', atsBoardToken: 'equinox' },
  { name: 'Skechers', atsProvider: 'smartrecruiters', atsBoardToken: 'skechers' },
  { name: 'Colliers', atsProvider: 'smartrecruiters', atsBoardToken: 'colliers' },
  { name: 'Kincentric', atsProvider: 'smartrecruiters', atsBoardToken: 'kincentric' },
  { name: 'Avery Dennison', atsProvider: 'smartrecruiters', atsBoardToken: 'averydennison' },
  { name: 'Alcoa', atsProvider: 'smartrecruiters', atsBoardToken: 'alcoa' },

  // --- WORKABLE (10 companies) ---
  { name: 'Decluttr', atsProvider: 'workable', atsBoardToken: 'decluttr' },
  { name: 'Lyst', atsProvider: 'workable', atsBoardToken: 'lyst' },
  { name: 'Monese', atsProvider: 'workable', atsBoardToken: 'monese' },
  { name: 'Tractor Ventures', atsProvider: 'workable', atsBoardToken: 'tractor-ventures' },
  { name: 'Printify', atsProvider: 'workable', atsBoardToken: 'printify' },
  { name: 'Typeform', atsProvider: 'workable', atsBoardToken: 'typeform' },
  { name: 'Revolut', atsProvider: 'workable', atsBoardToken: 'revolut' },
  { name: 'Hootsuite', atsProvider: 'workable', atsBoardToken: 'hootsuite' },
  { name: 'Babbel', atsProvider: 'workable', atsBoardToken: 'babbel' },
  { name: 'Prezi', atsProvider: 'workable', atsBoardToken: 'prezi' },

  // --- ASHBY HQ (10 companies) ---
  { name: 'Ramp', atsProvider: 'ashby', atsBoardToken: 'ramp' },
  { name: 'Cursor', atsProvider: 'ashby', atsBoardToken: 'cursor' },
  { name: 'Multi', atsProvider: 'ashby', atsBoardToken: 'multi' },
  { name: 'Glean', atsProvider: 'ashby', atsBoardToken: 'glean' },
  { name: 'Linear', atsProvider: 'ashby', atsBoardToken: 'linear' },
  { name: 'Raycast', atsProvider: 'ashby', atsBoardToken: 'raycast' },
  { name: 'Pinecone', atsProvider: 'ashby', atsBoardToken: 'pinecone' },
  { name: 'Replit', atsProvider: 'ashby', atsBoardToken: 'replit' },
  { name: 'Fly.io', atsProvider: 'ashby', atsBoardToken: 'fly' },
  { name: 'Vercel', atsProvider: 'ashby', atsBoardToken: 'vercel_ashby' },

  // --- BREEZY HR (10 companies) ---
  { name: 'Nokia', atsProvider: 'breezy', atsBoardToken: 'nokia' },
  { name: 'Toptal', atsProvider: 'breezy', atsBoardToken: 'toptal' },
  { name: 'Doist', atsProvider: 'breezy', atsBoardToken: 'doist' },
  { name: 'Zapier', atsProvider: 'breezy', atsBoardToken: 'zapier_breezy' },
  { name: 'InVision', atsProvider: 'breezy', atsBoardToken: 'invisionapp' },
  { name: 'Automattic', atsProvider: 'breezy', atsBoardToken: 'automattic' },
  { name: 'Ghost', atsProvider: 'breezy', atsBoardToken: 'ghost' },
  { name: 'Buffer', atsProvider: 'breezy', atsBoardToken: 'buffer' },
  { name: 'Hotjar', atsProvider: 'breezy', atsBoardToken: 'hotjar' },
  { name: 'ConvertKit', atsProvider: 'breezy', atsBoardToken: 'convertkit' },
];

async function seed() {
  console.log(`Seeding ${companies.length} target companies...`);
  try {
    for (const company of companies) {
      await db.insert(targetCompanies).values(company).onConflictDoNothing();
      process.stdout.write('.');
    }
    console.log('\n✅ Successfully seeded target companies.');
  } catch (error) {
    console.error('Error seeding ATS targets:', error);
  }
}

seed();
