import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { generateEmbedding, generateEmbeddings } from '../src/utils/embeddings';
import * as schema from '../src/db/schema';
import { isNull, sql } from 'drizzle-orm';

config();

async function run() {
  console.log('Starting backfill of vectors...');
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in .env');
  }

  const sqlClient = neon(process.env.DATABASE_URL);
  const db = drizzle(sqlClient, { schema });

  // 1. Backfill Personas
  console.log('Fetching personas without embeddings...');
  const personasWithoutEmbeddings = await db
    .select()
    .from(schema.personas)
    .where(isNull(schema.personas.embedding));

  console.log(`Found ${personasWithoutEmbeddings.length} personas to backfill.`);

  for (const persona of personasWithoutEmbeddings) {
    try {
      const skillsText = Array.isArray(persona.skills) ? persona.skills.join(', ') : '';
      const textToEmbed = `${persona.name} ${skillsText} ${persona.resumeText || ''}`;
      const embedding = await generateEmbedding(textToEmbed);

      await db
        .update(schema.personas)
        .set({ embedding })
        .where(sql`${schema.personas.id} = ${persona.id}`);

      console.log(`Successfully embedded persona ${persona.id}`);
    } catch (e) {
      console.error(`Failed to embed persona ${persona.id}:`, e);
    }
  }

  // 2. Backfill Jobs
  console.log('Fetching jobs without embeddings...');
  const jobsWithoutEmbeddings = await db
    .select({
      id: schema.jobs.id,
      title: schema.jobs.title,
      description: schema.jobs.description
    })
    .from(schema.jobs)
    .where(isNull(schema.jobs.embedding));

  console.log(`Found ${jobsWithoutEmbeddings.length} jobs to backfill.`);

  // Batch process jobs in chunks of 100
  const chunkSize = 100;
  for (let i = 0; i < jobsWithoutEmbeddings.length; i += chunkSize) {
    const chunk = jobsWithoutEmbeddings.slice(i, i + chunkSize);
    console.log(`Processing jobs chunk ${i} to ${i + chunk.length}...`);
    
    try {
      const texts = chunk.map(j => `${j.title} ${j.description}`);
      const embeddings = await generateEmbeddings(texts);

      // Update jobs (we have to do it sequentially or via a massive case statement, 
      // but sequential is okay since Neon handles quick sequential queries well)
      let count = 0;
      for (let j = 0; j < chunk.length; j++) {
        await db
          .update(schema.jobs)
          .set({ embedding: embeddings[j] })
          .where(sql`${schema.jobs.id} = ${chunk[j].id}`);
        count++;
      }
      console.log(`Successfully updated ${count} jobs in chunk.`);
    } catch (e) {
      console.error('Failed to embed job chunk:', e);
    }
  }

  console.log('Backfill complete!');
}

run();
