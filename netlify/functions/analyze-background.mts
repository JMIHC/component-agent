import type { Context } from "@netlify/functions";
import { extractStylesFromUrl } from "@/lib/extract-styles";
import { analyzeDesignSystem } from "@/lib/analyze-design-system";
import { completeJob, failJob } from "@/lib/job-store";

export default async (req: Request, _context: Context) => {
  const { jobId, url } = (await req.json()) as { jobId: string; url: string };

  try {
    const { computedStyles, screenshotBase64 } = await extractStylesFromUrl(url);
    const designSystem = await analyzeDesignSystem(
      computedStyles,
      screenshotBase64,
      url
    );
    await completeJob(jobId, designSystem);
  } catch (err) {
    console.error(`analyze-background job ${jobId} failed:`, err);
    await failJob(
      jobId,
      "Failed to analyze the URL. The site may be unreachable."
    );
  }
};
