import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getStore } from "../store.js";

function settingsKeyboard() {
  return inlineKeyboard([
    [inlineButton("📊 Default difficulty", "settings:difficulty")],
    [inlineButton("🔢 Quiz question count", "settings:quiz_count")],
    [inlineButton("⬅️ Back to menu", "menu:main")],
  ]);
}

const composer = new Composer<Ctx>();

composer.callbackQuery("settings:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  const store = getStore();
  const userId = ctx.from?.id;
  const user = userId ? await store.getUser(userId) : null;
  const difficulty = user?.default_difficulty ?? "medium";
  const count = user?.quiz_count ?? 5;

  await ctx.editMessageText(
    `⚙️ Your settings\n\n` +
      `📊 Default difficulty: ${difficulty}\n` +
      `🔢 Quiz questions: ${count}\n\n` +
      `Tap a setting to change it.`,
    { reply_markup: settingsKeyboard() }
  );
});

composer.callbackQuery("settings:difficulty", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText("Pick your default difficulty:", {
    reply_markup: inlineKeyboard([
      [
        inlineButton("Easy", "settings:set_diff:easy"),
        inlineButton("Medium", "settings:set_diff:medium"),
        inlineButton("Hard", "settings:set_diff:hard"),
      ],
      [inlineButton("⬅️ Back", "settings:show")],
    ]),
  });
});

composer.callbackQuery(/^settings:set_diff:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const difficulty = ctx.match[1];
  const store = getStore();
  const userId = ctx.from?.id;
  if (userId) {
    const user = await store.getUser(userId);
    if (user) {
      user.default_difficulty = difficulty;
      await store.setUser(user);
    } else {
      await store.setUser({
        telegram_id: userId,
        default_difficulty: difficulty,
        quiz_count: 5,
      });
    }
  }
  await ctx.editMessageText(`✅ Default difficulty set to ${difficulty}.`, {
    reply_markup: inlineKeyboard([
      [inlineButton("⬅️ Back to settings", "settings:show")],
    ]),
  });
});

composer.callbackQuery("settings:quiz_count", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText("How many questions by default?", {
    reply_markup: inlineKeyboard([
      [
        inlineButton("3", "settings:set_count:3"),
        inlineButton("5", "settings:set_count:5"),
        inlineButton("10", "settings:set_count:10"),
      ],
      [inlineButton("⬅️ Back", "settings:show")],
    ]),
  });
});

composer.callbackQuery(/^settings:set_count:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const count = parseInt(ctx.match[1], 10);
  const store = getStore();
  const userId = ctx.from?.id;
  if (userId) {
    const user = await store.getUser(userId);
    if (user) {
      user.quiz_count = count;
      await store.setUser(user);
    } else {
      await store.setUser({
        telegram_id: userId,
        default_difficulty: "medium",
        quiz_count: count,
      });
    }
  }
  await ctx.editMessageText(`✅ Default quiz count set to ${count} questions.`, {
    reply_markup: inlineKeyboard([
      [inlineButton("⬅️ Back to settings", "settings:show")],
    ]),
  });
});

export default composer;
