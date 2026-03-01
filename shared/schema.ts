import { pgTable, text, serial, timestamp, numeric, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const trips = pgTable("trips", {
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

export const tripMessages = pgTable("trip_messages", {
  id: serial("id").primaryKey(),
  tripId: serial("trip_id").references(() => trips.id).notNull(),
  sender: varchar("sender", { length: 50 }).notNull(), 
  contentOriginal: text("content_original").notNull(),
  contentTranslated: text("content_translated").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: serial("conversation_id").references(() => conversations.id).notNull(),
  role: varchar("role", { length: 50 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
