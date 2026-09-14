export type MdBlock =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "code"; code: string; lang?: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] };

export type QuestionTag = "must-know" | "infosys" | "bajaj";

export type Question = {
  num: number;
  text: string;
  mustKnow: boolean;
  tag: QuestionTag | "";
  versionBadges?: string[];
  shortDef: string;
  say: string;
  extra: MdBlock[];
  followUp: string;
  mistake: string;
};

export type NoteSection = {
  id: string;
  title: string;
  questions: Question[];
};

export type TopicCategory = "core" | "company";

export type TopicMeta = {
  id: string;
  category: TopicCategory;
  file: string;
  title: string;
  pill: string;
  description: string;
  hubBadge?: string;
  navNext: { href: string; label: string };
  extraLinks?: { href: string; label: string }[];
  learningHref?: string;
};

export type LearningTopicMeta = {
  id: string;
  file: string;
  title: string;
  pill: string;
  description: string;
  interviewHref: string;
  navNext: { href: string; label: string };
  extraLinks?: { href: string; label: string }[];
};

export type NotesVariant = "interview" | "learning";

export type ListItem = {
  id: string;
  num: number;
  title: string;
  badge?: QuestionTag;
  versionBadges?: string[];
  searchText: string;
  shortDef?: string;
  say?: string;
  extra?: MdBlock[];
  followUp?: string;
  mistake?: string;
};

export type NotesChapterLink = {
  href: string;
  label: string;
  current?: boolean;
};

export type ReactCatalogEntry = {
  slug: string;
  title: string;
  description: string;
  file: string;
  pill: string;
};

export type ListSection = {
  id: string;
  title: string;
  items: ListItem[];
};

export type HubCard = {
  href: string;
  title: string;
  description: string;
  meta: string;
  badge?: string;
  company?: boolean;
};

export type SnippetCard = {
  title: string;
  explanation: string;
  code: string;
  extra?: MdBlock[];
};

export type JsCatalogEntry = {
  slug: string;
  title: string;
  description: string;
  files: string[];
  sectionTitles?: string[];
};
