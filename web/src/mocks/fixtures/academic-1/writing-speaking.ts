import type { Part, Section } from "@/api/schemas";

/*
 * Academic mock 1: Writing and Speaking.
 * Original dummy content written for the prototype. Not taken from any published IELTS material.
 */

/* ------------------------------------------------------------------ */
/*  Writing                                                            */
/* ------------------------------------------------------------------ */

/** Task 1 figure. Drawn by the frontend as a grouped bar chart. */
export const task1Chart = {
  id: "w1-chart",
  kind: "bar" as "bar" | "line",
  title: "Average weekly hours spent on leisure activities by people aged 16–24 in one country",
  unit: "hours per week",
  categories: ["Watching TV", "Social media", "Sport and exercise", "Reading for pleasure", "Video games"],
  series: [
    { name: "2005", values: [14, 2, 5, 4, 3] },
    { name: "2015", values: [10, 9, 6, 3, 6] },
    { name: "2025", values: [6, 15, 5, 2, 8] },
  ],
};

const p1: Part = {
  id: "a1-w-p1",
  number: 1,
  rubric: "You should spend about 20 minutes on this task. Write at least 150 words.",
  groups: [],
  writing: {
    task: 1,
    minutes: 20,
    minWords: 150,
    figure: "w1-chart",
    prompt: [
      "The chart below shows the average number of hours per week that people aged 16 to 24 in one country spent on five leisure activities in 2005, 2015 and 2025.",
      "**Summarise the information by selecting and reporting the main features, and make comparisons where relevant.**",
    ],
  },
};

const p2: Part = {
  id: "a1-w-p2",
  number: 2,
  rubric: "You should spend about 40 minutes on this task. Write at least 250 words.",
  groups: [],
  writing: {
    task: 2,
    minutes: 40,
    minWords: 250,
    prompt: [
      "Write about the following topic:",
      "**In many countries, more young adults now live with their parents until their late twenties or thirties. Some people believe this benefits the whole family, while others think it holds young people back from becoming independent. Discuss both views and give your own opinion.**",
      "Give reasons for your answer and include any relevant examples from your own knowledge or experience.",
    ],
  },
};

export const writingSection: Section = {
  id: "a1-writing",
  skill: "writing",
  title: "Academic Writing",
  durationSec: 3600,
  parts: [p1, p2],
};

/* ------------------------------------------------------------------ */
/*  Speaking                                                           */
/* ------------------------------------------------------------------ */

export const speakingVoice = "bm_daniel";

const audio = (id: string) => `/audio/academic-1/speaking-${id}.m4a`;
const q = (id: string, text: string) => ({ id, text, audio: audio(id) });

const s1: Part = {
  id: "a1-s-p1",
  number: 1,
  rubric: "Part 1: Introduction and interview",
  groups: [],
  speaking: {
    part: 1,
    intro: q(
      "a1-s-intro",
      "Good morning. My name is Daniel and I'm your examiner today. Can you tell me your full name, please?",
    ),
    questions: [
      q("a1-s-p1-q1", "Let's talk about mornings. Would you say you are a morning person?"),
      q("a1-s-p1-q2", "What do you usually do in the first hour after you wake up?"),
      q("a1-s-p1-q3", "Is your morning routine different now from when you were a child?"),
      q("a1-s-p1-q4", "Do you think breakfast is an important meal? Why or why not?"),
      q("a1-s-p1-q5", "Now let's talk about photographs. How often do you take photos?"),
      q("a1-s-p1-q6", "What kinds of things do you like to take photos of?"),
      q("a1-s-p1-q7", "Do you prefer printed photos or photos you keep on your phone?"),
      q("a1-s-p1-q8", "Is there a photo in your home that is special to you?"),
    ],
    maxAnswerSec: 35,
  },
};

const s2: Part = {
  id: "a1-s-p2",
  number: 2,
  rubric: "Part 2: Individual long turn",
  groups: [],
  speaking: {
    part: 2,
    intro: q(
      "a1-s-p2-intro",
      "Now I'm going to give you a topic and I'd like you to talk about it for one to two minutes. Before you talk, you'll have one minute to think about what you're going to say. You can make some notes if you wish.",
    ),
    cueCard: {
      topic: "Describe a practical skill you learned from an older member of your family.",
      bullets: ["what the skill is", "who taught it to you", "how you learned it"],
      final: "and explain why this skill is still useful to you.",
    },
    prepSec: 60,
    talkSec: 120,
    questions: [q("a1-s-p2-q1", "Have you ever taught this skill to anyone else?")],
    maxAnswerSec: 120,
  },
};

const s3: Part = {
  id: "a1-s-p3",
  number: 3,
  rubric: "Part 3: Two-way discussion",
  groups: [],
  speaking: {
    part: 3,
    intro: q(
      "a1-s-p3-intro",
      "We've been talking about a skill you learned from a family member, and I'd like to discuss with you one or two more general questions related to this.",
    ),
    questions: [
      q("a1-s-p3-q1", "What kinds of skills do grandparents usually pass on to children in your country?"),
      q("a1-s-p3-q2", "Do you think young people today are less interested in learning from older generations? Why?"),
      q("a1-s-p3-q3", "Some people say that practical skills, like cooking or repairing things, are disappearing. Do you agree?"),
      q("a1-s-p3-q4", "Should schools spend more time teaching practical life skills? Which ones?"),
      q("a1-s-p3-q5", "How has technology changed the way people learn new skills?"),
      q("a1-s-p3-q6", "Is it better to learn a skill from a person or from online videos? Why?"),
    ],
    maxAnswerSec: 60,
  },
};

export const speakingSection: Section = {
  id: "a1-speaking",
  skill: "speaking",
  title: "Speaking",
  durationSec: 840,
  parts: [s1, s2, s3],
};
