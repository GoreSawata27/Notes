import type { LearningTopicMeta } from "./types";

export const LEARNING_TOPICS: LearningTopicMeta[] = [
  {
    id: "html",
    file: "01-html.md",
    title: "HTML",
    pill: "From zero to semantic mastery",
    description:
      "Progressive lessons on document structure, semantics, forms, accessibility, media, and browser APIs.",
    interviewHref: "/notes/html",
    navNext: { href: "/notes/learn/css", label: "CSS learning" },
  },
  {
    id: "css",
    file: "02-css.md",
    title: "CSS",
    pill: "Layout & styling deep dive",
    description:
      "Cascade, box model, Flexbox, Grid, responsive design, animations, and modern CSS architecture.",
    interviewHref: "/notes/css",
    navNext: { href: "/notes/learn/javascript", label: "JavaScript learning" },
  },
  {
    id: "javascript",
    file: "03-javascript.md",
    title: "JavaScript",
    pill: "Language fundamentals",
    description:
      "Lessons, JS concept cards, and Array/Object/String method cheatsheets — all in one scrollable track.",
    interviewHref: "/notes/javascript",
    navNext: { href: "/notes/learn/typescript", label: "TypeScript learning" },
  },
  {
    id: "typescript",
    file: "08-typescript.md",
    title: "TypeScript",
    pill: "Types + React TSX",
    description:
      "Type system, generics, utility types, tsconfig, React component patterns in TSX, and types cheatsheet.",
    interviewHref: "/notes/typescript",
    navNext: { href: "/notes/learn/tailwind", label: "Tailwind learning" },
  },
  {
    id: "tailwind",
    file: "04-tailwindcss.md",
    title: "Tailwind CSS",
    pill: "Utility-first styling",
    description:
      "Tailwind v4 CSS-first setup, layout utilities, responsive design, dark mode, and real UI builds.",
    interviewHref: "/notes/tailwind",
    navNext: { href: "/notes/learn/react", label: "React learning" },
  },
  {
    id: "react",
    file: "05-react.md",
    title: "React",
    pill: "UI library mastery",
    description:
      "Components, hooks, state, effects, performance, composition patterns, React 19 basics, and a React 16–19.3 evolution reference.",
    interviewHref: "/notes/react",
    navNext: { href: "/notes/learn/nextjs", label: "Next.js learning" },
    extraLinks: [{ href: "/notes/learn/react/evolution", label: "React Evolution →" }],
  },
  {
    id: "nextjs",
    file: "06-nextjs.md",
    title: "Next.js",
    pill: "Full-stack React",
    description: "App Router, RSC, data fetching, rendering modes, Server Actions, metadata, and deployment.",
    interviewHref: "/notes/nextjs",
    navNext: { href: "/notes/learn/redux", label: "Redux learning" },
    extraLinks: [{ href: "/learn", label: "Live rendering demos →" }],
  },
  {
    id: "redux",
    file: "09-redux.md",
    title: "Redux & RTK",
    pill: "Client state",
    description: "One-way data flow, Redux Toolkit slices, async thunks, RTK Query, and the live playground.",
    interviewHref: "/notes/redux",
    navNext: { href: "/notes/learn/react-query", label: "React Query learning" },
    extraLinks: [{ href: "/learn/redux", label: "Redux playground →" }],
  },
  {
    id: "react-query",
    file: "10-react-query.md",
    title: "React Query",
    pill: "Server state",
    description:
      "Query keys, staleTime, mutations, invalidation, optimistic updates, infinite queries, and SSR hydration.",
    interviewHref: "/notes/react-query",
    navNext: { href: "/notes/learn/jest", label: "Jest learning" },
  },
  {
    id: "jest",
    file: "07-jest-rtl.md",
    title: "Jest & RTL",
    pill: "Testing frontend",
    description: "Jest matchers, mocks, React Testing Library queries, user-event, MSW, and Next.js testing.",
    interviewHref: "/notes/jest",
    navNext: { href: "/notes/learn/git", label: "Git learning" },
  },
  {
    id: "git",
    file: "11-git.md",
    title: "Git",
    pill: "Version control",
    description:
      "Objects, branching, rebase vs merge, undo tools, reflog, bisect, remotes, and team workflows.",
    interviewHref: "/notes/git",
    navNext: { href: "/notes/learn/realtime", label: "Realtime learning" },
  },
  {
    id: "realtime",
    file: "12-realtime.md",
    title: "Realtime",
    pill: "Sockets in production",
    description:
      "Native WebSocket, socket.io-client, SSE, reconnect/auth, React hooks, and Next.js deployment.",
    interviewHref: "/notes/realtime",
    navNext: { href: "/notes/learn/html", label: "HTML learning" },
  },
];

export function getLearningTopic(id: string): LearningTopicMeta | undefined {
  return LEARNING_TOPICS.find((topic) => topic.id === id);
}
