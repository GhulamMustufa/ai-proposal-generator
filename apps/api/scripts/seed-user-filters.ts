import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env.development' });
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { users, userProfiles } from '../src/db/schema';
import { eq } from 'drizzle-orm';

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient);

async function run() {
  console.log('Seeding user filters...');
  
  // Get the first user
  let allUsers = await db.select().from(users).limit(1);
  if (allUsers.length === 0) {
    console.log('No users found. Creating a dummy user...');
    await db.insert(users).values({
      id: 'user_dummy_123',
      email: 'test@example.com'
    });
    allUsers = await db.select().from(users).limit(1);
  }
  
  const user = allUsers[0];
  console.log(`Found user ${user.id}`);

  const filters = {
    workArrangement: {
      employmentType: ["Contract", "Freelance/1099", "Full-Time (W2)", "Part-Time"],
      workSetup: ["100% Remote", "Remote - Worldwide / Anywhere", "Remote - Malaysia", "Singapore", "Pakistan", "Middle East", "Hybrid", "On-Site"]
    },
    experienceLevel: ["Mid-Level (3-5 years)", "Senior (5-8+ years)"],
    compensation: {
      salaryFloor: "Must state compensation min $300k to $360k annually (if listed)",
      hourlyRateFloor: "Must be at least $30/hour (if listed)",
      equity: "Must include equity, stock options, or profit sharing",
      note: "CRITICAL: Many companies hide salaries. DO NOT reject a job just because salary is missing. Only reject if the salary is explicitly stated and is below the minimum."
    },
    companyAndIndustry: {
      stage: ["Early-stage Startup (Seed/Series A)", "Growth Stage (Series B/C)", "Agency / Software House"],
      niches: ["Web3 / Crypto", "Fintech", "Healthcare / MedTech", "AI / Machine Learning", "E-Commerce"]
    },
    visaAndCitizenship: {
      citizenship: "Must NOT require US Citizenship. If it says US Citizenship required, REJECT.",
      clearance: "No Security Clearance Required. If it requires active clearance, REJECT."
    },
    targetRegions: [
      "Remote", "United States", "Canada", "Latin America (LATAM)", "Europe (EU / Non-EU)", 
      "Middle East: (UAE/Dubai, Saudi Arabia, Qatar)", "Asia-Pacific (APAC)", 
      "South Asia: (India, Pakistan, Bangladesh)", "Southeast Asia (SEA): (Singapore, Philippines, Vietnam, Indonesia, Malaysia)", 
      "East Asia: (Japan, South Korea, Taiwan)", "Oceania: (Australia, New Zealand)"
    ]
  };

  // Check if profile exists
  const profiles = await db.select().from(userProfiles).where(eq(userProfiles.userId, user.id));
  
  if (profiles.length > 0) {
    await db.update(userProfiles)
      .set({ jobFilters: filters })
      .where(eq(userProfiles.userId, user.id));
    console.log('Updated existing profile with filters!');
  } else {
    // We should also set dummy skills so it passes the pre-filter length check
    await db.insert(userProfiles).values({
      userId: user.id,
      jobFilters: filters,
      skills: ["React", "Node", "TypeScript", "Next.js", "AI", "PostgreSQL", "JavaScript", "Frontend", "Backend", "Fullstack"]
    });
    console.log('Created new profile with filters and dummy skills!');
  }

  process.exit(0);
}

run().catch(console.error);
