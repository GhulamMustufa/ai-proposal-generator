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
  'site:github.com "we are hiring" ("React Native" OR "React" OR "Next.js" OR "Node.js" OR "TypeScript" OR "AI") ("contract" OR "freelance" OR "part time" OR "full time" OR "remote")',

  // 9. TARGETED: Big Tech & Hardware (Malaysia/Remote)
  '("Intel" OR "AMD" OR "NVIDIA" OR "Dell" OR "HP" OR "Oracle" OR "IBM" OR "Microsoft" OR "Google" OR "AWS") ("React Native" OR "React" OR "Node.js") ("Malaysia" OR "Remote")',

  // 10. TARGETED: FinTech & E-Commerce (Malaysia/Singapore)
  '("Shopee" OR "Lazada" OR "TikTok" OR "Carsome" OR "Grab" OR "MoneyLion" OR "GXBank" OR "Setel" OR "BigPay") ("React Native" OR "React" OR "Node.js") ("Malaysia" OR "Remote")',

  // 11. TARGETED: Consulting, GCCs & Engineering
  '("Accenture" OR "PwC" OR "EY" OR "HSBC" OR "Shell" OR "Petronas" OR "DHL" OR "Keysight" OR "Motorola" OR "Infineon") ("React Native" OR "React" OR "Node.js") ("Malaysia" OR "Remote")',

  // 12. TARGETED: Singapore Agencies 1
  '("Michael Page" OR "Robert Walters" OR "Randstad" OR "JAC Recruitment" OR "RecruitFirst") ("React Native" OR "React" OR "Node.js") "Singapore"',

  // 13. TARGETED: Singapore Agencies 2
  '("HRnetOne" OR "PeopleSearch" OR "BGC Group" OR "Trust Recruit" OR "Robert Half") ("React Native" OR "React" OR "Node.js") "Singapore"',

  // 14. TARGETED: Singapore Tech Tier 1
  '("Sea Group" OR "ByteDance" OR "Foodpanda" OR "Carousell" OR "ShopBack" OR "Meta" OR "Apple" OR "Salesforce" OR "ServiceNow") ("React Native" OR "React" OR "Node.js") "Singapore"',

  // 15. TARGETED: Singapore FinTech & Banking
  '("Nium" OR "Airwallex" OR "Wise" OR "Stripe" OR "Adyen" OR "Revolut" OR "DBS" OR "OCBC" OR "UOB") ("React Native" OR "React" OR "Node.js") "Singapore"',

  // 16. TARGETED: Singapore Finance & Engineering
  '("JPMorgan" OR "Goldman Sachs" OR "Morgan Stanley" OR "Micron" OR "GlobalFoundries" OR "STMicroelectronics") ("React Native" OR "React" OR "Node.js") "Singapore"',

  // 17. TARGETED: Singapore AI & Growth
  '("Anthropic" OR "OpenAI" OR "Datadog" OR "Cloudflare" OR "Canva" OR "PayPal") ("React Native" OR "React" OR "Node.js") "Singapore"'
];
