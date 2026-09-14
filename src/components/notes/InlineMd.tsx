import Link from "next/link";
import { Fragment, type ReactNode } from "react";

const TOKEN_RE =
  /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\((?:https?:\/\/[^\s)]+|\/[^\s)]+)\))/g;

function isSafeHref(href: string) {
  return href.startsWith("/") || href.startsWith("https://") || href.startsWith("http://");
}

function renderLink(key: number, label: string, href: string) {
  if (!isSafeHref(href)) return <Fragment key={key}>{`[${label}](${href})`}</Fragment>;
  if (href.startsWith("/")) {
    return (
      <Link key={key} href={href} className="md-link">
        {label}
      </Link>
    );
  }
  return (
    <a key={key} href={href} className="md-link" target="_blank" rel="noreferrer">
      {label}
    </a>
  );
}

export function InlineMd({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  const re = new RegExp(TOKEN_RE.source, "g");
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = re.exec(text))) {
    if (match.index > last) {
      parts.push(<Fragment key={key}>{text.slice(last, match.index)}</Fragment>);
      key += 1;
    }
    const token = match[0];
    if (token.startsWith("`")) {
      parts.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith("**")) {
      parts.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else {
      const link = token.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)$/);
      if (link) {
        parts.push(renderLink(key, link[1], link[2]));
      } else {
        parts.push(<Fragment key={key}>{token}</Fragment>);
      }
    }
    key += 1;
    last = match.index + token.length;
  }

  if (last < text.length) {
    parts.push(<Fragment key={key}>{text.slice(last)}</Fragment>);
  }
  return <>{parts}</>;
}
