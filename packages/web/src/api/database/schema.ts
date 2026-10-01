import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";

export * from "./auth-schema";

/**
 * Ranking global do Luiza Run Surfs.
 * Uma linha por conta Google — guardamos apenas o melhor resultado dela.
 * `playerKey` é o id da conta Google (vindo do login), então ninguém consegue
 * roubar o lugar de outro no placar só escrevendo o mesmo apelido.
 */
export const scores = sqliteTable(
  "scores",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    /** id do usuário logado — uma linha por conta */
    playerKey: text("player_key").notNull(),
    player: text("player").notNull(),
    /** foto da conta Google, para aparecer no placar */
    avatar: text("avatar"),
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
