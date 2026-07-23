# API Documentation

The NestJS backend (`apps/api`) provides RESTful endpoints, Server-Sent Events (SSE) for real-time status updates, and handles third-party webhooks.

## Base URL
Local development: `http://localhost:3001`
Production: `(Insert Production URL)`

## Authentication
All protected routes require a valid Clerk JWT passed in the `Authorization` header:
```
Authorization: Bearer <clerk_token>
```
This is enforced globally using the `ClerkAuthGuard`.

---

## Proposals Module

### `POST /api/proposals/enqueue`
Enqueues a background task to generate a proposal or cold email.

**Security**: 
- Protected by `ClerkAuthGuard`.
- Protected by `@Throttle({ default: { limit: 50, ttl: 3600000 } })` (Max 50 requests per hour).
- Enforces Freemium Paywall (max 3 free generations unless `subscriptionStatus` is 'pro').

**Request Body**:
```json
{
  "jobId": "uuid-optional",
  "jobTitle": "Frontend Engineer",
  "jobDescription": "Full job description...",
  "company": "Stripe",
  "generationType": "proposal" | "cold_email",
  "clientReferenceId": "uuid-required-for-manual-jobs"
}
```

**Response**:
`202 Accepted`
```json
{ "success": true, "queueJobId": "12345" }
```

### `GET /api/proposals/status/:userId`
Server-Sent Events (SSE) endpoint to listen for background job completion.

**Query**:
- `:userId`: The Clerk user ID (e.g., `user_2bX...`)

**Event Stream Output**:
```json
// Example: Success
{
  "data": {
    "userId": "user_2bX...",
    "jobId": "uuid-optional",
    "clientReferenceId": "uuid-optional",
    "status": "generated",
    "generatedText": "Dear Hiring Manager..."
  }
}
```

---

## Billing Module (Lemon Squeezy)

### `POST /api/billing/webhook`
Receives asynchronous webhook events from Lemon Squeezy to provision user accounts.

**Security**:
- Validates the X-Signature header using crypto SHA-256 HMAC against the `LEMON_SQUEEZY_WEBHOOK_SECRET`.

**Handled Events**:
- `subscription_created`: Upgrades user to Pro in the DB.
- `subscription_updated`: Updates user status (active/past_due).
- `subscription_cancelled`: Downgrades user to Free in the DB.
- `subscription_expired`: Downgrades user to Free in the DB.

### `GET /api/billing/checkout`
Returns a secure, hosted checkout URL for the user to upgrade to Pro.

**Security**: 
- Protected by `ClerkAuthGuard`.

**Response**:
```json
{
  "url": "https://store.lemonsqueezy.com/checkout/buy/..."
}
```
