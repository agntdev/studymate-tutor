import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getStore } from "../store.js";

function noteMenuKeyboard() {
  return inlineKeyboard([
    [inlineButton("➕ Add note", "note:add")],
    [inlineButton("📋 List notes", "note:list")],
    [inlineButton("🗑 Delete note", "note:delete")],
    [inlineButton("⬅️ Back to menu", "menu:main")],
  ]);
}

function noteListKeyboard(notes: { topic: string }[]) {
  const rows = notes.map((n: { topic: string }) => [
    inlineButton(n.topic, `note:del:${n.topic}`),
  ]);
  rows.push([inlineButton("⬅️ Back", "note:menu")]);
  return inlineKeyboard(rows);
}

const composer = new Composer<Ctx>();

composer.command("note", async (ctx) => {
  ctx.session.step = undefined;
  await ctx.reply("📒 What would you like to do with your notes?", {
    reply_markup: noteMenuKeyboard(),
  });
});

composer.callbackQuery("note:list", async (ctx) => {
  await ctx.answerCallbackQuery();
  const store = getStore();
  const userId = ctx.from?.id;
  const notes = userId ? await store.getNotes(userId) : [];

  if (notes.length === 0) {
    await ctx.editMessageText(
      "No notes yet — tap ➕ Add to create one.",
      { reply_markup: noteMenuKeyboard() }
    );
    return;
  }

  const lines = notes.map(
    (n: { topic: string; content: string }, i: number) => `${i + 1}. ${n.topic} — ${n.content.slice(0, 50)}${n.content.length > 50 ? "…" : ""}`
  );
  await ctx.editMessageText(`📒 Your notes:\n\n${lines.join("\n")}`, {
    reply_markup: noteMenuKeyboard(),
  });
});

composer.callbackQuery("note:add", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.noteAction = "add";
  ctx.session.step = "note_topic";
  await ctx.editMessageText("What's the topic for this note?", {
    reply_markup: inlineKeyboard([
      [inlineButton("⬅️ Back", "note:menu")],
    ]),
  });
});

composer.callbackQuery("note:delete", async (ctx) => {
  await ctx.answerCallbackQuery();
  const store = getStore();
  const userId = ctx.from?.id;
  const notes = userId ? await store.getNotes(userId) : [];

  if (notes.length === 0) {
    await ctx.editMessageText(
      "No notes to delete — tap ➕ Add to create one first.",
      { reply_markup: noteMenuKeyboard() }
    );
    return;
  }

  ctx.session.noteAction = "delete";
  ctx.session.step = "note_delete_select";
  await ctx.editMessageText("Which note do you want to delete?", {
    reply_markup: noteListKeyboard(notes),
  });
});

composer.callbackQuery("note:menu", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = undefined;
  ctx.session.noteAction = undefined;
  await ctx.editMessageText("📒 What would you like to do with your notes?", {
    reply_markup: noteMenuKeyboard(),
  });
});

composer.callbackQuery(/^note:view:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const topic = ctx.match[1];
  const store = getStore();
  const userId = ctx.from?.id;
  const notes = userId ? await store.getNotes(userId) : [];
  const note = notes.find((n) => n.topic === topic);

  if (!note) {
    await ctx.editMessageText("Note not found.", {
      reply_markup: noteMenuKeyboard(),
    });
    return;
  }

  await ctx.editMessageText(`📒 ${note.topic}\n\n${note.content}`, {
    reply_markup: inlineKeyboard([
      [inlineButton("⬅️ Back to notes", "note:menu")],
    ]),
  });
});

composer.callbackQuery(/^note:del:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const topic = ctx.match[1];
  const store = getStore();
  const userId = ctx.from?.id;
  if (userId) {
    const deleted = await store.deleteNote(userId, topic);
    if (deleted) {
      await ctx.editMessageText(`🗑 Deleted note "${topic}".`, {
        reply_markup: noteMenuKeyboard(),
      });
    } else {
      await ctx.editMessageText("Note not found.", {
        reply_markup: noteMenuKeyboard(),
      });
    }
  }
  ctx.session.step = undefined;
  ctx.session.noteAction = undefined;
});

// Handle text input during note flow
composer.on("message:text", async (ctx, next) => {
  const step = ctx.session.step;

  if (step === "note_topic") {
    const topic = ctx.message.text.trim();
    if (topic.length < 1) {
      await ctx.reply("Please enter a topic name.", {
        reply_markup: inlineKeyboard([
          [inlineButton("⬅️ Back", "note:menu")],
        ]),
      });
      return;
    }
    ctx.session.noteTopic = topic;
    ctx.session.step = "note_content";
    await ctx.reply(`Got it. Now write your note on "${topic}":`, {
      reply_markup: inlineKeyboard([
        [inlineButton("⬅️ Back", "note:menu")],
      ]),
    });
    return;
  }

  if (step === "note_content") {
    const content = ctx.message.text.trim();
    if (content.length < 1) {
      await ctx.reply("Please write some content for your note.", {
        reply_markup: inlineKeyboard([
          [inlineButton("⬅️ Back", "note:menu")],
        ]),
      });
      return;
    }

    const store = getStore();
    const userId = ctx.from?.id;
    const topic = ctx.session.noteTopic!;

    if (userId) {
      await store.addNote(userId, {
        topic,
        content,
        timestamp: new Date().toISOString(),
      });
    }

    ctx.session.step = undefined;
    ctx.session.noteAction = undefined;
    ctx.session.noteTopic = undefined;
    ctx.session.noteContent = undefined;

    await ctx.reply(`✅ Note saved on "${topic}".`, {
      reply_markup: noteMenuKeyboard(),
    });
    return;
  }

  return next();
});

export default composer;
