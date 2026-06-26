import { randomUUID } from "node:crypto";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { createJob } from "@/lib/job-store";

function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }

  if (!["http:", "https:"].includes(parsed.protocol)) return null;
  if (!parsed.hostname.includes(".")) return null;

  return parsed.toString();
}

export async function POST(req: Request) {
  const { url, turnstileToken } = await req.json();

  const turnstile = await verifyTurnstile(req, turnstileToken);
  if (!turnstile.ok) return turnstile.response;

  const limit = await checkRateLimit(req);
  if (!limit.ok) return limit.response;

  if (!url || typeof url !== "string") {
    return Response.json({ error: "URL is required" }, { status: 400 });
  }

  const normalized = normalizeUrl(url);
  if (!normalized) {
    return Response.json({ error: "Invalid URL" }, { status: 400 });
  }

  const jobId = randomUUID();
  await createJob(jobId);

  // process.env.URL is set by Netlify (and by `netlify dev` → http://localhost:8888)
  // and points to the edge-facing host. We can't use `new URL(req.url).origin` because
  // under `netlify dev`, requests reach Next.js on its framework port (e.g. :3000), and
  // the `.netlify/functions/*` routes only exist on the Netlify edge port.
  const forwardedHost = req.headers.get("x-forwarded-host");
  const forwardedProto = req.headers.get("x-forwarded-proto") ?? "https";
  const origin =
    process.env.URL ??
    (forwardedHost
      ? `${forwardedProto}://${forwardedHost}`
      : new URL(req.url).origin);
  const backgroundUrl = `${origin}/.netlify/functions/analyze-background`;

  // Fire and forget; Netlify returns 202 immediately for background functions.
  // We await the fetch itself so invocation errors surface, but we don't await
  // the work — the function runs asynchronously and writes back to Blobs.
  try {
    await fetch(backgroundUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, url: normalized }),
    });
  } catch (err) {
    console.error("Failed to invoke analyze-background:", err);
    return Response.json(
      { error: "Failed to start analysis" },
      { status: 500 }
    );
  }

  return Response.json({ jobId });
}
