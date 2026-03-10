import { chromium } from "playwright-core";

export interface ExtractedStyles {
  computedStyles: {
    colors: string[];
    backgroundColors: string[];
    fontFamilies: string[];
    fontSizes: string[];
    fontWeights: string[];
    lineHeights: string[];
    paddings: string[];
    margins: string[];
    borderRadii: string[];
    boxShadows: string[];
    borderColors: string[];
  };
  perElementStyles: Record<string, Record<string, string[]>>;
  cssVariables: Record<string, string>;
}

const CSS_PROPERTIES = [
  "color", "backgroundColor", "fontFamily", "fontSize", "fontWeight",
  "lineHeight", "padding", "paddingTop", "paddingRight", "paddingBottom",
  "paddingLeft", "margin", "borderRadius", "boxShadow", "borderColor",
  "borderWidth", "borderStyle", "letterSpacing", "textTransform",
  "textDecoration", "gap", "display", "opacity", "cursor", "outline",
  "transition", "width", "height", "minHeight", "maxWidth",
] as const;

export async function extractStylesFromUrl(
  url: string
): Promise<{ computedStyles: ExtractedStyles; screenshotBase64: string }> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  // Allow a brief settle for JS-rendered content and lazy styles
  await page.waitForTimeout(3000);

  const computedStyles = await page.evaluate((properties: string[]) => {
    const selectors = [
      "button", "a",
      "h1", "h2", "h3", "h4",
      "p", "span",
      "input", "textarea", "select",
      "nav", "header", "footer",
      "div", "section", "article",
      "li", "img", "table", "th", "td",
    ];

    // Flat aggregate sets (for backward compat / overview)
    const collected = {
      colors: new Set<string>(),
      backgroundColors: new Set<string>(),
      fontFamilies: new Set<string>(),
      fontSizes: new Set<string>(),
      fontWeights: new Set<string>(),
      lineHeights: new Set<string>(),
      paddings: new Set<string>(),
      margins: new Set<string>(),
      borderRadii: new Set<string>(),
      boxShadows: new Set<string>(),
      borderColors: new Set<string>(),
    };

    // Per-element-type style maps
    const perElementStyles: Record<string, Record<string, Set<string>>> = {};

    // Baseline element for filtering browser defaults
    const baseline = document.createElement("div");
    document.body.appendChild(baseline);
    const baselineStyles = getComputedStyle(baseline);
    const defaults: Record<string, string> = {};
    for (const prop of properties) {
      defaults[prop] = (baselineStyles as unknown as Record<string, string>)[prop] ?? "";
    }
    document.body.removeChild(baseline);

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      const sample = Array.from(elements).slice(0, 10);
      if (sample.length === 0) continue;

      if (!perElementStyles[selector]) {
        perElementStyles[selector] = {};
        for (const prop of properties) {
          perElementStyles[selector][prop] = new Set<string>();
        }
      }

      for (const el of sample) {
        const s = getComputedStyle(el);

        // Flat collection
        collected.colors.add(s.color);
        collected.backgroundColors.add(s.backgroundColor);
        collected.fontFamilies.add(s.fontFamily);
        collected.fontSizes.add(s.fontSize);
        collected.fontWeights.add(s.fontWeight);
        collected.lineHeights.add(s.lineHeight);
        collected.paddings.add(s.padding);
        collected.margins.add(s.margin);
        collected.borderRadii.add(s.borderRadius);
        if (s.boxShadow && s.boxShadow !== "none") {
          collected.boxShadows.add(s.boxShadow);
        }
        if (s.borderColor) {
          collected.borderColors.add(s.borderColor);
        }

        // Per-element collection — skip default values
        for (const prop of properties) {
          const val = (s as unknown as Record<string, string>)[prop] ?? "";
          if (val && val !== defaults[prop] && val !== "none" && val !== "normal" && val !== "auto") {
            perElementStyles[selector][prop].add(val);
          }
        }
      }
    }

    // Extract CSS custom properties from :root
    const cssVariables: Record<string, string> = {};
    const rootStyles = getComputedStyle(document.documentElement);
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from(sheet.cssRules)) {
          if (
            rule instanceof CSSStyleRule &&
            (rule.selectorText === ":root" || rule.selectorText === "html")
          ) {
            for (let i = 0; i < rule.style.length; i++) {
              const prop = rule.style[i];
              if (prop.startsWith("--")) {
                cssVariables[prop] = rootStyles.getPropertyValue(prop).trim();
              }
            }
          }
        }
      } catch {
        // Cross-origin stylesheets will throw — skip them
      }
    }

    // Convert per-element Sets to arrays
    const perElementResult: Record<string, Record<string, string[]>> = {};
    for (const [sel, props] of Object.entries(perElementStyles)) {
      perElementResult[sel] = {};
      for (const [prop, vals] of Object.entries(props)) {
        const arr = Array.from(vals);
        if (arr.length > 0) {
          perElementResult[sel][prop] = arr;
        }
      }
      // Remove selectors with no non-default styles
      if (Object.keys(perElementResult[sel]).length === 0) {
        delete perElementResult[sel];
      }
    }

    return {
      computedStyles: {
        colors: Array.from(collected.colors),
        backgroundColors: Array.from(collected.backgroundColors),
        fontFamilies: Array.from(collected.fontFamilies),
        fontSizes: Array.from(collected.fontSizes),
        fontWeights: Array.from(collected.fontWeights),
        lineHeights: Array.from(collected.lineHeights),
        paddings: Array.from(collected.paddings),
        margins: Array.from(collected.margins),
        borderRadii: Array.from(collected.borderRadii),
        boxShadows: Array.from(collected.boxShadows),
        borderColors: Array.from(collected.borderColors),
      },
      perElementStyles: perElementResult,
      cssVariables,
    };
  }, [...CSS_PROPERTIES]);

  // Use viewport-only screenshot to stay within Claude's 8000px image limit
  const screenshotBuffer = await page.screenshot({ fullPage: false });
  const screenshotBase64 = screenshotBuffer.toString("base64");

  await browser.close();

  return { computedStyles, screenshotBase64 };
}
