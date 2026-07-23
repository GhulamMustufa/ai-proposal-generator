# Product Vision & Feature Roadmap

The AI Proposal Generator is an automated recruitment engine designed for freelancers and job-seekers. It aims to completely eliminate the manual labor of hunting for jobs and writing cover letters.

## Target Audience
- **Freelancers**: Looking for contract work on platforms like Upwork, Freelancer, and WWR.
- **Job Seekers**: Applying to remote tech companies using Greenhouse and Lever.
- **Agencies**: B2B agencies that need to scale their cold-email outreach for lead generation.

## Monetization Strategy (Freemium Model)
- **Free Tier**: Users can sign up and generate up to 3 proposals/cold emails. This acts as a trial to prove the value of the AI.
- **Pro Tier**: Managed via Lemon Squeezy. Paid users get unlimited generations, unlocking the full power of the platform.

## Future Feature Roadmap (Upcoming)

When instructed by the user, AI agents should refer to these planned features for context during implementation:

1. **The "Auto-Scrape & Match" Engine**
   - A nightly cron job that scrapes public job boards, scores jobs based on the user's saved JSON profile, and generates a daily email digest of the top 5 matches.

2. **Interactive "Swipe" Dashboard**
   - A gamified UI where users can review their daily matches. Swipe right (or press `Enter`) to instantly generate a proposal; swipe left (or press `Backspace`) to discard the job.

3. **Dynamic PDF Resume Tailoring**
   - The AI will not only write a cover letter but will actively rewrite the bullet points on the user's master resume to match the job description's keywords. It will output a beautifully formatted, downloadable PDF ready to submit.

4. **Chrome Extension Integration**
   - A browser extension that allows users to generate proposals directly inside the text boxes of websites like LinkedIn, Indeed, or Upwork without switching tabs.

5. **Multi-Persona Management**
   - Allowing agencies or multi-disciplinary freelancers to save multiple profiles (e.g., "React Developer" vs "UI Designer") and select which persona the AI should adopt when generating a pitch.
