import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env.development' });
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function run() {
  console.log('Running comprehensive database migration...');

  try {
    // Drop tables in correct order to remove bad schema
    await sql.query('DROP TABLE IF EXISTS applications CASCADE');
    await sql.query('DROP TABLE IF EXISTS ai_matches CASCADE');
    await sql.query('DROP TABLE IF EXISTS user_profiles CASCADE');
    await sql.query('DROP TABLE IF EXISTS users CASCADE');
    await sql.query('DROP TABLE IF EXISTS jobs CASCADE');
    await sql.query('DROP TABLE IF EXISTS target_companies CASCADE');
    
    await sql.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        stripe_customer_id TEXT,
        subscription_status TEXT DEFAULT 'free',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('users table created');

    await sql.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        platform TEXT NOT NULL,
        external_id TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        company TEXT,
        description TEXT,
        url TEXT NOT NULL,
        scraped_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('jobs table created');

    await sql.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL REFERENCES users(id),
        contact_details JSONB,
        skills JSONB,
        job_filters JSONB,
        resume_text TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('user_profiles table created');

    await sql.query(`
      CREATE TABLE IF NOT EXISTS ai_matches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL REFERENCES users(id),
        job_id UUID NOT NULL REFERENCES jobs(id),
        match_score INTEGER NOT NULL,
        match_reasoning TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('ai_matches table created');

    await sql.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL REFERENCES users(id),
        job_id UUID REFERENCES jobs(id),
        job_description TEXT,
        job_title TEXT,
        job_link TEXT,
        generated_proposal TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        pdf_url TEXT,
        submission_logs JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('applications table created');

    await sql.query(`
      CREATE TABLE IF NOT EXISTS target_companies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        ats_provider TEXT NOT NULL,
        ats_board_token TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('target_companies table created');

    console.log('Migration successful!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
  process.exit(0);
}

run();
