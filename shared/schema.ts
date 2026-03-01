import { pgTable, serial, text, timestamp, numeric, varchar } from "drizzle-orm/pg-core";
import { sqliteTable, integer, text as sqliteText, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Determinar qual tipo de tabela usar baseado no ambiente
const isSqlite = process.env.DATABASE_URL?.startsWith('sqlite:') || !process.env.DATABASE_URL;

// Tabelas PostgreSQL
const pgTrips = pgTable("trips", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
  pickupLocation: text("pickup_location").notNull(),
  pickupLat: numeric("pickup_lat").notNull(),
  pickupLng: numeric("pickup_lng").notNull(),
  dropoffLocation: text("dropoff_location").notNull(),
  dropoffLat: numeric("dropoff_lat").notNull(),
  dropoffLng: numeric("dropoff_lng").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"), 
  pickupTime: timestamp("pickup_time").notNull(),
  price: numeric("price").notNull(),
  distanceKm: numeric("distance_km").notNull(),
  customerLanguage: varchar("customer_language", { length: 10 }).notNull().default("pt"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

const pgTripMessages = pgTable("trip_messages", {
  id: serial("id").primaryKey(),
  tripId: serial("trip_id").references(() => pgTrips.id).notNull(),
  sender: varchar("sender", { length: 50 }).notNull(), 
  contentOriginal: text("content_original").notNull(),
  contentTranslated: text("content_translated").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

const pgConversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

const pgMessages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: serial("conversation_id").references(() => pgConversations.id).notNull(),
  role: varchar("role", { length: 50 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tabelas SQLite
const sqliteTrips = sqliteTable("trips", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerName: sqliteText("customer_name").notNull(),
  customerPhone: sqliteText("customer_phone", { length: 20 }).notNull(),
  pickupLocation: sqliteText("pickup_location").notNull(),
  pickupLat: real("pickup_lat").notNull(),
  pickupLng: real("pickup_lng").notNull(),
  dropoffLocation: sqliteText("dropoff_location").notNull(),
  dropoffLat: real("dropoff_lat").notNull(),
  dropoffLng: real("dropoff_lng").notNull(),
  status: sqliteText("status", { length: 50 }).notNull().default("pending"), 
  pickupTime: integer("pickup_time").notNull(),
  price: real("price").notNull(),
  distanceKm: real("distance_km").notNull(),
  customerLanguage: sqliteText("customer_language", { length: 10 }).notNull().default("pt"),
  createdAt: integer("created_at").default(Date.now).notNull(),
});

const sqliteTripMessages = sqliteTable("trip_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tripId: integer("trip_id").references(() => sqliteTrips.id).notNull(),
  sender: sqliteText("sender", { length: 50 }).notNull(), 
  contentOriginal: sqliteText("content_original").notNull(),
  contentTranslated: sqliteText("content_translated").notNull(),
  createdAt: integer("created_at").default(Date.now).notNull(),
});

const sqliteConversations = sqliteTable("conversations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: sqliteText("title").notNull(),
  createdAt: integer("created_at").default(Date.now).notNull(),
});

const sqliteMessages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conversationId: integer("conversation_id").references(() => sqliteConversations.id).notNull(),
  role: sqliteText("role", { length: 50 }).notNull(),
  content: sqliteText("content").notNull(),
  createdAt: integer("created_at").default(Date.now).notNull(),
});

// Exportar tabelas baseadas no ambiente
export const trips = isSqlite ? sqliteTrips : pgTrips;
export const tripMessages = isSqlite ? sqliteTripMessages : pgTripMessages;
export const conversations = isSqlite ? sqliteConversations : pgConversations;
export const messages = isSqlite ? sqliteMessages : pgMessages;

export const tripsRelations = relations(trips, ({ many }) => ({
  messages: many(tripMessages),
}));

export const tripMessagesRelations = relations(tripMessages, ({ one }) => ({
  trip: one(trips, {
    fields: [tripMessages.tripId],
    references: [trips.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ many }) => ({
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const insertTripSchema = createInsertSchema(trips).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertTripMessageSchema = createInsertSchema(tripMessages).omit({
  id: true,
  createdAt: true,
  contentTranslated: true,
});

export type Trip = typeof trips.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type TripMessage = typeof tripMessages.$inferSelect;
export type InsertTripMessage = z.infer<typeof insertTripMessageSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
