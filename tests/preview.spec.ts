import { test, expect } from "@playwright/test";

test.describe("Component generation", () => {
  test.setTimeout(120_000);

  test("generates a component and renders it in the preview", async ({ page }) => {
    await page.goto("/");

    // 1. Fill in the prompt and generate
    await page.getByPlaceholder(/Describe your component/).fill(
      "A simple counter with +1 and -1 buttons"
    );
    await page.getByRole("button", { name: "Generate" }).click();

    // Wait for generation to finish — agent response appears in thread
    await expect(page.getByText("Agent:")).toBeVisible({ timeout: 60_000 });

    // Conversation thread should show the user message too
    await expect(page.getByText("You:")).toBeVisible();

    // Preview tab should be visible and active by default
    await expect(page.getByRole("tab", { name: "preview" })).toBeVisible();

    // Wait for Tailwind CDN + react-live to render
    await page.waitForTimeout(3_000);

    // The preview should have rendered content
    const previewArea = page.locator("[data-state=active] .bg-white .p-8 > div");
    await expect(previewArea).toBeAttached();

    const childCount = await previewArea.evaluate(
      (el) => el.querySelectorAll("*").length
    );
    expect(childCount).toBeGreaterThan(0);

    // There should be visible text
    const previewText = await previewArea.innerText();
    expect(previewText.trim().length).toBeGreaterThan(0);

    // LiveError should not be showing
    const liveError = page.locator("[data-state=active] pre.font-mono.text-red-700");
    const errorCount = await liveError.count();
    if (errorCount > 0) {
      const errorText = await liveError.innerText();
      expect.soft(errorText, "LiveError should be empty").toBe("");
    }

    await page.screenshot({ path: "tests/screenshots/preview.png", fullPage: true });
  });

  test("refines a component with a follow-up message", async ({ page }) => {
    await page.goto("/");

    // 1. Initial generation
    await page.getByPlaceholder(/Describe your component/).fill(
      "A greeting card that says Hello World"
    );
    await page.getByRole("button", { name: "Generate" }).click();

    // Wait for first generation
    await expect(page.getByText("Agent:")).toBeVisible({ timeout: 60_000 });

    // 2. Send a refinement
    await page.getByPlaceholder(/Refine the component/).fill(
      "Change the greeting to say Goodbye World instead"
    );
    await page.getByRole("button", { name: "Refine" }).click();

    // Wait for the second agent response
    const agentMessages = page.locator("text=Agent:");
    await expect(agentMessages).toHaveCount(2, { timeout: 60_000 });

    // Conversation thread should have both user messages
    const userMessages = page.locator("text=You:");
    await expect(userMessages).toHaveCount(2);

    // Preview should still render without errors
    await page.waitForTimeout(3_000);

    const liveError = page.locator("[data-state=active] pre.font-mono.text-red-700");
    const errorCount = await liveError.count();
    if (errorCount > 0) {
      const errorText = await liveError.innerText();
      expect.soft(errorText, "LiveError should be empty after refinement").toBe("");
    }

    await page.screenshot({ path: "tests/screenshots/refinement.png", fullPage: true });
  });
});
