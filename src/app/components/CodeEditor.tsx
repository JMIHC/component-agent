"use client";
"use no memo";
import { useRef, useEffect, useState, useCallback } from "react";
import { createHighlighter, type Highlighter } from "shiki";

let highlighterPromise: Promise<Highlighter> | null = null;
function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-dark"],
      langs: ["tsx"],
    });
  }
  return highlighterPromise;
}

function useHighlightedHtml(code: string) {
  const [html, setHtml] = useState("");
  useEffect(() => {
    let cancelled = false;
    getHighlighter().then((hl) => {
      if (cancelled) return;
      setHtml(hl.codeToHtml(code, { lang: "tsx", theme: "github-dark" }));
    });
    return () => { cancelled = true; };
  }, [code]);
  return html;
}

export function CodeEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const html = useHighlightedHtml(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  const syncScroll = useCallback(() => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  return (
    <div className="relative rounded-lg overflow-x-auto overflow-y-visible" style={{ background: "#0d1117" }}>
      {/* Highlighted layer — drives the container height */}
      <pre
        ref={preRef}
        className="p-4 m-0 text-sm font-mono pointer-events-none whitespace-pre [&>code]:!bg-transparent [&_.shiki]:!bg-transparent"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {/* Editable layer — sits on top, sized to match */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
        spellCheck={false}
        wrap="off"
        className="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-white text-sm font-mono resize-none outline-none whitespace-pre overflow-hidden selection:bg-blue-500/30"
        style={{ WebkitTextFillColor: "transparent" }}
      />
    </div>
  );
}

export function CodeBlock({ code }: { code: string }) {
  const html = useHighlightedHtml(code);

  return (
    <div
      className="rounded-lg overflow-auto text-sm font-mono [&_.shiki]:!bg-transparent"
      style={{ background: "#0d1117" }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
