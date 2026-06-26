Deployed on Netlify (not Vercel). Next.js App Router with Netlify Next.js Runtime v5+.

- `export const maxDuration` in route handlers is honored.
- Synchronous function timeout: 10s (default), 26s (Pro).
- For long-running work, prefer Netlify Background Functions over raising `maxDuration` indefinitely.
