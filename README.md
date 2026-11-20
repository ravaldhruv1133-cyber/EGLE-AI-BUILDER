# EGLE AI BUILDER — Full-stack starter

This is the next version of EGLE AI BUILDER: a responsive website with a secure server-side AI generation endpoint.

## Important before launch
The website UI is ready, but real AI generation needs an AI provider account and API key. This project intentionally keeps the key on the server, not in browser code. Do not share your API key or account password in chat.

## Run locally
1. Install Node.js 18 or newer.
2. Copy `.env.example` to `.env`.
3. Put your provider key in `AI_API_KEY` and choose the provider endpoint/model:
   - `AI_BASE_URL` defaults to `https://api.openai.com/v1`
   - `AI_MODEL` defaults to `gpt-4o-mini`
4. In this folder run: `npm install`
5. Run: `npm start`
6. Open `http://localhost:3000`

The API endpoint must be compatible with OpenAI Chat Completions (`POST /chat/completions`). A provider may charge for usage; check its current pricing and free-tier limits before enabling it.

## Deploy
Deploy this Node.js project to a host that supports persistent Node web services. Set `AI_API_KEY`, `AI_BASE_URL`, and `AI_MODEL` as server environment variables in the host dashboard. Do not upload `.env` to a public repository. Add rate limiting, usage quotas, abuse protection, and a database before opening it to the public.

## Included now
- Responsive public homepage
- Prompt input and example prompts
- Server-side AI generation endpoint
- Sandboxed website preview
- HTML source view and download
- Health endpoint at `/api/health`

## Not included yet
- User login/signup
- Saving projects to a database
- Website hosting/publishing for users
- ZIP export with assets
- Billing, credits, rate limits and admin dashboard

Those need additional services and configuration. The app does not claim they are implemented yet.
