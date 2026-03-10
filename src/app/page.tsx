"use client";
import { useState, useRef, useEffect } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { parseResponse, GeneratedComponent } from "@/lib/parser";
import { LivePreview } from "@/app/components/LivePreview";
import { CodeEditor, CodeBlock } from "@/app/components/CodeEditor";
import { DesignSystemPanel } from "@/app/components/DesignSystemPanel";
import type { DesignSystem } from "@/lib/types/design-system";

const CACHE_KEY = "component-agent:design-system";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  component?: GeneratedComponent;
}

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedCode, setEditedCode] = useState("");
  const [editedCssCode, setEditedCssCode] = useState("");
  const [designSystem, setDesignSystem] = useState<DesignSystem | null>(null);
  const [analyzingUrl, setAnalyzingUrl] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [refining, setRefining] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const cssPreviewRef = useRef<HTMLDivElement>(null);

  // Load cached design system on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) setDesignSystem(JSON.parse(cached));
    } catch {
      // ignore parse errors
    }
  }, []);

  const latestComponent = [...messages]
    .reverse()
    .find((m) => m.component)?.component ?? null;

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages]);

  async function analyzeUrl(url: string) {
    setAnalyzingUrl(true);
    setAnalyzeError(null);

    try {
      const res = await fetch("/api/analyze-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAnalyzeError(data.error || "Analysis failed");
        return;
      }

      setDesignSystem(data.designSystem);
      localStorage.setItem(CACHE_KEY, JSON.stringify(data.designSystem));
    } catch (err) {
      console.error(err);
      setAnalyzeError("Failed to analyze URL. Check the console.");
    } finally {
      setAnalyzingUrl(false);
    }
  }

  function clearDesignSystem() {
    setDesignSystem(null);
    localStorage.removeItem(CACHE_KEY);
  }

  async function generate(history: ChatMessage[]) {
    setLoading(true);
    setError(null);

    try {
      const apiMessages = history.map((m) => ({
        role: m.role,
        content:
          m.role === "assistant" ? JSON.stringify(m.component) : m.content,
      }));

      const body: Record<string, unknown> = { messages: apiMessages };
      if (designSystem) {
        // Send design system without the screenshot to save payload size
        const { screenshotBase64: _, ...ds } = designSystem;
        body.designSystem = ds;
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let raw = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        raw += decoder.decode(value);
      }

      const parsed = parseResponse(raw);
      if (!parsed) {
        setError("Failed to parse response. Try again.");
        return;
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: parsed.reasoning,
        component: parsed,
      };
      setMessages([...history, assistantMessage]);
      setEditedCode(parsed.componentCode);
      setEditedCssCode(parsed.cssComponentCode ?? "");
    } catch (err) {
      setError("Something went wrong. Check the console.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function matchCloser(targetRef: React.RefObject<HTMLDivElement | null>, code: string, setCode: (code: string) => void) {
    if (!targetRef.current || !designSystem?.screenshotBase64 || !latestComponent) return;
    setRefining(true);

    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(targetRef.current);
      const previewScreenshotBase64 = dataUrl.split(",")[1];

      const res = await fetch("/api/refine-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentCode: code,
          componentName: latestComponent.componentName,
          previewScreenshotBase64,
          targetScreenshotBase64: designSystem.screenshotBase64,
        }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let raw = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        raw += decoder.decode(value);
      }

      const parsed = parseResponse(raw);
      if (parsed) {
        setCode(parsed.componentCode);
      }
    } catch (err) {
      console.error("Match closer failed:", err);
    } finally {
      setRefining(false);
    }
  }

  async function send() {
    const text = input.trim();
    if (!text) return;

    const userMessage: ChatMessage = { role: "user", content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    await generate(nextMessages);
  }

  const tabs = ["preview", "component"];
  if (latestComponent?.cssComponentCode) tabs.push("css-preview", "css");
  tabs.push("tests");

  return (
    <main className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Component Agent</h1>

      {/* Design system setup */}
      <DesignSystemPanel
        designSystem={designSystem}
        loading={analyzingUrl}
        error={analyzeError}
        onAnalyze={analyzeUrl}
        onClear={clearDesignSystem}
      />

      {/* Conversation thread */}
      {messages.length > 0 && (
        <div
          ref={threadRef}
          className="space-y-3 max-h-64 overflow-y-auto border rounded-lg p-4"
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`text-sm ${
                msg.role === "user" ? "text-gray-900" : "text-gray-600"
              }`}
            >
              <span className="font-medium">
                {msg.role === "user" ? "You" : "Agent"}:
              </span>{" "}
              {msg.role === "user" ? msg.content : msg.content}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="animate-spin">⟳</span>
              Generating...
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div className="space-y-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !loading) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={
            messages.length === 0
              ? "Describe your component... e.g. 'A user card with avatar, name, role, and a follow button'"
              : "Refine the component... e.g. 'Make the follow button toggle between Follow and Unfollow'"
          }
          className="w-full h-24 p-4 border rounded-lg resize-none text-sm"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? "Generating..."
            : messages.length === 0
              ? "Generate"
              : "Refine"}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Output — latest component */}
      {latestComponent && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">{latestComponent.componentName}</h2>

          <Tabs.Root defaultValue="preview">
            <Tabs.List className="flex gap-1 border-b mb-4">
              {tabs.map((tab) => (
                <Tabs.Trigger
                  key={tab}
                  value={tab}
                  className="px-4 py-2 text-sm capitalize text-gray-500 cursor-pointer
                    hover:text-gray-900 hover:bg-gray-100 rounded-t-md transition-colors
                    data-[state=active]:text-blue-600 data-[state=active]:hover:text-blue-600
                    data-[state=active]:hover:bg-transparent
                    data-[state=active]:border-b-2
                    data-[state=active]:border-blue-600"
                >
                  {tab === "css" ? "CSS" : tab === "css-preview" ? "CSS Preview" : tab}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            <Tabs.Content value="preview">
              {designSystem && (
                <div className="flex justify-end mb-2">
                  <button
                    onClick={() => matchCloser(previewRef, editedCode, setEditedCode)}
                    disabled={refining}
                    className="px-3 py-1 text-xs rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {refining ? "Refining..." : "Match closer"}
                  </button>
                </div>
              )}
              <LivePreview
                ref={previewRef}
                componentCode={editedCode}
                componentName={latestComponent.componentName}
              />
            </Tabs.Content>

            <Tabs.Content value="component">
              <CodeEditor value={editedCode} onChange={setEditedCode} />
            </Tabs.Content>

            {latestComponent.cssComponentCode && (
              <>
                <Tabs.Content value="css-preview">
                  {designSystem && (
                    <div className="flex justify-end mb-2">
                      <button
                        onClick={() => matchCloser(cssPreviewRef, editedCssCode, setEditedCssCode)}
                        disabled={refining}
                        className="px-3 py-1 text-xs rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {refining ? "Refining..." : "Match closer"}
                      </button>
                    </div>
                  )}
                  <LivePreview
                    ref={cssPreviewRef}
                    componentCode={editedCssCode}
                    componentName={latestComponent.componentName}
                  />
                </Tabs.Content>
                <Tabs.Content value="css">
                  <CodeEditor value={editedCssCode} onChange={setEditedCssCode} />
                </Tabs.Content>
              </>
            )}

            <Tabs.Content value="tests">
              <CodeBlock code={latestComponent.testCode} />
            </Tabs.Content>
          </Tabs.Root>
        </div>
      )}
    </main>
  );
}
