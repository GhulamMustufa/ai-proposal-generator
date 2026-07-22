/**
 * Google Dork Queries for automated Job Sourcing.
 * Optimized for Serper.dev API limits (2,500 free searches/month).
 * 
 * Strategy: Execute these 19 queries twice daily (1,140 searches/month).
 * By heavily utilizing the 'OR' operator, one query scrapes multiple platforms and tech stacks.
 */

// Core Keyword Groups for modularity and easy updates
const TECH = '("React Native" OR "React" OR "Next.js" OR "Node.js" OR "TypeScript" OR "AI")';
const ROLES = '("software engineer" OR "software developer" OR "frontend" OR "backend" OR "full stack" OR "fullstack")';
const KEYWORDS = `(${TECH} OR ${ROLES})`;

const TERMS = '("remote" OR "contract" OR "freelance" OR "part time" OR "full time")';
const HIRING = '("hiring" OR "looking for" OR "recruiting" OR "open role" OR "join our team")';

export const DORK_QUERIES = [
  // 1. HACKER NEWS (High Quality Startup Jobs)
  `site:news.ycombinator.com/item "who is hiring" ${KEYWORDS} ${TERMS}`,

  // 2. TWITTER / X (Real-time Founder Posts)
  `(site:twitter.com OR site:x.com) ("looking for a developer" OR "hiring") ${KEYWORDS} ${TERMS}`,

  // 3. LINKEDIN POSTS (Bypassing the standard Jobs Board)
  `site:linkedin.com/posts ${HIRING} ${KEYWORDS} ${TERMS}`,

  // 4. INDIEHACKERS (Bootstrapped / Freelance)
  `site:indiehackers.com "hiring" ${KEYWORDS} ("contract" OR "freelance" OR "remote")`,

  // 4.1. WELLFOUND (Startup Jobs)
  `site:wellfound.com/jobs ${KEYWORDS} ("remote" OR "contract" OR "freelance")`,

  // 4.2. Y COMBINATOR (Work at a Startup)
  `site:workatastartup.com/jobs ${KEYWORDS} ${TERMS}`,

  // 5. PREMIUM FREELANCE PLATFORMS (Braintrust & Arc)
  `(site:usebraintrust.com/jobs OR site:arc.dev/jobs) ${KEYWORDS} ${TERMS}`,

  // 6. REDDIT (Community Hiring Threads)
  `(site:reddit.com/r/forhire OR site:reddit.com/r/reactnative OR site:reddit.com/r/reactjs) "hiring" ${KEYWORDS} ${TERMS}`,

  // 7. UPWORK (Direct Freelance Scraping)
  `(site:upwork.com/freelance-jobs OR site:upwork.com/jobs) ${KEYWORDS}`,

  // 8. GITHUB (Hidden Issue Board Jobs)
  `site:github.com "we are hiring" ${KEYWORDS} ${TERMS}`,

  // 9. TARGETED: Big Tech & Hardware (Malaysia/Remote)
  `("Intel" OR "AMD" OR "NVIDIA" OR "Dell" OR "HP" OR "Oracle" OR "IBM" OR "Microsoft" OR "Google" OR "AWS") ${KEYWORDS} ("Malaysia" OR "Remote")`,

  // 10. TARGETED: FinTech & E-Commerce (Malaysia/Singapore)
  `("Shopee" OR "Lazada" OR "TikTok" OR "Carsome" OR "Grab" OR "MoneyLion" OR "GXBank" OR "Setel" OR "BigPay") ${KEYWORDS} ("Malaysia" OR "Remote")`,

  // 11. TARGETED: Consulting, GCCs & Engineering
  `("Accenture" OR "PwC" OR "EY" OR "HSBC" OR "Shell" OR "Petronas" OR "DHL" OR "Keysight" OR "Motorola" OR "Infineon") ${KEYWORDS} ("Malaysia" OR "Remote")`,

  // 12. TARGETED: Singapore Agencies 1
  `("Michael Page" OR "Robert Walters" OR "Randstad" OR "JAC Recruitment" OR "RecruitFirst") ${KEYWORDS} "Singapore"`,

  // 13. TARGETED: Singapore Agencies 2
  `("HRnetOne" OR "PeopleSearch" OR "BGC Group" OR "Trust Recruit" OR "Robert Half") ${KEYWORDS} "Singapore"`,

  // 14. TARGETED: Singapore Tech Tier 1
  `("Sea Group" OR "ByteDance" OR "Foodpanda" OR "Carousell" OR "ShopBack" OR "Meta" OR "Apple" OR "Salesforce" OR "ServiceNow") ${KEYWORDS} "Singapore"`,

  // 15. TARGETED: Singapore FinTech & Banking
  `("Nium" OR "Airwallex" OR "Wise" OR "Stripe" OR "Adyen" OR "Revolut" OR "DBS" OR "OCBC" OR "UOB") ${KEYWORDS} "Singapore"`,

  // 16. TARGETED: Singapore Finance & Engineering
  `("JPMorgan" OR "Goldman Sachs" OR "Morgan Stanley" OR "Micron" OR "GlobalFoundries" OR "STMicroelectronics") ${KEYWORDS} "Singapore"`,

  // 17. TARGETED: Singapore AI & Growth
  `("Anthropic" OR "OpenAI" OR "Datadog" OR "Cloudflare" OR "Canva" OR "PayPal") ${KEYWORDS} "Singapore"`
];
