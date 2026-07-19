import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getStore } from "../store.js";

const composer = new Composer<Ctx>();

composer.callbackQuery("quiz:create", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = "quiz_topic";
  await ctx.editMessageText("What topic do you want a quiz on?", {
    reply_markup: inlineKeyboard([
      [
        inlineButton("Mathematics", "quiz:topic:Mathematics"),
        inlineButton("Physics", "quiz:topic:Physics"),
        inlineButton("Chemistry", "quiz:topic:Chemistry"),
        inlineButton("Biology", "quiz:topic:Biology"),
      ],
      [
        inlineButton("History", "quiz:topic:History"),
        inlineButton("Literature", "quiz:topic:Literature"),
        inlineButton("Geography", "quiz:topic:Geography"),
        inlineButton("Computer Science", "quiz:topic:Computer Science"),
      ],
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

export default composer;
