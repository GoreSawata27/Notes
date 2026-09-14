import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import { PRACTICE_ROUTES } from "@/lib/practice-routes";
import { JS_CONCEPTS, JS_METHODS } from "./js-catalog";
import { REACT_EVOLUTION, getReactChapter } from "./react-catalog";
import { blocksToSearchText, parseCommentBlocks, slugify, splitLeadAndRest } from "./markdown";
import { parseMarkdown, parseProfile, parseLearningMarkdown } from "./parse-markdown";
import { parseSnippetSource } from "./parse-snippets";
import { LEARNING_TOPICS, getLearningTopic } from "./learning-topics";
import { NOTE_TOPICS, getTopic } from "./topics";
import type { HubCard, ListItem, ListSection, MdBlock, Question, SnippetCard } from "./types";

function contentRoot() {
  return path.join(process.cwd(), "content");
}

function readContentFile(relativePath: string): string {
  return fs.readFileSync(path.join(contentRoot(), relativePath), "utf8");
}

function questionToItem(question: Question): ListItem {
  return {
    id: slugify(question.text) || `q${question.num}`,
    num: question.num,
    title: question.text,
    badge: question.tag || (question.mustKnow ? "must-know" : undefined),
    versionBadges: question.versionBadges,
    searchText: [
      question.text,
      question.shortDef,
      question.say,
      question.followUp,
      question.mistake,
      (question.versionBadges ?? []).join(" "),
      blocksToSearchText(question.extra),
    ].join(" "),
    shortDef: question.shortDef,
    say: question.say,
    extra: question.extra,
    followUp: question.followUp,
    mistake: question.mistake,
  };
}

function snippetToItem(card: SnippetCard, index: number): ListItem {
  const parsed = card.extra?.length ? card.extra : parseCommentBlocks(card.explanation);
  const { lead, rest } = splitLeadAndRest(parsed);
  const extra: MdBlock[] = [
    ...rest,
    ...(card.code ? ([{ type: "code", code: card.code, lang: "js" }] satisfies MdBlock[]) : []),
  ];
  return {
    id: slugify(card.title) || `item-${index + 1}`,
    num: index + 1,
    title: card.title,
    searchText: [card.title, card.explanation, card.code, blocksToSearchText(extra)].join(" "),
    shortDef: lead || undefined,
    extra,
  };
}

export const getTopicPage = cache((id: string) => {
  const topic = getTopic(id);
  if (!topic) return null;
  const raw = readContentFile(path.join("interview-notes", topic.file));
  const { profile, body } = parseProfile(raw);
  const noteSections = parseMarkdown(body);
  const sections: ListSection[] = noteSections.map((section) => ({
    id: section.id,
    title: section.title,
    items: section.questions.map(questionToItem),
  }));
  const questionCount = sections.reduce((sum, section) => sum + section.items.length, 0);
  return { topic, profile, sections, questionCount };
});

function catalogToSections(entries: typeof JS_CONCEPTS, idPrefix: string): ListSection[] {
  return entries.map((entry) => {
    const items: ListItem[] = [];
    for (const file of entry.files) {
      const cards = parseSnippetSource(readContentFile(file));
      cards.forEach((card, index) => {
        items.push({ ...snippetToItem(card, index), num: items.length + 1 });
      });
    }
    return {
      id: `${idPrefix}-${entry.slug}`,
      title: entry.title,
      items,
    };
  });
}

function fileToSection(relativePath: string, title: string, id: string): ListSection {
  const cards = parseSnippetSource(readContentFile(relativePath));
  return {
    id,
    title,
    items: cards.map((card, index) => snippetToItem(card, index)),
  };
}

