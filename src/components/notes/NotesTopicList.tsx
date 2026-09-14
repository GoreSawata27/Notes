"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { ListItem, ListSection, NotesVariant } from "@/lib/notes/types";
import { InlineMd } from "./InlineMd";
import { MdBlocks } from "./MdBlocks";

function normalize(text: string) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function badgeLabel(badge: ListItem["badge"]) {
  if (badge === "infosys") return { text: "Infosys", className: "pill pill-info" };
  if (badge === "bajaj") return { text: "Bajaj", className: "pill pill-info" };
  if (badge === "must-know") return { text: "Must know", className: "pill pill-warn" };
  return null;
}

function versionPillClass(label: string) {
  const lower = label.toLowerCase();
  if (lower === "experimental") return "pill pill-warn";
  if (lower === "rsc" || lower === "framework") return "pill pill-info";
  return "pill pill-version";
}

function QuestionCard({ item, variant }: { item: ListItem; variant: NotesVariant }) {
  const badge = badgeLabel(item.badge);
  const tipLabel = variant === "learning" ? "Tip" : "Follow-up";
  const mistakeLabel = variant === "learning" ? "Try it" : "Common mistake";
  return (
    <details className={variant === "learning" ? "qa qa-learning" : "qa"}>
      <summary>
        <span className="q-num">{String(item.num).padStart(2, "0")}</span>
        <span className="q-title">
          <InlineMd text={item.title} />
          {item.versionBadges?.map((label) => (
            <span key={label} className={versionPillClass(label)}>
              {label}
            </span>
          ))}
          {badge ? <span className={badge.className}>{badge.text}</span> : null}
        </span>
      </summary>
      <div className="answer">
        {item.shortDef ? (
          <div className="def">
            <InlineMd text={item.shortDef} />
          </div>
        ) : null}
        {item.say ? (
          <div className="say">
            <InlineMd text={item.say} />
          </div>
        ) : null}
        {item.extra && item.extra.length > 0 ? <MdBlocks blocks={item.extra} /> : null}
        {item.followUp ? (
          <div className="tip">
            <strong>{tipLabel}:</strong> <InlineMd text={item.followUp} />
          </div>
        ) : null}
        {item.mistake ? (
          <div className="mistake">
            <strong>{mistakeLabel}:</strong> <InlineMd text={item.mistake} />
          </div>
        ) : null}
      </div>
    </details>
  );
}

export function NotesTopicList({
  sections,
  hero,
  profile,
  searchPlaceholder = "Search questions…",
  variant = "interview",
}: {
  sections: ListSection[];
  hero?: ReactNode;
  profile?: ReactNode;
  searchPlaceholder?: string;
  variant?: NotesVariant;
}) {
  const [term, setTerm] = useState("");
  const query = normalize(term);

  const visible = useMemo(() => {
    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => !query || normalize(item.searchText).includes(query)),
      }))
      .filter((section) => section.items.length > 0);
  }, [query, sections]);

  const visibleCount = visible.reduce((sum, section) => sum + section.items.length, 0);

  return (
    <>
      <header className="topbar">
        <input
          className="search"
          type="search"
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          value={term}
          onChange={(event) => setTerm(event.target.value)}
        />
      </header>
      <main className="content">
        {hero}
        {profile}
        <div id="list" key="notes-list">
          {visible.map((section) => (
            <section key={section.id} className="topic" id={section.id}>
              <div className="topic-head">
                <h2>{section.title}</h2>
                <span className="count">
                  {section.items.length} {section.items.length === 1 ? "item" : "items"}
                </span>
              </div>
              {section.items.map((item) => {
                const key = `${section.id}-${item.id}-${item.num}`;
                return <QuestionCard key={key} item={item} variant={variant} />;
              })}
            </section>
          ))}
          {visibleCount === 0 ? (
            <p className="empty">
              {variant === "learning" ? "No lessons match your search." : "No questions match your search."}
            </p>
          ) : null}
        </div>
      </main>
    </>
  );
}
