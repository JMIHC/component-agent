import { test, expect } from "@playwright/test";

test.describe("Preview tab", () => {
  test.setTimeout(90_000);

  test("renders generated component in the preview", async ({ page }) => {
    await page.goto("/");

    // 1. Generate a component
    await page.getByPlaceholder("Describe your component").fill(
      "A simple counter with +1 and -1 buttons"
    );
    await page.getByRole("button", { name: "Generate" }).click();

    // Wait for generation to finish (button re-enables)
    await expect(
      page.getByRole("button", { name: "Generate" })
    ).toBeEnabled({ timeout: 60_000 });

    // Tabs should be visible
    await expect(page.getByRole("tab", { name: "preview" })).toBeVisible();

    // 2. Click the Preview tab
    await page.getByRole("tab", { name: "preview" }).click();

    // 3. Wait for the Tailwind CDN to load and react-live to render
    await page.waitForTimeout(3_000);

    // 4. The preview area (white bg container) should have rendered child content
    const previewArea = page.locator("[data-state=active] .bg-white .p-8 > div");
    await expect(previewArea).toBeAttached();

    const childCount = await previewArea.evaluate(
      (el) => el.querySelectorAll("*").length
    );
    expect(childCount).toBeGreaterThan(0);

    // 5. There should be visible text inside the preview
    const previewText = await previewArea.innerText();
    expect(previewText.trim().length).toBeGreaterThan(0);

    // 6. LiveError should NOT be showing (no red error box with content)
    const liveError = page.locator("[data-state=active] pre.font-mono.text-red-700");
    const errorCount = await liveError.count();
    if (errorCount > 0) {
      const errorText = await liveError.innerText();
      expect.soft(errorText, "LiveError should be empty").toBe("");
    }

    // 7. Screenshot for visual inspection
    await page.screenshot({ path: "tests/screenshots/preview.png", fullPage: true });
  });
});
