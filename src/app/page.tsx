"use client";
import { useState, useRef, useEffect } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { parseResponse, GeneratedComponent } from "@/lib/parser";
import { LivePreview } from "@/app/components/LivePreview";
import { CodeEditor, CodeBlock } from "@/app/components/CodeEditor";
import { DESIGN_SYSTEMS, type DesignSystemKey } from "@/lib/design-systems";

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
  const [selectedSystem, setSelectedSystem] = useState<DesignSystemKey>("none");
  const threadRef = useRef<HTMLDivElement>(null);

  const latestComponent = [...messages]
    .reverse()
    .find((m) => m.component)?.component ?? null;

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages]);

  async function generate(
    history: ChatMessage[],
    system: DesignSystemKey
  ) {
    setLoading(true);
    setError(null);

    try {
      const apiMessages = history.map((m) => ({
        role: m.role,
        content:
          m.role === "assistant" ? JSON.stringify(m.component) : m.content,
      }));

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          designSystem: DESIGN_SYSTEMS[system],
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
    } catch (err) {
      setError("Something went wrong. Check the console.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function send() {
    const text = input.trim();
    if (!text) return;

    const userMessage: ChatMessage = { role: "user", content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    await generate(nextMessages, selectedSystem);
  }

  async function switchDesignSystem(key: DesignSystemKey) {
    if (key === selectedSystem) return;
    setSelectedSystem(key);
    if (messages.length === 0) return;

    const label = key === "none" ? "Default (Radix + Tailwind)" : key;
    const switchMessage: ChatMessage = {
      role: "user",
      content: `Rebuild this component using the ${label} design system. Keep the same functionality and layout.`,
    };
    const nextMessages = [...messages, switchMessage];
    setMessages(nextMessages);
    await generate(nextMessages, key);
  }

  return (
    <main className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Component Agent</h1>

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
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Design system:</span>
          {(Object.keys(DESIGN_SYSTEMS) as DesignSystemKey[]).map((key) => (
            <button
              key={key}
              onClick={() => switchDesignSystem(key)}
              className={`px-3 py-1 text-sm rounded-full border cursor-pointer transition-colors ${
                selectedSystem === key
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
              }`}
            >
              {key === "none" ? "Default" : key}
            </button>
          ))}
        </div>
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
              {["preview", "component", "tests", "reasoning"].map((tab) => (
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
                  {tab}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            <Tabs.Content value="preview">
              <LivePreview
                componentCode={editedCode}
                componentName={latestComponent.componentName}
              />
            </Tabs.Content>

            <Tabs.Content value="component">
              <CodeEditor value={editedCode} onChange={setEditedCode} />
            </Tabs.Content>

            <Tabs.Content value="tests">
              <CodeBlock code={latestComponent.testCode} />
            </Tabs.Content>

            <Tabs.Content value="reasoning">
              <p className="p-4 bg-gray-50 border rounded-lg text-sm text-gray-700 leading-relaxed">
                {latestComponent.reasoning}
              </p>
            </Tabs.Content>
          </Tabs.Root>
        </div>
      )}
    </main>
  );
}
