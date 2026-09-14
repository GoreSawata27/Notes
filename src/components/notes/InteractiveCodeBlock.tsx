"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CodeBlock } from "@/components/theme/CodeBlock";
import { compileExample } from "@/lib/notes/compile-example";

export function InteractiveCodeBlock({
  code,
  lang,
  title,
  autoRun,
}: {
  code: string;
  lang?: string;
  title?: string;
  autoRun?: boolean;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const autoRanRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frameKey, setFrameKey] = useState(0);
  const instanceId = useId();

  useEffect(() => {
    function isOurFrame(event: MessageEvent) {
      const frame = iframeRef.current?.contentWindow;
      return Boolean(frame && event.source === frame);
    }

    function onMessage(event: MessageEvent) {
      if (event.data?.type === "sandbox-ready") {
        if (isOurFrame(event)) setReady(true);
        return;
      }
      if (!isOurFrame(event)) return;
      if (event.data?.id !== instanceId) return;
      if (event.data?.type === "sandbox-error") {
        setError(String(event.data.message ?? "Preview failed"));
      }
      if (event.data?.type === "sandbox-ok") {
        setError(null);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [instanceId, frameKey]);

  function sendRun() {
    setError(null);
    try {
      const compiled = compileExample(code);
      const frame = iframeRef.current?.contentWindow;
      if (!frame) throw new Error("Preview is not ready yet.");
      frame.postMessage({ type: "run", id: instanceId, code: compiled }, "*");
      setRunning(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setRunning(true);
    }
  }

  useEffect(() => {
    if (!autoRun || !ready || autoRanRef.current) return;
    autoRanRef.current = true;
    sendRun();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when the iframe is ready
  }, [autoRun, ready]);

  function handleReset() {
    autoRanRef.current = false;
    setError(null);
    setRunning(false);
    setReady(false);
    setFrameKey((value) => value + 1);
  }

  return (
    <div className="interactive-example">
      {title ? <p className="interactive-example-title">{title}</p> : null}
      <CodeBlock
        code={code}
        lang={lang ?? "jsx"}
        actions={
          <>
            <button type="button" className="code-block-copy" onClick={sendRun} disabled={!ready}>
              {ready ? "Run" : "Loading"}
            </button>
            <button type="button" className="code-block-copy" onClick={handleReset}>
              Reset
            </button>
          </>
        }
      />
      <div className="example-preview">
        <div className="example-preview-label">Preview</div>
        {error ? <pre className="example-preview-error">{error}</pre> : null}
        <iframe
          key={frameKey}
          ref={iframeRef}
          title={title ?? "React example preview"}
          className="example-preview-frame"
          src="/preview/sandbox"
          sandbox="allow-scripts allow-same-origin"
          onLoad={() => setReady(true)}
        />
        {!running && !error ? (
          <p className="example-preview-hint">Click Run to render this example.</p>
        ) : null}
      </div>
    </div>
  );
}
