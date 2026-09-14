import { normalizeNewlines, parseBlocks, slugify } from "./markdown";
import type { MdBlock, NoteSection, Question, QuestionTag } from "./types";

const TAG_RE = /\[(must-know|infosys|bajaj)\]/gi;
const VERSION_TAG_RE = /\[(React [\d.]+|experimental|RSC|framework)\]/gi;

export function extractVersionBadges(title: string): { text: string; badges: string[] } {
  const badges = [...title.matchAll(VERSION_TAG_RE)].map((match) => match[1]);
  const text = title.replace(VERSION_TAG_RE, "").replace(/\s+/g, " ").trim();
  return { text, badges };
}

export function parseProfile(md: string): { profile: MdBlock[]; body: string } {
  const source = normalizeNewlines(md);
  const match = source.match(/(?:^|\n)## Profile\s*\n([\s\S]*?)(?=\n## |\n### Q|$)/i);
  if (!match) return { profile: [], body: source };
  const profileBlock = match[1].trim();
  const body = source.replace(match[0], "\n").trim();
  return { profile: parseBlocks(profileBlock), body };
}

export function parseMarkdown(md: string): NoteSection[] {
  const source = normalizeNewlines(md);
  const sections: NoteSection[] = [];
  let currentSection: NoteSection | null = null;
  let currentQ: Question | null = null;
  let bodyLines: string[] = [];

  const flushBody = () => {
    if (!currentQ || !currentSection) return;
    const body = bodyLines.join("\n").trim();
    bodyLines = [];

    const defMatch = body.match(
      /\*\*Short definition:\*\*\s*([\s\S]*?)(?=\*\*Answer:\*\*|\*\*Follow-up:\*\*|\*\*Common mistake:\*\*|$)/i,
    );
    const answerMatch = body.match(
      /\*\*Answer:\*\*\s*([\s\S]*?)(?=\*\*Follow-up:\*\*|\*\*Common mistake:\*\*|$)/i,
    );
    const followMatch = body.match(/\*\*Follow-up:\*\*\s*([\s\S]*?)(?=\*\*Common mistake:\*\*|$)/i);
    const mistakeMatch = body.match(/\*\*Common mistake:\*\*\s*([\s\S]*?)$/i);

    let answerRaw = answerMatch
      ? answerMatch[1].trim()
      : body.replace(/\*\*Short definition:\*\*[\s\S]*?(?=\*\*Answer:\*\*|$)/i, "").trim();
    answerRaw = answerRaw.replace(/^---\s*$/gm, "").trim();

    const firstPara = answerRaw.split("\n\n")[0] ?? "";
    const say = firstPara.replace(/\n/g, " ").trim();
    const rest = answerRaw.slice(firstPara.length).trim();

    currentQ.shortDef = defMatch ? defMatch[1].replace(/^---\s*$/gm, "").trim() : "";
    currentQ.say = say;
    currentQ.extra = rest ? parseBlocks(rest) : [];
    currentQ.followUp = followMatch ? followMatch[1].replace(/^---\s*$/gm, "").trim() : "";
    currentQ.mistake = mistakeMatch ? mistakeMatch[1].replace(/^---\s*$/gm, "").trim() : "";

    currentSection.questions.push(currentQ);
    currentQ = null;
  };

  for (const line of source.split("\n")) {
    if (line.startsWith("## ") && !/^## Profile/i.test(line)) {
      flushBody();
      const title = line
        .replace(/^##\s+/, "")
        .replace(/^Section \d+:\s*/i, "")
        .trim();
      currentSection = { id: "", title, questions: [] };
      currentSection.id = `t${sections.length + 1}-${slugify(title)}`;
      sections.push(currentSection);
      continue;
    }

    if (line.startsWith("### Q")) {
      flushBody();
      const heading = line.match(/^### Q(\d+)\.\s*(.+)$/i);
      if (!heading) continue;
      if (!currentSection) {
        currentSection = { id: "t1-general", title: "General", questions: [] };
        sections.push(currentSection);
      }
      const rawTitle = heading[2];
      const tags = [...rawTitle.matchAll(TAG_RE)].map((m) => m[1].toLowerCase() as QuestionTag);
      const text = rawTitle.replace(TAG_RE, "").replace(/\s+/g, " ").trim();
      const tag = tags.find((t) => t === "infosys" || t === "bajaj") ?? tags[0] ?? "";
      currentQ = {
        num: Number.parseInt(heading[1], 10),
        text,
        mustKnow: tags.includes("must-know") || tags.includes("infosys") || tags.includes("bajaj"),
        tag,
        shortDef: "",
        say: "",
        extra: [],
        followUp: "",
        mistake: "",
      };
      continue;
    }

    if (currentQ) bodyLines.push(line);
  }

  flushBody();
  return sections.filter((section) => section.questions.length > 0);
}

export function parseLearningMarkdown(md: string): NoteSection[] {
  const source = normalizeNewlines(md);
  const sections: NoteSection[] = [];
  let currentSection: NoteSection | null = null;
  let currentQ: Question | null = null;
  let bodyLines: string[] = [];

  const flushBody = () => {
    if (!currentQ || !currentSection) return;
    const body = bodyLines.join("\n").trim();
    bodyLines = [];

    const takeawayMatch = body.match(
      /\*\*Takeaway:\*\*\s*([\s\S]*?)(?=\*\*Explain:\*\*|\*\*Tip:\*\*|\*\*Try it:\*\*|$)/i,
    );
    const explainMatch = body.match(/\*\*Explain:\*\*\s*([\s\S]*?)(?=\*\*Tip:\*\*|\*\*Try it:\*\*|$)/i);
    const tipMatch = body.match(/\*\*Tip:\*\*\s*([\s\S]*?)(?=\*\*Try it:\*\*|$)/i);
    const tryMatch = body.match(/\*\*Try it:\*\*\s*([\s\S]*?)$/i);

    let explainRaw = explainMatch
      ? explainMatch[1].trim()
      : body.replace(/\*\*Takeaway:\*\*[\s\S]*?(?=\*\*Explain:\*\*|$)/i, "").trim();
    explainRaw = explainRaw.replace(/^---\s*$/gm, "").trim();

    const firstPara = explainRaw.split("\n\n")[0] ?? "";
    const lead = firstPara.trim();
    const structuredLead =
      lead.startsWith("|") ||
      lead.startsWith("```") ||
      /^#{1,3}\s/.test(lead) ||
      /^[-*] /.test(lead) ||
      /^\d+\. /.test(lead);
    const say = structuredLead ? "" : lead.replace(/\n/g, " ").trim();
    const rest = structuredLead ? explainRaw : explainRaw.slice(firstPara.length).trim();

    currentQ.shortDef = takeawayMatch ? takeawayMatch[1].replace(/^---\s*$/gm, "").trim() : "";
    currentQ.say = say;
    currentQ.extra = rest ? parseBlocks(rest) : [];
    currentQ.followUp = tipMatch ? tipMatch[1].replace(/^---\s*$/gm, "").trim() : "";
    currentQ.mistake = tryMatch ? tryMatch[1].replace(/^---\s*$/gm, "").trim() : "";

    currentSection.questions.push(currentQ);
    currentQ = null;
  };

  for (const line of source.split("\n")) {
    if (line.startsWith("## ") && !/^## Profile/i.test(line)) {
      flushBody();
      const title = line
        .replace(/^##\s+/, "")
        .replace(/^Section \d+:\s*/i, "")
        .trim();
      currentSection = { id: "", title, questions: [] };
      currentSection.id = `t${sections.length + 1}-${slugify(title)}`;
      sections.push(currentSection);
      continue;
    }

    const lessonHeading = line.match(/^### (?:Lesson\s+)?L?(\d+)\.\s*(.+)$/i);
    if (lessonHeading) {
      flushBody();
      if (!currentSection) {
        currentSection = { id: "t1-general", title: "General", questions: [] };
        sections.push(currentSection);
      }
      const { text, badges } = extractVersionBadges(lessonHeading[2].replace(/\s+/g, " ").trim());
      currentQ = {
        num: Number.parseInt(lessonHeading[1], 10),
        text,
        mustKnow: false,
        tag: "",
        versionBadges: badges.length ? badges : undefined,
        shortDef: "",
        say: "",
        extra: [],
        followUp: "",
        mistake: "",
      };
      continue;
    }

    if (currentQ) bodyLines.push(line);
  }

  flushBody();
  return sections.filter((section) => section.questions.length > 0);
}
