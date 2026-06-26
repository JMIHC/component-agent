import { getStore } from "@netlify/blobs";
import type { DesignSystem } from "./types/design-system";

const TTL_MS = 60 * 60 * 1000;
const STORE_NAME = "analyze-jobs";

export type AnalyzeJobStatus = "pending" | "done" | "error";

export interface AnalyzeJob {
  status: AnalyzeJobStatus;
  result?: DesignSystem;
  error?: string;
  createdAt: string;
  expiresAt: string;
}

function store() {
  return getStore({ name: STORE_NAME, consistency: "strong" });
}

export async function createJob(jobId: string): Promise<void> {
  const now = Date.now();
  const job: AnalyzeJob = {
    status: "pending",
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + TTL_MS).toISOString(),
  };
  await store().setJSON(jobId, job);
}

export async function completeJob(
  jobId: string,
  result: DesignSystem
): Promise<void> {
  const existing = await getJob(jobId);
  if (!existing) return;
  await store().setJSON(jobId, { ...existing, status: "done", result });
}

export async function failJob(jobId: string, error: string): Promise<void> {
  const existing = await getJob(jobId);
  if (!existing) return;
  await store().setJSON(jobId, { ...existing, status: "error", error });
}

export async function getJob(jobId: string): Promise<AnalyzeJob | null> {
  const job = (await store().get(jobId, { type: "json" })) as AnalyzeJob | null;
  if (!job) return null;
  if (Date.now() > new Date(job.expiresAt).getTime()) return null;
  return job;
}
