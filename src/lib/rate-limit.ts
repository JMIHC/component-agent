import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

const ratelimit =
  url && token
    ? new Ratelimit({
        redis: new Redis({ url, token }),
        limiter: Ratelimit.slidingWindow(5, "1 h"),
        analytics: true,
        prefix: "component-agent",
      })
    : null;

export function getClientIp(req: Request): string {
  const netlify = req.headers.get("x-nf-client-connection-ip");
  if (netlify) return netlify;
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "anonymous";
}

export async function checkRateLimit(
  req: Request
): Promise<{ ok: true } | { ok: false; response: Response }> {
  if (!ratelimit) return { ok: true };

  const ip = getClientIp(req);
  const { success, limit, remaining, reset } = await ratelimit.limit(ip);

  if (success) return { ok: true };

  return {
    ok: false,
    response: Response.json(
      { error: "Rate limit exceeded. Try again later." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(reset),
        },
      }
    ),
  };
}
