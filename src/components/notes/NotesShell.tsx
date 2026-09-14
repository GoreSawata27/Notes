import Link from "next/link";
import type { ListSection, MdBlock, NotesChapterLink, NotesVariant } from "@/lib/notes/types";
import { MdBlocks } from "./MdBlocks";
import { NotesTopicList } from "./NotesTopicList";

export function NotesShell({
  brand,
  description,
  pill,
  countLabel,
  sections,
  profile,
  nextHref,
  nextLabel,
  extraLinks,
  chapters,
  searchPlaceholder,
  variant = "interview",
  heroNote,
  prevHref,
  prevLabel,
}: {
  brand: string;
  description: string;
  pill: string;
  countLabel: string;
  sections: ListSection[];
  profile?: MdBlock[];
  nextHref: string;
  nextLabel: string;
  extraLinks?: { href: string; label: string }[];
  chapters?: NotesChapterLink[];
  prevHref?: string;
  prevLabel?: string;
  searchPlaceholder?: string;
  variant?: NotesVariant;
  heroNote?: string;
}) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">{brand}</div>
        <p className="brand-sub">{description}</p>
        {chapters && chapters.length > 0 ? (
          <nav className="chapter-nav" aria-label="Chapters">
            <div className="chapter-nav-label">Chapters</div>
            {chapters.map((chapter, index) => (
              <Link
                key={chapter.href}
                href={chapter.href}
                className={chapter.current ? "nav-link current" : "nav-link"}
              >
                <span className="n">{String(index + 1).padStart(2, "0")}</span>
                {chapter.label}
              </Link>
            ))}
          </nav>
        ) : null}
        <nav>
          {sections.map((section, index) => (
            <a key={section.id} className="nav-link" href={`#${section.id}`}>
              <span className="n">{String(index + 1).padStart(2, "0")}</span>
              {section.title}
            </a>
          ))}
        </nav>
        <div className="links">
          <Link href="/">← Hub</Link>
          {prevHref && prevLabel ? <Link href={prevHref}>← {prevLabel}</Link> : null}
          <Link href={nextHref}>{nextLabel} →</Link>
          {extraLinks?.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
      </aside>
      <div className="main">
        <NotesTopicList
          sections={sections}
          searchPlaceholder={
            searchPlaceholder ?? (variant === "learning" ? "Search lessons…" : "Search questions…")
          }
          variant={variant}
          hero={
            <section key="notes-hero" className="hero">
              <span className="pill">{pill}</span>
              <h1>{brand}</h1>
              <p>
                {description} · {countLabel} · click a card to expand
              </p>
              {heroNote ? <p className="hero-note">{heroNote}</p> : null}
            </section>
          }
          profile={
            profile && profile.length > 0 ? (
              <section key="notes-profile" className="profile-panel">
                <MdBlocks blocks={profile} />
              </section>
            ) : null
          }
        />
      </div>
    </div>
  );
}
