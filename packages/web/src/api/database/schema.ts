import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";

export * from "./auth-schema";

export const scores = sqliteTable(
  "scores",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    playerKey: text("player_key").notNull(),
    player: text("player").notNull(),
    avatar: text("avatar"),
    score: integer("score").notNull(),
    distance: integer("distance").notNull(),
    coins: integer("coins").notNull().default(0),
    specials: integer("specials").notNull().default(0),
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
