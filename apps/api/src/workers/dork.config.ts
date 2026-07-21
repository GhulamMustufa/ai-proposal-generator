/**
 * Google Dork Queries for automated Job Sourcing.
 * Optimized for a 250 Searches/Month limit on SerpApi.
 * 
 * Strategy: Execute these 8 queries once daily (240 searches/month).
 * By heavily utilizing the 'OR' operator, one query scrapes multiple platforms and tech stacks.
 */
export const DORK_QUERIES = [
  // 1. HACKER NEWS (High Quality Startup Jobs)
  'site:news.ycombinator.com/item "who is hiring" ("React Native" OR "React" OR "Next.js" OR "Node.js" OR "TypeScript" OR "AI") ("remote" OR "contract" OR "freelance" OR "part time" OR "full time")',

  // 2. TWITTER / X (Real-time Founder Posts)
  '(site:twitter.com OR site:x.com) ("looking for a developer" OR "hiring") ("React Native" OR "React" OR "Next.js" OR "Node.js" OR "TypeScript" OR "AI") ("remote" OR "contract" OR "freelance" OR "part time" OR "full time")',

  // 3. LINKEDIN POSTS (Bypassing the standard Jobs Board)
  'site:linkedin.com/posts ("hiring" OR "looking for" OR "recruiting" OR "open role" OR "join our team") ("React Native" OR "React" OR "Next.js" OR "Node.js" OR "TypeScript" OR "AI") ("remote" OR "contract" OR "freelance" OR "part time" OR "full time")',

  // 4. INDIEHACKERS & WELLFOUND (Bootstrapped / Freelance)
  '(site:indiehackers.com OR site:wellfound.com/jobs) "hiring" ("React Native" OR "React" OR "Next.js" OR "Node.js" OR "TypeScript" OR "AI") ("contract" OR "freelance" OR "part time" OR "full time" OR "remote")',

  // 5. PREMIUM FREELANCE PLATFORMS (Braintrust & Arc)
  '(site:usebraintrust.com/jobs OR site:arc.dev/jobs) ("React Native" OR "React" OR "Next.js" OR "Node.js" OR "TypeScript" OR "AI") ("contract" OR "freelance" OR "part time" OR "full time" OR "remote")',

  // 6. REDDIT (Community Hiring Threads)
  '(site:reddit.com/r/forhire OR site:reddit.com/r/reactnative OR site:reddit.com/r/reactjs) "hiring" ("React Native" OR "React" OR "Next.js" OR "Node.js" OR "TypeScript" OR "AI") ("remote" OR "contract" OR "freelance" OR "part time" OR "full time")',

  // 7. UPWORK (Direct Freelance Scraping)
  '(site:upwork.com/freelance-jobs OR site:upwork.com/jobs) ("React Native" OR "React" OR "Next.js" OR "Node.js" OR "TypeScript" OR "AI")',

  // 8. GITHUB (Hidden Issue Board Jobs)
  'site:github.com "we are hiring" ("React Native" OR "React" OR "Next.js" OR "Node.js" OR "TypeScript" OR "AI") ("contract" OR "freelance" OR "part time" OR "full time" OR "remote")'
];
