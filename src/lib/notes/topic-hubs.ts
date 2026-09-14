import { LEARNING_TOPICS } from "./learning-topics";
import { getTopic } from "./topics";
import type { TopicHubMeta, TopicHubResource } from "./types";

const EXTRA_RESOURCES: Record<string, TopicHubResource[]> = {
  react: [
    {
      id: "evolution",
      title: "React Evolution",
      description: "React 16 → 19.3: Fiber, concurrent rendering, Actions, migrations, and recent APIs.",
      href: "/notes/learn/react/evolution",
    },
  ],
  nextjs: [
    {
      id: "next-demos",
      title: "Live rendering demos",
      description: "CSR, SSR, SSG, ISR, PPR, streaming, and metadata demos.",
      href: "/learn",
    },
  ],
  redux: [
    {
      id: "redux-playground",
      title: "Redux playground",
      description: "Six isolated RTK examples from counter to RTK Query.",
      href: "/learn/redux",
    },
  ],
};

function resourcesFor(
  id: string,
  learningDescription: string,
  interviewDescription: string,
): TopicHubResource[] {
  return [
    {
      id: "learning",
      title: "Learning Notes",
      description: learningDescription,
      href: `/notes/learn/${id}`,
    },
    {
      id: "interview",
      title: "Interview Prep",
      description: interviewDescription,
      href: `/notes/${id}`,
    },
    ...(EXTRA_RESOURCES[id] ?? []),
  ];
}

export const TOPIC_HUBS: TopicHubMeta[] = LEARNING_TOPICS.flatMap((learning) => {
  const interview = getTopic(learning.id);
  if (!interview || interview.category === "company") return [];
  return [
    {
      id: learning.id,
      title: learning.title,
      href: `/notes/hubs/${learning.id}`,
      description: `${learning.title} learning notes and interview prep.`,
      excludeFromInterview: true,
      excludeFromLearning: true,
      resources: resourcesFor(learning.id, learning.description, interview.description),
    },
  ];
});

export function getTopicHub(id: string): TopicHubMeta | undefined {
  return TOPIC_HUBS.find((hub) => hub.id === id);
}

export function isExcludedFromInterview(topicId: string) {
  return TOPIC_HUBS.some((hub) => hub.id === topicId && hub.excludeFromInterview);
}

export function isExcludedFromLearning(topicId: string) {
  return TOPIC_HUBS.some((hub) => hub.id === topicId && hub.excludeFromLearning);
}
