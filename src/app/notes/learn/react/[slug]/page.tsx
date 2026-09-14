import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NotesShell } from "@/components/notes/NotesShell";
import { getReactReferencePage } from "@/lib/notes/load-notes";
import { REACT_EVOLUTION, getReactChapter, getReactChapterNeighbors } from "@/lib/notes/react-catalog";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return REACT_EVOLUTION.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entry = getReactChapter(slug);
  if (!entry) return { title: "React Evolution" };
  return { title: `${entry.title} — React Evolution`, description: entry.description };
}

export default async function ReactEvolutionPage({ params }: Props) {
  const { slug } = await params;
  const page = getReactReferencePage(slug);
  const neighbors = getReactChapterNeighbors(slug);
  if (!page || !neighbors) notFound();

  const chapters = REACT_EVOLUTION.map((entry) => ({
    href: `/notes/learn/react/${entry.slug}`,
    label: entry.title,
    current: entry.slug === slug,
  }));

  return (
    <NotesShell
      brand={page.entry.title}
      description={page.entry.description}
      pill={page.entry.pill}
      countLabel={`${page.lessonCount} lessons`}
      heroNote="Part of the React 16 → 19.3 evolution reference. Expand a card, then use chapter links in the sidebar."
      sections={page.sections}
      profile={page.profile}
      prevHref={`/notes/learn/react/${neighbors.prev.slug}`}
      prevLabel={neighbors.prev.title}
      nextHref={`/notes/learn/react/${neighbors.next.slug}`}
      nextLabel={neighbors.next.title}
      extraLinks={[
        { href: "/notes/hubs/react", label: "React hub →" },
        { href: "/notes/learn/react", label: "React fundamentals →" },
        { href: "/notes/react", label: "Interview Q&A →" },
      ]}
      chapters={chapters}
      variant="learning"
      searchPlaceholder="Search this chapter…"
    />
  );
}
