"use client";
"use no memo";
import { useMemo, useState, useEffect } from "react";
import { LiveProvider, LivePreview as Preview, LiveError } from "react-live";
import { prepareCode } from "@/lib/scope";

// Load Tailwind CDN once — generates CSS at runtime for dynamically
// rendered utility classes that aren't in the build-time stylesheet.
function useTailwindCDN() {
  useEffect(() => {
    if (document.getElementById("tw-cdn")) return;
    const script = document.createElement("script");
    script.id = "tw-cdn";
    script.src = "https://cdn.tailwindcss.com";
    document.head.appendChild(script);
  }, []);
}

export function LivePreview({
  componentCode,
  componentName,
}: {
  componentCode: string;
  componentName: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useTailwindCDN();

  const prepared = useMemo(
    () => {
      try {
        return prepareCode(componentCode, componentName);
      } catch (e) {
        return { code: `render(<pre style={{color:"red"}}>{${JSON.stringify(String(e))}}</pre>)`, scope: {} };
      }
    },
    [componentCode, componentName]
  );

  // Stable scope reference — react-live triggers its useEffect when scope
  // changes by reference. JSON-serialising the keys prevents needless re-evals.
  const scopeKey = Object.keys(prepared.scope).sort().join(",");
  const scope = useMemo(() => prepared.scope, [scopeKey]);

  if (!mounted) {
    return (
      <div className="rounded-lg overflow-hidden bg-white" style={{ minHeight: 400 }} />
    );
  }

  return (
    <div className="rounded-lg overflow-hidden bg-white" style={{ minHeight: 400 }}>
      <LiveProvider code={prepared.code} scope={scope} noInline>
        <div className="p-8">
          <Preview />
        </div>
        <LiveError className="m-0 p-4 bg-red-50 text-red-700 text-sm font-mono whitespace-pre-wrap" />
      </LiveProvider>
    </div>
  );
}
