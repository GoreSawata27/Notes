import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NotesShell } from "@/components/notes/NotesShell";
import { getLearningPage } from "@/lib/notes/load-notes";
import { LEARNING_TOPICS } from "@/lib/notes/learning-topics";
import { getTopicHub } from "@/lib/notes/topic-hubs";

type Props = { params: Promise<{ topic: string }> };

export function generateStaticParams() {
  return LEARNING_TOPICS.map((topic) => ({ topic: topic.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic: id } = await params;
  const page = getLearningPage(id);
  if (!page) return { title: "Learning Notes" };
  return { title: `${page.topic.title} — Learning`, description: page.topic.description };
}

export default async function LearningNotesPage({ params }: Props) {
  const { topic: id } = await params;
  const page = getLearningPage(id);
  if (!page) notFound();

  const countLabel =
    page.totalItemCount > page.lessonCount
      ? `${page.totalItemCount} items · ${page.lessonCount} lessons`
      : `${page.lessonCount} lessons`;

  const heroNote =
    id === "javascript"
      ? "Lessons first, then JS Concepts and Methods cheatsheets below."
      : id === "typescript"
        ? "Lessons first, then TypeScript types cheatsheet at the bottom."
        : id === "react"
          ? "Fundamentals first (32 lessons). Expand a lesson to run marked JSX examples inline. React hub has interview prep and Evolution chapters."
          : undefined;

  return (
    <NotesShell
      brand={page.topic.title}
      description={page.topic.description}
      pill={page.topic.pill}
      countLabel={countLabel}
      heroNote={heroNote}
      sections={page.sections}
      profile={page.profile}
      nextHref={page.topic.navNext.href}
      nextLabel={page.topic.navNext.label}
      extraLinks={[
        ...(getTopicHub(id) ? [{ href: `/notes/hubs/${id}`, label: `${page.topic.title} hub →` }] : []),
        { href: page.topic.interviewHref, label: "Interview Q&A →" },
        ...(page.topic.extraLinks ?? []),
      ]}
      variant="learning"
    />
  );
}
