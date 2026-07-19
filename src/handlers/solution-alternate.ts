import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

const ALTERNATIVES: Record<string, string> = {
  algebra:
    "🔢 Algebraic approach: Start by isolating the variable. Move all terms with the variable to one side and constants to the other. Then divide to solve.",
  geometry:
    "📐 Geometric approach: Visualize the problem on a coordinate plane. Use distance formulas, area calculations, or symmetry to find the solution.",
  calculus:
    "📊 Calculus approach: Apply differentiation or integration rules. Check if L'Hôpital's rule or substitution simplifies the expression.",
  physics:
    "⚡ Physics approach: Draw a free-body diagram. Identify all forces, apply Newton's laws, and solve the resulting equations.",
  chemistry:
    "🧪 Chemistry approach: Balance the equation first. Identify the reaction type (synthesis, decomposition, single/double replacement) and predict products.",
  default:
    "💡 Alternative approach: Break the problem into smaller parts. Identify what's given, what's needed, and work backwards from the goal. Try a different representation (diagram, table, or equation).",
};

const composer = new Composer<Ctx>();

composer.callbackQuery("solution:alternate", async (ctx) => {
  await ctx.answerCallbackQuery();
  const lastSolution = ctx.session.lastSolution ?? "";
  const key = Object.keys(ALTERNATIVES).find((k) =>
    lastSolution.toLowerCase().includes(k)
  );
  const method = ALTERNATIVES[key ?? "default"];

  await ctx.editMessageText(
    `🔄 Here's another way to look at it:\n\n${method}`,
    {
      reply_markup: inlineKeyboard([
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    }
  );
});

export default composer;
