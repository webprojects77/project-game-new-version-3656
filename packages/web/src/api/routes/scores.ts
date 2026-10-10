import { desc, eq } from "drizzle-orm";
import { base } from "../__core/app";
import { authed } from "../middleware/auth";
import { db } from "../database";
import * as schema from "../database/schema";
import { nomeNoPlacar, resultadoSchema } from "../rules/score";

export const scores = {
  /** o placar é público: qualquer um vê, mesmo sem estar logado */
  top: base.handler(async () => {
    const rows = await db.select().from(schema.scores).orderBy(desc(schema.scores.score)).limit(20);
    return rows.map((row) => ({ ...row, displayName: nomeNoPlacar(row.player, row.id) }));
  }),

  /**
   * Salva o resultado no placar. Só funciona com conta Google logada:
   * a linha é amarrada ao id da conta, uma por pessoa, e guarda o melhor resultado.
   */
  submit: authed
    .input(resultadoSchema)
    .handler(async ({ input, context }) => {
      const playerKey = context.user.id;
      // Não publica e-mail caso a conta Google não tenha nome de exibição.
      const player = (context.user.name || "Jogadora").trim().slice(0, 24);
      const avatar = context.user.image ?? null;

      const [existing] = await db
        .select()
        .from(schema.scores)
        .where(eq(schema.scores.playerKey, playerKey))
        .limit(1);

      if (!existing) {
        const [row] = await db
          .insert(schema.scores)
          .values({ ...input, playerKey, player, avatar })
          .returning();
        return { row, improved: true };
      }

      if (input.score <= existing.score) {
        // mesmo sem recorde novo, mantemos nome e foto atualizados
        const [row] = await db
          .update(schema.scores)
          .set({ player, avatar, updatedAt: new Date() })
          .where(eq(schema.scores.id, existing.id))
          .returning();
        return { row, improved: false };
      }

      const [row] = await db
        .update(schema.scores)
        .set({
          player,
          avatar,
          score: input.score,
          distance: input.distance,
          coins: input.coins,
          specials: input.specials,
          skin: input.skin,
          updatedAt: new Date(),
        })
        .where(eq(schema.scores.id, existing.id))
        .returning();
      return { row, improved: true };
    }),
};
