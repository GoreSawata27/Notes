"use client";

import { useEffect } from "react";
import * as React from "react";
import { createRoot, type Root } from "react-dom/client";

class PreviewErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: (message: string) => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error.message);
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

export default function PreviewSandboxPage() {
  useEffect(() => {
    const mount = document.getElementById("sandbox-root");
    if (!mount) return;
    let root: Root | null = createRoot(mount);

    function report(id: unknown, message: string) {
      window.parent.postMessage({ type: "sandbox-error", id, message }, "*");
    }

    function onMessage(event: MessageEvent) {
      if (event.source !== window.parent) return;
      if (event.data?.type !== "run" || typeof event.data.code !== "string") return;
      window.clearInterval(readyTimer);
      try {
        if (!root) root = createRoot(mount!);
        const factory = new Function("__React", event.data.code) as (
          react: typeof React,
        ) => React.ComponentType;
        const Component = factory(React);
        root.render(
          <PreviewErrorBoundary onError={(message) => report(event.data.id, message)}>
            <Component />
          </PreviewErrorBoundary>,
        );
        window.parent.postMessage({ type: "sandbox-ok", id: event.data.id }, "*");
      } catch (error) {
        report(event.data.id, error instanceof Error ? error.message : String(error));
      }
    }

    window.addEventListener("message", onMessage);
    const announce = () => window.parent.postMessage({ type: "sandbox-ready" }, "*");
    announce();
    const readyTimer = window.setInterval(announce, 250);
    return () => {
      window.clearInterval(readyTimer);
      window.removeEventListener("message", onMessage);
      root?.unmount();
    };
  }, []);

  return <div id="sandbox-root" />;
}
