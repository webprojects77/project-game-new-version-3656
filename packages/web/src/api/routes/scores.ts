import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { base } from "../__core/app";
import { db } from "../database";
import * as schema from "../database/schema";

export const scores = {
  top: base.handler(() => db.select().from(schema.scores).orderBy(desc(schema.scores.score)).limit(20)),

  /**
   * Salva o resultado. Cada apelido tem UMA linha no ranking:
   * se o novo resultado for melhor, a linha é atualizada; se não, fica como está.
   */
  submit: base
    .input(
      z.object({
        player: z.string().trim().min(1).max(16),
        score: z.number().int().min(0).max(10_000_000),
        distance: z.number().int().min(0),
        coins: z.number().int().min(0),
        specials: z.number().int().min(0),
        skin: z.string().trim().min(1).max(24).default("classica"),
      }),
    )
    .handler(async ({ input }) => {
      const playerKey = input.player.trim().toLowerCase();
      const [existing] = await db
        .select()
        .from(schema.scores)
        .where(eq(schema.scores.playerKey, playerKey))
        .limit(1);

      if (!existing) {
        const [row] = await db
          .insert(schema.scores)
          .values({ ...input, playerKey })
          .returning();
        return { row, improved: true };
      }

      if (input.score <= existing.score) return { row: existing, improved: false };

      const [row] = await db
        .update(schema.scores)
        .set({
          player: input.player.trim(),
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
