/**
 * Google Dork Queries for automated Job Sourcing.
 * Optimized for Serper.dev API limits (2,500 free searches/month).
 * 
 * Strategy: Execute these 41 queries twice daily (2,460 searches/month).
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
  `("Anthropic" OR "OpenAI" OR "Datadog" OR "Cloudflare" OR "Canva" OR "PayPal") ${KEYWORDS} "Singapore"`,

  // 18. TARGETED: German Agencies 1
  `("Hays" OR "Michael Page" OR "Robert Half" OR "Randstad" OR "Brunel") ${KEYWORDS} "Germany"`,

  // 19. TARGETED: German Agencies 2
  `("Amadeus Fire" OR "DIS AG" OR "FERCHAU" OR "GULP" OR "Academic Work") ${KEYWORDS} "Germany"`,

  // 20. TARGETED: German Agencies 3
  `("Computer Futures" OR "Progressive Recruitment" OR "Akkodis" OR "Darwin Recruitment" OR "Energize Recruitment") ${KEYWORDS} "Germany"`,

  // 21. TARGETED: German Agencies 4
  `("Austin Fraser" OR "TechMinds" OR "PrimePeople" OR "HEADFOUND" OR "WeMatch Consulting") ${KEYWORDS} "Germany"`,

  // 22. TARGETED: German Global Tech
  `("SAP" OR "Amazon" OR "Google" OR "Microsoft" OR "NVIDIA" OR "IBM" OR "Oracle" OR "Salesforce" OR "Adobe" OR "ServiceNow") ${KEYWORDS} "Germany"`,

  // 23. TARGETED: German Product & Software
  `("Celonis" OR "Personio" OR "Contentful" OR "Delivery Hero" OR "HelloFresh" OR "Zalando" OR "N26" OR "Mambu" OR "Flix" OR "AUTO1") ${KEYWORDS} "Germany"`,

  // 24. TARGETED: German Automotive & Engineering
  `("Bosch" OR "Siemens" OR "BMW" OR "Mercedes-Benz" OR "Porsche" OR "Audi" OR "Continental" OR "Infineon" OR "Airbus" OR "Deutsche Telekom") ${KEYWORDS} "Germany"`,

  // 25. TARGETED: Netherlands Agencies 1
  `("Undutchables" OR "Adams Multilingual" OR "YER Recruitment" OR "Independent Recruiters" OR "iSense") ${KEYWORDS} "Netherlands"`,

  // 26. TARGETED: Netherlands Agencies 2
  `("Experis" OR "Xelvin" OR "Trinamics" OR "CodeGuild" OR "Pernu Recruitment" OR "Orange Quarter") ${KEYWORDS} "Netherlands"`,

  // 27. TARGETED: Netherlands Tech & Unicorns 1
  `("Booking.com" OR "Uber" OR "Netflix" OR "ASML" OR "Mollie" OR "MessageBird" OR "Picnic" OR "TomTom") ${KEYWORDS} ("Netherlands" OR "Amsterdam")`,

  // 28. TARGETED: Netherlands Tech & Unicorns 2
  `("WeTransfer" OR "Bunq" OR "Backbase" OR "CM.com" OR "Exact" OR "NXP" OR "Philips" OR "Adyen") ${KEYWORDS} ("Netherlands" OR "Amsterdam")`,

  // 29. TARGETED: Netherlands Banking & Enterprise
  `("ING" OR "Rabobank" OR "ABN AMRO" OR "NN Group" OR "Shell" OR "TCS") ${KEYWORDS} ("Netherlands" OR "Amsterdam")`,

  // 30. TARGETED: Ireland Agencies 1
  `("Morgan McKinley" OR "CPL Recruitment" OR "Reperio Human Capital" OR "Archer Recruitment" OR "Sigmar Recruitment") ${KEYWORDS} ("Ireland" OR "Dublin")`,

  // 31. TARGETED: Ireland Agencies 2
  `("Brightwater Recruitment" OR "FK International" OR "Lincoln Recruitment" OR "Executive Connections" OR "Alternatives Recruitment") ${KEYWORDS} ("Ireland" OR "Dublin")`,

  // 32. TARGETED: Ireland Agencies 3
  `("Collins McNicholas" OR "Hero Recruitment" OR "Wallace Myers" OR "Recruiters.ie" OR "Osborne Recruitment") ${KEYWORDS} ("Ireland" OR "Dublin")`,

  // 33. TARGETED: Ireland Big Tech
  `("Google" OR "Microsoft" OR "Meta" OR "Amazon" OR "Apple" OR "LinkedIn" OR "Salesforce" OR "Oracle" OR "IBM" OR "Workday") ${KEYWORDS} ("Ireland" OR "Dublin")`,

  // 34. TARGETED: Ireland FinTech & SaaS
  `("Stripe" OR "HubSpot" OR "Intercom" OR "Fenergo" OR "Mastercard" OR "PayPal" OR "Toast" OR "ServiceNow" OR "Zendesk" OR "Squarespace") ${KEYWORDS} ("Ireland" OR "Dublin")`,

  // 35. TARGETED: Ireland Enterprise & Semiconductor
  `("Intel" OR "Dell" OR "VMware" OR "Analog Devices" OR "Johnson Controls" OR "Ericsson" OR "Version 1" OR "Accenture" OR "Deloitte" OR "KPMG") ${KEYWORDS} ("Ireland" OR "Dublin")`,

  // 36. TARGETED: UAE Agencies 1
  `("Charterhouse" OR "BAC Middle East" OR "Guildhall" OR "Aspiriti" OR "TASC Outsourcing") ${KEYWORDS} ("UAE" OR "Dubai" OR "Abu Dhabi")`,

  // 37. TARGETED: UAE Agencies 2
  `("Nadia Global" OR "Reach Employment" OR "Kingston Stanley" OR "Discovered MENA" OR "Halian") ${KEYWORDS} ("UAE" OR "Dubai" OR "Abu Dhabi")`,

  // 38. TARGETED: UAE Agencies 3 (Global Brands in ME)
  `("Cander Recruitment" OR "Cooper Fitch" OR "Ateca Consulting" OR "Hays" OR "Michael Page" OR "Robert Half") ${KEYWORDS} ("UAE" OR "Dubai" OR "Abu Dhabi")`,

  // 39. TARGETED: UAE Big Tech
  `("Google" OR "Microsoft" OR "Amazon" OR "Oracle" OR "IBM" OR "Cisco" OR "SAP" OR "Salesforce" OR "Huawei" OR "NVIDIA") ${KEYWORDS} ("UAE" OR "Dubai" OR "Abu Dhabi")`,

  // 40. TARGETED: UAE FinTech & Banking
  `("Emirates NBD" OR "Mashreq" OR "First Abu Dhabi Bank" OR "FAB" OR "ADCB" OR "Wio Bank" OR "Careem" OR "Tabby" OR "Ziina") ${KEYWORDS} ("UAE" OR "Dubai" OR "Abu Dhabi")`,

  // 41. TARGETED: UAE Enterprise, AI & E-Commerce
  `("Network International" OR "Checkout.com" OR "G42" OR "Presight AI" OR "Inception AI" OR "Etisalat" OR "Noon") ${KEYWORDS} ("UAE" OR "Dubai" OR "Abu Dhabi")`
];
