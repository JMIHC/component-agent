"use client";
import { useState, useEffect } from "react";
import type { DesignSystem } from "@/lib/types/design-system";

interface DesignSystemPanelProps {
  designSystem: DesignSystem | null;
  loading: boolean;
  error: string | null;
  onAnalyze: (url: string) => void;
  onClear: () => void;
}

export function DesignSystemPanel({
  designSystem,
  loading,
  error,
  onAnalyze,
  onClear,
}: DesignSystemPanelProps) {
  const [url, setUrl] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    onAnalyze(trimmed);
  }

  if (loading) {
    return <AnalyzingIndicator />;
  }

  if (designSystem) {
    const allColors = [
      ...designSystem.colors.primary,
      ...designSystem.colors.secondary,
      ...designSystem.colors.accent,
    ].slice(0, 8);

    return (
      <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {designSystem.screenshotBase64 && (
              <img
                src={`data:image/png;base64,${designSystem.screenshotBase64}`}
                alt="Site screenshot"
                className="w-16 h-10 object-cover object-top rounded border"
              />
            )}
            <div>
              <p className="text-sm font-medium">Design system active</p>
              <a
                href={designSystem.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                {designSystem.url}
              </a>
            </div>
          </div>
          <button
            onClick={onClear}
            className="px-3 py-1 text-xs rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 cursor-pointer"
          >
            Clear
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {allColors.map((color, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full border border-gray-200"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <span className="text-xs text-gray-400">
            {designSystem.typography.fontFamilies.slice(0, 2).join(", ")}
          </span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <label className="text-sm text-gray-500">
        Reference design system (optional)
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="example.com"
          className="flex-1 px-3 py-2 border rounded-lg text-sm"
        />
        <button
          type="submit"
          disabled={!url.trim()}
          className="px-4 py-2 bg-gray-800 text-white text-sm rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Analyze
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}

function AnalyzingIndicator() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 250);
    return () => clearInterval(id);
  }, []);

  const stage =
    elapsed < 6
      ? "Launching browser session"
      : elapsed < 14
        ? "Rendering page and extracting styles"
        : elapsed < 30
          ? "Analyzing with Claude Vision"
          : "Wrapping up";

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="flex items-center gap-3 text-sm text-gray-600">
        <span
          aria-hidden
          className="inline-block w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-medium">Analyzing design system…</p>
            <span className="text-xs tabular-nums text-gray-500">
              {elapsed}s
            </span>
          </div>
          <p className="text-gray-400 text-xs mt-0.5">{stage}</p>
        </div>
      </div>
      <div
        role="progressbar"
        aria-label="Analyzing design system"
        className="mt-3 h-1 w-full overflow-hidden rounded-full bg-gray-200"
      >
        <div className="h-full w-1/3 rounded-full bg-blue-500 animate-[indeterminate_1.4s_ease-in-out_infinite]" />
      </div>
      <style jsx>{`
        @keyframes indeterminate {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }
      `}</style>
    </div>
  );
}
