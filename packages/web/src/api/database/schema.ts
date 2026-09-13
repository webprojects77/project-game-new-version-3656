import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";

/**
 * Ranking global do Luiza Run Surfs.
 * Uma linha por jogador (apelido) — guardamos apenas o melhor resultado dele.
 * `playerKey` é o apelido normalizado (minúsculas) e é único.
 */
export const scores = sqliteTable(
  "scores",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    playerKey: text("player_key").notNull(),
    player: text("player").notNull(),
    score: integer("score").notNull(),
    distance: integer("distance").notNull(),
    coins: integer("coins").notNull().default(0),
    /** itens especiais (moldura polaroid) coletados na corrida */
    specials: integer("specials").notNull().default(0),
    /** skin 3D usada na corrida do recorde */
    skin: text("skin").notNull().default("classica"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [uniqueIndex("scores_player_key_idx").on(table.playerKey)],
);
