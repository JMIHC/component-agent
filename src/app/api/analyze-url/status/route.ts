import { getJob } from "@/lib/job-store";

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return Response.json({ error: "id is required" }, { status: 400 });
  }

  const job = await getJob(id);
  if (!job) {
    return Response.json({ error: "Job not found or expired" }, { status: 404 });
  }

  return Response.json({
    status: job.status,
    result: job.result,
    error: job.error,
  });
}
