const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(
  req: Request,
  token: string | undefined
): Promise<{ ok: true } | { ok: false; response: Response }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true };

  if (!token) {
    return {
      ok: false,
      response: Response.json(
        { error: "Missing Turnstile token" },
        { status: 400 }
      ),
    };
  }

  const remoteip =
    req.headers.get("x-nf-client-connection-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "";

  const body = new URLSearchParams({
    secret,
    response: token,
    remoteip,
  });

  const res = await fetch(VERIFY_URL, { method: "POST", body });
  const data = (await res.json()) as { success: boolean };

  if (!data.success) {
    return {
      ok: false,
      response: Response.json(
        { error: "Turnstile verification failed" },
        { status: 403 }
      ),
    };
  }

  return { ok: true };
}
