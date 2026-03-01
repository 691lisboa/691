import { trips, tripMessages, type Trip, type InsertTrip, type TripMessage, type InsertTripMessage } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getTrip(id: number): Promise<Trip | undefined>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTripStatus(id: number, status: string): Promise<Trip>;
  getTripMessages(tripId: number): Promise<TripMessage[]>;
  createTripMessage(message: InsertTripMessage): Promise<TripMessage>;
}

export class DatabaseStorage implements IStorage {
  async getTrip(id: number): Promise<Trip | undefined> {
    const [trip] = await db.select().from(trips).where(eq(trips.id, id));
    return trip;
  }

  async createTrip(insertTrip: InsertTrip): Promise<Trip> {
    const [trip] = await db
      .insert(trips)
      .values({
        ...insertTrip,
        pickupLat: String(insertTrip.pickupLat),
        pickupLng: String(insertTrip.pickupLng),
        dropoffLat: String(insertTrip.dropoffLat),
        dropoffLng: String(insertTrip.dropoffLng),
        price: String(insertTrip.price),
        distanceKm: String(insertTrip.distanceKm),
        status: "pending"
      })
      .returning();
    return trip;
  }

  async updateTripStatus(id: number, status: string): Promise<Trip> {
    const [trip] = await db
      .update(trips)
      .set({ status })
      .where(eq(trips.id, id))
      .returning();
    return trip;
  }

  async getTripMessages(tripId: number): Promise<TripMessage[]> {
    return await db.select().from(tripMessages).where(eq(tripMessages.tripId, tripId)).orderBy(tripMessages.createdAt);
  }

  async createTripMessage(message: InsertTripMessage): Promise<TripMessage> {
    const [msg] = await db
      .insert(tripMessages)
      .values({
        ...message,
        contentTranslated: message.contentOriginal // Mock translation for now
      })
      .returning();
    return msg;
  }
}

export const storage = new DatabaseStorage();
