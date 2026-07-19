import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getStore } from "../store.js";

const DIFFICULTIES = ["easy", "medium", "hard"];
const QUIZ_TOPICS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "History",
  "Literature",
  "Geography",
  "Computer Science",
];

function difficultyButtons() {
  return inlineKeyboard([
    DIFFICULTIES.map((d) =>
      inlineButton(d.charAt(0).toUpperCase() + d.slice(1), `quiz:diff:${d}`)
    ),
    [inlineButton("⬅️ Back to menu", "menu:main")],
  ]);
}

function countButtons() {
  return inlineKeyboard([
    [
      inlineButton("3 questions", "quiz:count:3"),
      inlineButton("5 questions", "quiz:count:5"),
      inlineButton("10 questions", "quiz:count:10"),
    ],
    [inlineButton("⬅️ Back to menu", "menu:main")],
  ]);
}

function generateQuiz(topic: string, difficulty: string, count: number): string {
  const questions: string[] = [];
  const templates: Record<string, string[]> = {
    easy: [
      `What is a fundamental concept in ${topic}?`,
      `Define a key term from ${topic}.`,
      `Name one principle of ${topic}.`,
      `What is the basic premise of ${topic}?`,
      `Identify a core element of ${topic}.`,
    ],
    medium: [
      `Explain how ${topic} applies to real-world scenarios.`,
      `Compare two concepts within ${topic}.`,
      `Describe the relationship between ideas in ${topic}.`,
      `Analyze a key theory in ${topic}.`,
      `Evaluate the importance of ${topic} in modern contexts.`,
    ],
    hard: [
      `Critically analyze an advanced concept in ${topic}.`,
      `Discuss the historical development of ${topic}.`,
      `Synthesize multiple theories within ${topic}.`,
      `Propose an original argument about ${topic}.`,
      `Evaluate opposing viewpoints in ${topic}.`,
    ],
  };

  const pool = templates[difficulty] ?? templates.medium;
  for (let i = 0; i < count; i++) {
    const q = pool[i % pool.length];
    questions.push(`Q${i + 1}: ${q}`);
  }

  return `📝 ${topic} Quiz (${difficulty})\n\n${questions.join("\n\n")}\n\n💡 Tap a question for a step-by-step solution.`;
}

function modelAnswers(topic: string, difficulty: string): string {
  return (
    `📋 Model Answers — ${topic} (${difficulty})\n\n` +
    `Each answer should demonstrate:\n` +
    `• Clear understanding of core concepts\n` +
    `• Step-by-step reasoning\n` +
    `• Real-world connections where applicable\n\n` +
    `Difficulty: ${difficulty}\n` +
    `Tip: Adjust depth based on student level.`
  );
}

const composer = new Composer<Ctx>();

composer.command("quiz", async (ctx) => {
  ctx.session.step = "quiz_topic";
  await ctx.reply("What topic do you want a quiz on?", {
    reply_markup: inlineKeyboard([
      QUIZ_TOPICS.map((t) => [inlineButton(t, `quiz:topic:${t}`)]).flat(),
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

composer.callbackQuery(/^quiz:topic:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const topic = ctx.match[1];
  ctx.session.quizTopic = topic;
  ctx.session.step = "quiz_diff";
  await ctx.editMessageText(`Great! Pick a difficulty for "${topic}":`, {
    reply_markup: difficultyButtons(),
  });
});

composer.callbackQuery(/^quiz:diff:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const difficulty = ctx.match[1];
  ctx.session.quizDifficulty = difficulty;
  ctx.session.step = "quiz_count";
  await ctx.editMessageText(
    `How many questions for ${ctx.session.quizTopic} (${difficulty})?`,
    { reply_markup: countButtons() }
  );
});

composer.callbackQuery(/^quiz:count:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const count = parseInt(ctx.match[1], 10);
  const topic = ctx.session.quizTopic!;
  const difficulty = ctx.session.quizDifficulty!;

  ctx.session.quizCount = count;
  ctx.session.step = undefined;

  const store = getStore();
  const userId = ctx.from?.id;
  if (userId) {
    await store.setQuiz(userId, { topic, difficulty, count });
    const user = await store.getUser(userId);
    if (user) {
      user.default_difficulty = difficulty;
      user.quiz_count = count;
      await store.setUser(user);
    }
  }

  const quiz = generateQuiz(topic, difficulty, count);
  await ctx.editMessageText(quiz, {
    reply_markup: inlineKeyboard([
      [
        inlineButton("📋 Model Answers", `quiz:answers:${difficulty}`),
        inlineButton("🔄 New Quiz", "quiz:create"),
      ],
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

composer.callbackQuery(/^quiz:answers:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const difficulty = ctx.match[1];
  const topic = ctx.session.quizTopic ?? "General";
  await ctx.editMessageText(modelAnswers(topic, difficulty), {
    reply_markup: inlineKeyboard([
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

export default composer;
