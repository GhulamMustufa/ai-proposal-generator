import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/db/schema';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables from apps/api/.env
dotenv.config({ path: join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set in .env');
  process.exit(1);
}

const sql = neon(connectionString);
const db = drizzle(sql, { schema });

const skills = [
  'React Native', 'iOS', 'Android', 'Expo', 'React Navigation', 'Native Modules', 
  'Hermes', 'FlatList', 'WatermelonDB', 'AsyncStorage', 'Offline-First Architecture',
  'React', 'React.js', 'Next.js', 'TypeScript', 'JavaScript', 'ES6+', 'HTML5', 
  'CSS3', 'Redux', 'Zustand', 'TailwindCSS', 'Material UI', 'React Query', 'WCAG 2.1',
  'Node.js', 'NestJS', 'Express.js', 'Koa.js', 'GraphQL', 'RESTful APIs', 'Prisma', 
  'JWT', 'OAuth2', 'WebSockets',
  'PostgreSQL', 'MongoDB', 'Firebase', 'Firestore', 'Supabase',
  'AWS', 'EC2', 'S3', 'Lambda', 'Vercel', 'Docker', 'GitHub Actions', 'Fastlane', 'CI/CD',
  'OpenAI API', 'LLM Integration', 'Function Calling', 'Streaming APIs', 'SSE', 
  'Prompt Engineering', 'AI dashboards',
  'Jest', 'RTL', 'React Testing Library', 'Cypress', 'Playwright', 'Detox', 
  'Git', 'GitHub', 'Jira', 'Figma', 'Postman', 'Swagger', 'Sentry', 'Crashlytics', 
  'Flipper', 'Xcode', 'Android Studio',
  'SaaS', 'Fintech', 'E-commerce', 'B2B', 'System Design', 'Performance Optimization'
];

async function main() {
  console.log('Injecting keywords into user profiles...');
  
  // We will simply update ALL user profiles to have these skills for the MVP personal usecase
  const result = await db.update(schema.userProfiles).set({
    skills: skills,
  }).returning();

  if (result.length > 0) {
    console.log(`Successfully injected ${skills.length} skills into ${result.length} user profile(s).`);
  } else {
    // If no user profile exists, let's create a dummy user and profile
    console.log('No user profiles found. Creating a dummy user with these skills...');
    const userId = 'user_dummy_123';
    
    await db.insert(schema.users).values({
      id: userId,
      email: 'test@example.com',
    }).onConflictDoNothing();

    await db.insert(schema.userProfiles).values({
      userId: userId,
      skills: skills,
    }).onConflictDoNothing();
    
    console.log('Created dummy user and injected skills.');
  }
  
  process.exit(0);
}

main().catch((err) => {
  console.error('Failed to seed skills:', err);
  process.exit(1);
});
