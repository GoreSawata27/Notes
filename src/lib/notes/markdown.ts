import type { MdBlock } from "./types";

export function normalizeNewlines(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export function isSeparatorLine(line: string): boolean {
  const trimmed = line.trim();
  return /^(?:[-*=_~]{3,}|[-*=_~\s]{6,})$/.test(trimmed);
}

function isTableRow(line: string): boolean {
  return line.trim().startsWith("|");
}

function isTableDivider(line: string): boolean {
  return /^\s*\|?\s*:?-/.test(line);
}

function looksLikeTableStart(lines: string[], i: number): boolean {
  if (!isTableRow(lines[i])) return false;
  if (i + 1 < lines.length && isTableDivider(lines[i + 1])) return true;
  return i + 1 < lines.length && isTableRow(lines[i + 1]);
}

function flushParagraph(parts: MdBlock[], buffer: string[]) {
  const text = buffer.join(" ").replace(/\s+/g, " ").trim();
  buffer.length = 0;
  if (text) parts.push({ type: "p", text });
}

export function parseFenceInfo(info: string): {
  lang?: string;
  runnable?: boolean;
  autoRun?: boolean;
  title?: string;
  category?: string;
} {
  if (!info) return {};
  const tokens: string[] = [];
  const tokenRe = /([^\s="]+="[^"]*"|[^\s="]+=[^\s]+|[^\s]+)/g;
  let match: RegExpExecArray | null;
  while ((match = tokenRe.exec(info))) tokens.push(match[1]);

  const meta: {
    lang?: string;
    runnable?: boolean;
    autoRun?: boolean;
    title?: string;
    category?: string;
  } = {};

  for (const token of tokens) {
    const eq = token.indexOf("=");
    if (eq > 0) {
      const key = token.slice(0, eq).toLowerCase();
      let value = token.slice(eq + 1);
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (key === "title") meta.title = value;
      if (key === "category") meta.category = value;
      continue;
    }
    const lower = token.toLowerCase();
    if (lower === "runnable") {
      meta.runnable = true;
      continue;
    }
    if (lower === "autorun") {
      meta.autoRun = true;
      continue;
    }
    if (!meta.lang) meta.lang = token;
  }

  return meta;
}

export function parseBlocks(block: string): MdBlock[] {
  return parseStructuredText(block, { allowFences: true });
}

export function parseCommentBlocks(text: string): MdBlock[] {
  return parseStructuredText(text, { allowFences: false });
}

function parseStructuredText(block: string, options: { allowFences: boolean }): MdBlock[] {
  const lines = normalizeNewlines(block).trim().split("\n");
  const parts: MdBlock[] = [];
  const paragraph: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (options.allowFences && line.startsWith("```")) {
      flushParagraph(parts, paragraph);
      const meta = parseFenceInfo(line.slice(3).trim());
      i += 1;
      const codeLines: string[] = [];
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length && lines[i].startsWith("```")) i += 1;
      parts.push({ type: "code", code: codeLines.join("\n"), ...meta });
      continue;
    }

    if (isSeparatorLine(trimmed)) {
      flushParagraph(parts, paragraph);
      i += 1;
      continue;
    }

    if (looksLikeTableStart(lines, i)) {
      flushParagraph(parts, paragraph);
      const tableLines: string[] = [];
      while (i < lines.length && isTableRow(lines[i])) {
        tableLines.push(lines[i].trim());
        i += 1;
      }
      const table = parseTableLines(tableLines);
      if (table) parts.push(table);
      continue;
    }

    if (/^#{1,3}\s+\S/.test(trimmed)) {
      flushParagraph(parts, paragraph);
      parts.push({ type: "h", text: trimmed.replace(/^#{1,3}\s+/, "").trim() });
      i += 1;
      continue;
    }

    if (/^[-*] /.test(trimmed)) {
      flushParagraph(parts, paragraph);
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*] /, ""));
        i += 1;
      }
      parts.push({ type: "ul", items });
      continue;
    }

    if (/^\d+\. /.test(trimmed)) {
      flushParagraph(parts, paragraph);
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\. /, ""));
        i += 1;
      }
      parts.push({ type: "ol", items });
      continue;
    }

    if (trimmed === "") {
      flushParagraph(parts, paragraph);
      i += 1;
      continue;
    }

    paragraph.push(trimmed);
    i += 1;
  }

  flushParagraph(parts, paragraph);
  return parts;
}

export function parseTableLines(tableLines: string[]): MdBlock | null {
  if (tableLines.length < 2) return null;
  const splitRow = (row: string) =>
    row
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim());

  const headers = splitRow(tableLines[0]);
  const dataRows = tableLines.slice(1).filter((row) => !/^\|?\s*:?-/.test(row));
  if (dataRows.length === 0) return null;
  return { type: "table", headers, rows: dataRows.map(splitRow) };
}

export function firstSentence(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  const match = cleaned.match(/^(.+?[.!?])(?:\s|$)/);
  return (match?.[1] ?? cleaned).replace(/[:.]$/, "").trim();
}

export function splitLeadAndRest(blocks: MdBlock[]): { lead: string; rest: MdBlock[] } {
  const firstPara = blocks.find((block) => block.type === "p");
  if (!firstPara || firstPara.type !== "p") {
    return { lead: "", rest: blocks };
  }
  const lead = firstSentence(firstPara.text);
  const rest = blocks.filter((block) => block !== firstPara);
  const leftover = firstPara.text.slice(lead.length).replace(/^[:.\s]+/, "").trim();
  if (leftover) rest.unshift({ type: "p", text: leftover });
  return { lead, rest };
}

export function blocksToSearchText(blocks: MdBlock[]): string {
  return blocks
    .map((block) => {
      if (block.type === "p" || block.type === "h") return block.text;
      if (block.type === "code") return block.code;
      if (block.type === "ul" || block.type === "ol") return block.items.join(" ");
      return [...block.headers, ...block.rows.flat()].join(" ");
    })
    .join(" ");
}
