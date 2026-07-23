import {
  pgTable,
  text,
  timestamp,
  jsonb,
  uuid,
  integer,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk User ID (string)
  email: text('email').notNull().unique(),
  stripeCustomerId: text('stripe_customer_id'),
  lemonsqueezyCustomerId: text('lemonsqueezy_customer_id'),
  lemonsqueezySubscriptionId: text('lemonsqueezy_subscription_id'),
  generationsCount: integer('generations_count').default(0).notNull(),
  subscriptionStatus: text('subscription_status').default('free'), // 'free', 'pro'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  contactDetails: jsonb('contact_details'), // { firstName, lastName, phone, linkedin }
  skills: jsonb('skills'), // Array of strings
  jobFilters: jsonb('job_filters'), // Advanced job filtering preferences
  resumeText: text('resume_text'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const jobs = pgTable('jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  platform: text('platform').notNull(), // 'remotive', 'lever', etc.
  externalId: text('external_id').notNull().unique(),
  title: text('title').notNull(),
  company: text('company'),
  description: text('description'),
  url: text('url').notNull(),
  scrapedAt: timestamp('scraped_at').defaultNow().notNull(),
});

export const personas = pgTable('personas', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  name: text('name').notNull(), // e.g. "Senior React Developer"
  skills: jsonb('skills'), // Array of strings
  idealSalary: text('ideal_salary'),
  yearsOfExperience: integer('years_of_experience'),
  resumeText: text('resume_text'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});


export const aiMatches = pgTable('ai_matches', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  personaId: uuid('persona_id')
    .references(() => personas.id), // Nullable for legacy matches, if any
  jobId: uuid('job_id')
    .references(() => jobs.id)
    .notNull(),
  matchScore: integer('match_score').notNull(),
  matchReasoning: text('match_reasoning'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const applications = pgTable('applications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  jobId: uuid('job_id').references(() => jobs.id), // Nullable for standalone proposals
  jobDescription: text('job_description'), // Raw text if no job is linked
  jobTitle: text('job_title'), // Optional title
  jobLink: text('job_link'), // Optional link
  generatedProposal: text('generated_proposal'), // The actual generated proposal text
  status: text('status').default('pending').notNull(), // 'pending', 'generated', 'submitted', 'failed'
  pdfUrl: text('pdf_url'), // Cloudflare R2 URL
  submissionLogs: jsonb('submission_logs'), // Playwright logs
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const targetCompanies = pgTable('target_companies', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  atsProvider: text('ats_provider').notNull(), // 'greenhouse', 'lever', 'workable', 'ashby', etc.
  atsBoardToken: text('ats_board_token').notNull().unique(), // e.g. 'stripe' for greenhouse
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

