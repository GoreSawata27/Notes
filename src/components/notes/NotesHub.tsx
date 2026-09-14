import Link from "next/link";
import { STUDY_PLAN } from "@/lib/notes/topics";
import type { HubCard } from "@/lib/notes/types";

export function CardGrid({ cards, company }: { cards: HubCard[]; company?: boolean }) {
  return (
    <div className={company ? "cards cards-company" : "cards"}>
      {cards.map((card) => (
        <Link
          key={card.href}
          href={card.href}
          className={card.company ? "card card-company" : "card"}
        >
          {card.badge ? <span className="company-badge">{card.badge}</span> : null}
          <strong>{card.title}</strong>
          <span>{card.description}</span>
          <span className="meta">{card.meta}</span>
        </Link>
      ))}
    </div>
  );
}

export function NotesHub({
  totalQuestions,
  hubs,
  interview,
  learning,
  company,
  playground,
}: {
  totalQuestions: number;
  hubs: HubCard[];
  interview: HubCard[];
  learning: HubCard[];
  company: HubCard[];
  playground: HubCard[];
}) {
  return (
    <div className="hub-page">
      <h1 className="hub-brand">
        Frontend <span>Notes</span>
      </h1>
      <p className="hub-lede">
        Interview Q&amp;A, in-depth learning tracks, JS cheatsheets, and live practice —{" "}
        {totalQuestions} interview questions with spoken answers, plus tutorial-style lessons and
        machine-coding demos.
      </p>

      {hubs.length > 0 ? (
        <>
          <h2 className="hub-section-title">Learning hubs</h2>
          <CardGrid cards={hubs} />
        </>
      ) : null}

      {interview.length > 0 ? (
        <>
          <h2 className="hub-section-title">Interview Prep</h2>
          <CardGrid cards={interview} />
        </>
      ) : null}

      {learning.length > 0 ? (
        <>
          <h2 className="hub-section-title">Learning Notes</h2>
          <CardGrid cards={learning} />
        </>
      ) : null}

      <h2 className="hub-section-title hub-section-company">Company Prep</h2>
      <CardGrid cards={company} company />

      <h2 className="hub-section-title">Practice &amp; Learn</h2>
      <CardGrid cards={playground} />

      <section className="study-panel">
        <h2>10-week study plan</h2>
        <table>
          <thead>
            <tr>
              <th>Week</th>
              <th>Topics</th>
              <th>Focus</th>
            </tr>
          </thead>
          <tbody>
            {STUDY_PLAN.map((row) => (
              <tr key={row.week}>
                <td>{row.week}</td>
                <td>{row.topics}</td>
                <td>{row.focus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <p className="hub-foot">
        Each topic hub has learning notes and interview Q&amp;A · JS snippets as cheatsheets ·
        Practice and Learn stay interactive
      </p>
    </div>
  );
}
