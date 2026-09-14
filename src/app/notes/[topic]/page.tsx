import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NotesShell } from "@/components/notes/NotesShell";
import { getTopicPage } from "@/lib/notes/load-notes";
import { getTopicHub } from "@/lib/notes/topic-hubs";
import { NOTE_TOPICS } from "@/lib/notes/topics";

type Props = { params: Promise<{ topic: string }> };

export function generateStaticParams() {
  return NOTE_TOPICS.map((topic) => ({ topic: topic.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic: id } = await params;
  const page = getTopicPage(id);
  if (!page) return { title: "Notes" };
  return { title: page.topic.title, description: page.topic.description };
}

export default async function TopicNotesPage({ params }: Props) {
  const { topic: id } = await params;
  const page = getTopicPage(id);
  if (!page) notFound();

  return (
    <NotesShell
      brand={page.topic.title}
      description={page.topic.description}
      pill={page.topic.pill}
      countLabel={`${page.questionCount} Q&A`}
      sections={page.sections}
      profile={page.profile}
      nextHref={page.topic.navNext.href}
      nextLabel={page.topic.navNext.label}
      extraLinks={[
        ...(getTopicHub(id)
          ? [{ href: `/notes/hubs/${id}`, label: `${page.topic.title} hub →` }]
          : []),
        ...(page.topic.learningHref ? [{ href: page.topic.learningHref, label: "Learning notes →" }] : []),
        ...(page.topic.extraLinks ?? []),
      ]}
    />
  );
}
