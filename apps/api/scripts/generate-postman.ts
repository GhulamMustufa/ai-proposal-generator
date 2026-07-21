import * as fs from 'fs';
import * as path from 'path';

const collection = {
  info: {
    name: "AI Proposal Generator API",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  variable: [
    { key: "baseUrl", value: "http://localhost:3001", type: "string" },
    { key: "clerkToken", value: "dev_user_...", type: "string" }
  ],
  item: [
    {
      name: "1. Proposals",
      item: [
        {
          name: "Generate Proposal (Stream)",
          request: {
            method: "POST",
            header: [{ key: "Authorization", value: "Bearer {{clerkToken}}" }],
            url: { raw: "{{baseUrl}}/api/proposals/generate", host: ["{{baseUrl}}"], path: ["api", "proposals", "generate"] },
            body: { mode: "raw", raw: JSON.stringify({ jobId: "uuid-of-job", jobTitle: "Frontend Engineer", jobDescription: "We are looking for a react expert...", company: "Tech Corp", A_B_TEST: true }, null, 2), options: { raw: { language: "json" } } }
          }
        },
        {
          name: "Enqueue Background Proposal",
          request: {
            method: "POST",
            header: [{ key: "Authorization", value: "Bearer {{clerkToken}}" }],
            url: { raw: "{{baseUrl}}/api/proposals/enqueue", host: ["{{baseUrl}}"], path: ["api", "proposals", "enqueue"] },
            body: { mode: "raw", raw: JSON.stringify({ jobId: "uuid-of-job", jobTitle: "Frontend Engineer", jobDescription: "Full job description...", company: "Tech Corp", generationType: "proposal" }, null, 2), options: { raw: { language: "json" } } }
          }
        },
        {
          name: "Background Generation Status (SSE)",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{clerkToken}}" }],
            url: { raw: "{{baseUrl}}/api/proposals/status/:userId", host: ["{{baseUrl}}"], path: ["api", "proposals", "status", ":userId"], variable: [{ key: "userId", value: "user_123" }] }
          }
        },
        {
          name: "Get Specific Proposal",
          request: {
            method: "POST",
            header: [{ key: "Authorization", value: "Bearer {{clerkToken}}" }],
            url: { raw: "{{baseUrl}}/api/proposals/:id/get", host: ["{{baseUrl}}"], path: ["api", "proposals", ":id", "get"], variable: [{ key: "id", value: "proposal-uuid" }] }
          }
        },
        {
          name: "Update Proposal",
          request: {
            method: "POST",
            header: [{ key: "Authorization", value: "Bearer {{clerkToken}}" }],
            url: { raw: "{{baseUrl}}/api/proposals/:id", host: ["{{baseUrl}}"], path: ["api", "proposals", ":id"], variable: [{ key: "id", value: "proposal-uuid" }] },
            body: { mode: "raw", raw: JSON.stringify({ text: "The manually edited proposal text goes here..." }, null, 2), options: { raw: { language: "json" } } }
          }
        },
        {
          name: "Download Proposal as PDF",
          request: {
            method: "POST",
            header: [{ key: "Authorization", value: "Bearer {{clerkToken}}" }],
            url: { raw: "{{baseUrl}}/api/proposals/:id/pdf", host: ["{{baseUrl}}"], path: ["api", "proposals", ":id", "pdf"], variable: [{ key: "id", value: "proposal-uuid" }] }
          }
        }
      ]
    },
    {
      name: "2. Resumes",
      item: [
        {
          name: "Generate Tailored Resume PDF",
          request: {
            method: "POST",
            header: [{ key: "Authorization", value: "Bearer {{clerkToken}}" }],
            url: { raw: "{{baseUrl}}/api/resume/generate", host: ["{{baseUrl}}"], path: ["api", "resume", "generate"] },
            body: { mode: "raw", raw: JSON.stringify({ jobId: "uuid-of-job" }, null, 2), options: { raw: { language: "json" } } }
          }
        }
      ]
    },
    {
      name: "3. Profile",
      item: [
        {
          name: "Get User Profile",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{clerkToken}}" }],
            url: { raw: "{{baseUrl}}/api/profile", host: ["{{baseUrl}}"], path: ["api", "profile"] }
          }
        },
        {
          name: "Update Job Filters",
          request: {
            method: "PUT",
            header: [{ key: "Authorization", value: "Bearer {{clerkToken}}" }],
            url: { raw: "{{baseUrl}}/api/profile/filters", host: ["{{baseUrl}}"], path: ["api", "profile", "filters"] },
            body: { mode: "raw", raw: JSON.stringify({ jobFilters: { targetRegions: ["US", "Europe"], keywords: ["React", "NestJS"] } }, null, 2), options: { raw: { language: "json" } } }
          }
        }
      ]
    },
    {
      name: "4. Jobs & Matching",
      item: [
        {
          name: "Get General Jobs",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{clerkToken}}" }],
            url: { raw: "{{baseUrl}}/api/jobs", host: ["{{baseUrl}}"], path: ["api", "jobs"] }
          }
        },
        {
          name: "Get AI Matched Jobs",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{clerkToken}}" }],
            url: { raw: "{{baseUrl}}/api/matches/:userId", host: ["{{baseUrl}}"], path: ["api", "matches", ":userId"], variable: [{ key: "userId", value: "user_123" }] }
          }
        },
        {
          name: "Force Re-evaluate Jobs",
          request: {
            method: "POST",
            header: [{ key: "Authorization", value: "Bearer {{clerkToken}}" }],
            url: { raw: "{{baseUrl}}/api/matches/re-evaluate", host: ["{{baseUrl}}"], path: ["api", "matches", "re-evaluate"] }
          }
        }
      ]
    },
    {
      name: "5. Background Ingestion",
      item: [
        {
          name: "Trigger Ingestion Worker",
          request: {
            method: "POST",
            header: [],
            url: { raw: "{{baseUrl}}/ingestion/trigger/:jobName", host: ["{{baseUrl}}"], path: ["ingestion", "trigger", ":jobName"], variable: [{ key: "jobName", value: "scrape-dorks" }] }
          }
        }
      ]
    }
  ]
};

const outputPath = path.resolve(__dirname, '../../postman_collection.json');
fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2));
console.log(`Generated Postman Collection JSON at: ${outputPath}`);
