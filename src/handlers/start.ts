import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { mainMenuKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { getStore } from "../store.js";

registerMainMenuItem({ label: "📝 Quiz", data: "quiz:create", order: 10 });
registerMainMenuItem({ label: "📒 Notes", data: "note:list", order: 20 });
registerMainMenuItem({ label: "⚙️ Settings", data: "settings:show", order: 30 });

const WELCOME = "👋 Welcome to StudyMate! Tap a button below to get started.";

const composer = new Composer<Ctx>();

composer.command("start", async (ctx) => {
  const store = getStore();
  const userId = ctx.from?.id;
  if (userId) {
    const existing = await store.getUser(userId);
    if (!existing) {
      await store.setUser({
        telegram_id: userId,
        default_difficulty: "medium",
        quiz_count: 5,
      });
    }
  }
  ctx.session.step = undefined;
  await ctx.reply(WELCOME, { reply_markup: mainMenuKeyboard() });
});

composer.callbackQuery("menu:main", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = undefined;
  await ctx.editMessageText(WELCOME, { reply_markup: mainMenuKeyboard() });
});

export default composer;