export const getLearningPage = cache((id: string) => {
  const topic = getLearningTopic(id);
  if (!topic) return null;
  const raw = readContentFile(path.join("learning-notes", topic.file));
  const { profile, body } = parseProfile(raw);
  const noteSections = parseLearningMarkdown(body);
  const sections: ListSection[] = noteSections.map((section) => ({
    id: section.id,
    title: section.title,
    items: section.questions.map(questionToItem),
  }));
  const lessonCount = sections.reduce((sum, section) => sum + section.items.length, 0);

  let conceptCount = 0;
  let methodCount = 0;
  let snippetCount = 0;

  if (id === "javascript") {
    const concepts = JS_CONCEPTS.filter((entry) => entry.slug !== "typescript-types");
    const conceptSections = catalogToSections(concepts, "js-concept");
    conceptCount = conceptSections.reduce((sum, section) => sum + section.items.length, 0);
    const methodSections = JS_METHODS.map((entry) => {
      const section = fileToSection(entry.files[0], entry.title, `js-method-${entry.slug}`);
      return section;
    });
    methodCount = methodSections.reduce((sum, section) => sum + section.items.length, 0);
    sections.push(...conceptSections, ...methodSections);
  }

  if (id === "typescript") {
    const snippetSection = fileToSection(
      "typescript/index.ts",
      "TypeScript Types (Cheatsheet)",
      "ts-types-cheatsheet",
    );
    snippetCount = snippetSection.items.length;
    sections.push(snippetSection);
  }

  const totalItemCount = sections.reduce((sum, section) => sum + section.items.length, 0);

  return {
    topic,
    profile,
    sections,
    lessonCount,
    totalItemCount,
    conceptCount,
    methodCount,
    snippetCount,
  };
});

export const getReactReferencePage = cache((slug: string) => {
  const entry = getReactChapter(slug);
  if (!entry) return null;
  const raw = readContentFile(path.join("learning-notes", "react", entry.file));
  const { profile, body } = parseProfile(raw);
  const noteSections = parseLearningMarkdown(body);
  const sections: ListSection[] = noteSections.map((section) => ({
    id: section.id,
    title: section.title,
    items: section.questions.map(questionToItem),
  }));
  const lessonCount = sections.reduce((sum, section) => sum + section.items.length, 0);
  return { entry, profile, sections, lessonCount };
});

export const getSnippetPage = cache((files: string[], sectionTitles?: string[]) => {
  const sections: ListSection[] = files.map((file, fileIndex) => {
    const cards = parseSnippetSource(readContentFile(file));
    const title = sectionTitles?.[fileIndex] ?? path.basename(file);
    return {
      id: `s${fileIndex + 1}-${slugify(title)}`,
      title,
      items: cards.map((card, index) => snippetToItem(card, index)),
    };
  });
  const itemCount = sections.reduce((sum, section) => sum + section.items.length, 0);
  return { sections, itemCount };
});

export const getSnippetCount = cache((files: string[]) => {
  return files.reduce((sum, file) => sum + parseSnippetSource(readContentFile(file)).length, 0);
});

export const getHubData = cache(() => {
  const interview: HubCard[] = [];
  const learning: HubCard[] = [];
  const company: HubCard[] = [];
  let totalQuestions = 0;

  for (const topic of NOTE_TOPICS) {
    const page = getTopicPage(topic.id);
    const count = page?.questionCount ?? 0;
    totalQuestions += count;
    const card: HubCard = {
      href: `/notes/${topic.id}`,
      title: topic.title,
      description: topic.description,
      meta: `${count} questions`,
      badge: topic.hubBadge,
      company: topic.category === "company",
    };
    if (topic.category === "company") company.push(card);
    else interview.push(card);
  }

  for (const topic of LEARNING_TOPICS) {
    const page = getLearningPage(topic.id);
    if (!page) continue;

    let meta = `${page.lessonCount} lessons`;
    if (topic.id === "javascript") {
      meta = `${page.lessonCount} lessons · ${page.conceptCount} concepts · ${page.methodCount} methods`;
    } else if (topic.id === "typescript") {
      meta = `${page.lessonCount} lessons · ${page.snippetCount} snippets`;
    } else if (topic.id === "react") {
      meta = `${page.lessonCount} lessons · ${REACT_EVOLUTION.length} evolution chapters`;
    }

    learning.push({
      href: `/notes/learn/${topic.id}`,
      title: topic.title,
      description: topic.description,
      meta,
    });
  }

  const playground: HubCard[] = [
    {
      href: "/practice/nested-checkbox",
      title: "Practice",
      description: "Machine-coding exercises with a live React playground.",
      meta: `${PRACTICE_ROUTES.length} exercises`,
    },
    {
      href: "/learn",
      title: "Learn Next.js",
      description: "CSR, SSR, SSG, ISR, PPR, streaming, and metadata demos.",
      meta: "Rendering track",
    },
    {
      href: "/learn/redux",
      title: "Redux track",
      description: "Six isolated RTK examples from counter to RTK Query.",
      meta: "6 examples",
    },
  ];

  return { totalQuestions, interview, learning, company, playground };
});
