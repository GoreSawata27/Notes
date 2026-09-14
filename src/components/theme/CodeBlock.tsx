"use client";

import { useEffect, useState, type ReactNode } from "react";
import { highlightCode } from "@/lib/theme/highlight";
import { useTheme } from "./ThemeProvider";

export function CodeBlock({
  code,
  lang,
  actions,
}: {
  code: string;
  lang?: string;
  actions?: ReactNode;
}) {
  const { theme } = useTheme();
  const [html, setHtml] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setHtml(null);

    highlightCode(code, lang, theme).then((result) => {
      if (!cancelled) setHtml(result);
    });

    return () => {
      cancelled = true;
    };
  }, [code, lang, theme]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  const label = lang?.trim() || "code";

  return (
    <div className="code-block">
      <div className="code-block-header">
        <span className="code-block-lang">{label}</span>
        <span className="code-block-actions">
          {actions}
          <button type="button" className="code-block-copy" onClick={handleCopy}>
            {copied ? "Copied" : "Copy"}
          </button>
        </span>
      </div>
      <div className="code-block-body">
        {html ? (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <pre>
            <code>{code}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
