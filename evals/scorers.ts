import { parseResponse, GeneratedComponent } from "../src/lib/parser";
import type { EvalCase } from "./dataset";

/**
 * Checks that the response is valid JSON with all required fields.
 */
export function validJsonScorer({
  output,
}: {
  output: string;
}): { name: string; score: number; metadata?: Record<string, unknown> } {
  const parsed = parseResponse(output);
  if (!parsed) {
    return { name: "valid_json", score: 0, metadata: { error: "Failed to parse JSON" } };
  }

  const hasAllFields =
    typeof parsed.componentName === "string" &&
    typeof parsed.componentCode === "string" &&
    typeof parsed.testCode === "string" &&
    typeof parsed.reasoning === "string";

  return {
    name: "valid_json",
    score: hasAllFields ? 1 : 0,
    metadata: {
      hasComponentName: typeof parsed.componentName === "string",
      hasComponentCode: typeof parsed.componentCode === "string",
      hasTestCode: typeof parsed.testCode === "string",
      hasReasoning: typeof parsed.reasoning === "string",
    },
  };
}

/**
 * Checks structural correctness: default export, self-contained, uses
 * 'use client' when interactive elements are present.
 */
export function structuralScorer({
  output,
}: {
  output: string;
}): { name: string; score: number; metadata?: Record<string, unknown> } {
  const parsed = parseResponse(output);
  if (!parsed) return { name: "structural", score: 0 };

  const code = parsed.componentCode;
  let points = 0;
  let total = 0;
  const checks: Record<string, boolean> = {};

  // Has export default
  total++;
  const hasExportDefault =
    /export\s+default\s+function/.test(code) ||
    /export\s+default\s+class/.test(code) ||
    /export\s+default\s+\w+/.test(code);
  checks.hasExportDefault = hasExportDefault;
  if (hasExportDefault) points++;

  // Has TypeScript interface or type for props (or no props needed)
  total++;
  const hasPropsType =
    /interface\s+\w+Props/.test(code) ||
    /type\s+\w+Props/.test(code) ||
    !/\(\s*\{/.test(code.match(/export default function \w+\(([^)]*)\)/)?.[1] ?? "");
  checks.hasPropsType = hasPropsType;
  if (hasPropsType) points++;

  // Self-contained — no required props on the default export
  total++;
  const exportMatch = code.match(
    /export\s+default\s+function\s+\w+\s*\(([^)]*)\)/
  );
  const isSelfContained =
    !exportMatch || exportMatch[1].trim() === "" || exportMatch[1].trim() === "{}";
  checks.isSelfContained = isSelfContained;
  if (isSelfContained) points++;

  // Uses 'use client' if interactive (useState/useEffect present)
  total++;
  const isInteractive =
    code.includes("useState") || code.includes("useEffect");
  const hasUseClient = /['"]use client['"]/.test(code);
  const clientDirectiveCorrect = !isInteractive || hasUseClient;
  checks.clientDirectiveCorrect = clientDirectiveCorrect;
  if (clientDirectiveCorrect) points++;

  return {
    name: "structural",
    score: points / total,
    metadata: checks,
  };
}

/**
 * Checks that the component uses Radix UI imports when expected.
 */
export function radixUsageScorer({
  output,
  expected,
}: {
  output: string;
  expected: EvalCase["expected"];
}): { name: string; score: number; metadata?: Record<string, unknown> } {
  const parsed = parseResponse(output);
  if (!parsed) return { name: "radix_usage", score: 0 };

  const code = parsed.componentCode;
  const hasRadix = /@radix-ui\/react-/.test(code);

  if (expected.hasRadixImports) {
    return {
      name: "radix_usage",
      score: hasRadix ? 1 : 0,
      metadata: { expected: true, found: hasRadix },
    };
  }

  // If Radix not expected, still fine if present (not penalized), just not required
  return {
    name: "radix_usage",
    score: 1,
    metadata: { expected: false, found: hasRadix },
  };
}

/**
 * Checks that required HTML elements are present in the component code.
 */
export function requiredElementsScorer({
  output,
  expected,
}: {
  output: string;
  expected: EvalCase["expected"];
}): { name: string; score: number; metadata?: Record<string, unknown> } {
  const parsed = parseResponse(output);
  if (!parsed) return { name: "required_elements", score: 0 };

  const code = parsed.componentCode;
  const results: Record<string, boolean> = {};
  let found = 0;

  for (const el of expected.requiredElements) {
    // Check for <element or React.createElement("element"
    const regex = new RegExp(`<${el}[\\s>/]|createElement\\(['"]${el}['"]`, "i");
    const present = regex.test(code);
    results[el] = present;
    if (present) found++;
  }

  return {
    name: "required_elements",
    score: expected.requiredElements.length > 0
      ? found / expected.requiredElements.length
      : 1,
    metadata: results,
  };
}

/**
 * Checks that the exact required Tailwind classes from the design system
 * are present in the generated code.
 */
export function styleConformanceScorer({
  output,
  expected,
}: {
  output: string;
  expected: EvalCase["expected"];
}): { name: string; score: number; metadata?: Record<string, unknown> } {
  if (!expected.requiredClasses || expected.requiredClasses.length === 0) {
    return { name: "style_conformance", score: 1 };
  }

  const parsed = parseResponse(output);
  if (!parsed) return { name: "style_conformance", score: 0 };

  const code = parsed.componentCode;
  const results: Record<string, boolean> = {};
  let found = 0;

  for (const cls of expected.requiredClasses) {
    const present = code.includes(cls);
    results[cls] = present;
    if (present) found++;
  }

  return {
    name: "style_conformance",
    score: found / expected.requiredClasses.length,
    metadata: results,
  };
}

/**
 * When a design system is provided, checks that a cssComponentCode
 * field is present and non-empty.
 */
export function cssVersionScorer({
  output,
  input,
}: {
  output: string;
  input: EvalCase["input"];
}): { name: string; score: number; metadata?: Record<string, unknown> } {
  if (!input.designSystem) {
    return { name: "css_version", score: 1, metadata: { skipped: true } };
  }

  const parsed = parseResponse(output);
  if (!parsed) return { name: "css_version", score: 0 };

  const hasCssCode =
    typeof parsed.cssComponentCode === "string" &&
    parsed.cssComponentCode.length > 50;

  const noStyleJsx = hasCssCode
    ? !parsed.cssComponentCode!.includes("<style jsx")
    : true;

  return {
    name: "css_version",
    score: hasCssCode && noStyleJsx ? 1 : hasCssCode ? 0.5 : 0,
    metadata: { hasCssCode, noStyleJsx, length: parsed.cssComponentCode?.length ?? 0 },
  };
}
