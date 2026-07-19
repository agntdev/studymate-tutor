import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

function generateSolution(question: string): string {
  const q = question.toLowerCase();
  let solution = "";
  let topic = "";

  if (q.match(/\b(add|sum|plus|total|addition)\b/)) {
    topic = "Addition";
    solution =
      "Step 1: Identify the numbers to add.\n" +
      "Step 2: Align the numbers by place value.\n" +
      "Step 3: Add each column from right to left.\n" +
      "Step 4: Carry over if a column sum exceeds 9.\n\n" +
      "📝 Teaching note: Remind students that addition is commutative — the order doesn't matter.";
  } else if (q.match(/\b(subtract|minus|difference|less)\b/)) {
    topic = "Subtraction";
    solution =
      "Step 1: Identify the minuend and subtrahend.\n" +
      "Step 2: Align by place value.\n" +
      "Step 3: Subtract each column, borrowing if needed.\n" +
      "Step 4: Check your answer by adding.\n\n" +
      "📝 Teaching note: Common mistake — forgetting to borrow from the next column.";
  } else if (q.match(/\b(multiply|times|product|multiplication)\b/)) {
    topic = "Multiplication";
    solution =
      "Step 1: Write the numbers vertically.\n" +
      "Step 2: Multiply the bottom number by each digit of the top number.\n" +
      "Step 3: Shift one place left for each new row.\n" +
      "Step 4: Add all partial products.\n\n" +
      "📝 Teaching note: Use the distributive property to break down complex multiplications.";
  } else if (q.match(/\b(divide|division|quotient|remainder)\b/)) {
    topic = "Division";
    solution =
      "Step 1: Set up the long division format.\n" +
      "Step 2: Divide the first digits of the dividend by the divisor.\n" +
      "Step 3: Multiply and subtract.\n" +
      "Step 4: Bring down the next digit and repeat.\n\n" +
      "📝 Teaching note: Check division by multiplying the quotient by the divisor.";
  } else if (q.match(/\b(area|perimeter|circle|triangle|square|rectangle)\b/)) {
    topic = "Geometry";
    solution =
      "Step 1: Identify the shape and what's being asked.\n" +
      "Step 2: Write the appropriate formula.\n" +
      "Step 3: Substitute the given values.\n" +
      "Step 4: Calculate and include units.\n\n" +
      "📝 Teaching note: Always label your answer with the correct units (cm², m², etc.).";
  } else if (q.match(/\b(equation|solve|variable|x|y)\b/)) {
    topic = "Algebra";
    solution =
      "Step 1: Identify the variable and what you're solving for.\n" +
      "Step 2: Isolate the variable using inverse operations.\n" +
      "Step 3: Perform the same operation on both sides.\n" +
      "Step 4: Verify by substituting back into the original equation.\n\n" +
      "📝 Teaching note: Always check your answer — plug it back in to verify.";
  } else if (q.match(/\b(essay|write|paragraph|analyze|discuss)\b/)) {
    topic = "Writing";
    solution =
      "Step 1: Read the prompt carefully and identify key requirements.\n" +
      "Step 2: Brainstorm main ideas and supporting evidence.\n" +
      "Step 3: Create an outline with intro, body, and conclusion.\n" +
      "Step 4: Write a strong thesis statement.\n" +
      "Step 5: Draft, revise, and proofread.\n\n" +
      "📝 Teaching note: Strong essays start with a clear thesis and end with a memorable conclusion.";
  } else {
    topic = "General";
    solution =
      "Step 1: Read the question carefully — identify what's being asked.\n" +
      "Step 2: List what you know and what you need to find.\n" +
      "Step 3: Choose a strategy (draw a diagram, make a table, write an equation).\n" +
      "Step 4: Work through the problem step by step.\n" +
      "Step 5: Check your answer — does it make sense?\n\n" +
      "📝 Teaching note: Encourage students to explain their reasoning at each step.";
  }

  return `📚 Solution — ${topic}\n\n${solution}`;
}

const composer = new Composer<Ctx>();

composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step) return next();

  const text = ctx.message.text.trim();
  if (text.startsWith("/")) return next();

  const solution = generateSolution(text);
  ctx.session.lastSolution = text;

  await ctx.reply(solution, {
    reply_markup: inlineKeyboard([
      [
        inlineButton("🔄 Alternative method", "solution:alternate"),
        inlineButton("📝 Make quiz", "quiz:create"),
      ],
      [inlineButton("📒 Save as note", "note:add")],
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

export default composer;
