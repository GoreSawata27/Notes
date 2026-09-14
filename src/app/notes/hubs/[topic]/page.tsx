import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CardGrid } from "@/components/notes/NotesHub";
import { getHubResources } from "@/lib/notes/load-notes";
import { TOPIC_HUBS, getTopicHub } from "@/lib/notes/topic-hubs";

type Props = { params: Promise<{ topic: string }> };

export function generateStaticParams() {
  return TOPIC_HUBS.map((hub) => ({ topic: hub.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  const hub = getTopicHub(topic);
  if (!hub) return { title: "Learning hub" };
  return { title: `${hub.title} — Learning hub`, description: hub.description };
}

export default async function TopicHubPage({ params }: Props) {
  const { topic } = await params;
  const hub = getTopicHub(topic);
  if (!hub) notFound();
  const resources = getHubResources(topic);

  return (
    <div className="hub-page">
      <p className="hub-kicker">
        <Link href="/">← Hub</Link>
      </p>
      <h1 className="hub-brand">
        <span>{hub.title}</span>
      </h1>
      <p className="hub-lede">{hub.description}</p>
      <CardGrid
        cards={resources.map((resource) => ({
          href: resource.href,
          title: resource.title,
          description: resource.description,
          meta: resource.meta,
        }))}
      />
    </div>
  );
}
