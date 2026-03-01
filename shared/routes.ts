import { z } from 'zod';
import { insertTripSchema, trips, tripMessages, insertTripMessageSchema } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  trips: {
    create: {
      method: 'POST' as const,
      path: '/api/trips' as const,
      input: insertTripSchema.extend({
        customerName: z.string().min(1),
        customerPhone: z.string().min(1),
        pickupLat: z.coerce.number(),
        pickupLng: z.coerce.number(),
        dropoffLat: z.coerce.number(),
        dropoffLng: z.coerce.number(),
        price: z.coerce.number(),
        distanceKm: z.coerce.number(),
        pickupTime: z.coerce.date(),
      }),
      responses: {
        201: z.custom<typeof trips.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/trips/:id' as const,
      responses: {
        200: z.custom<typeof trips.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/trips/:id/status' as const,
      input: z.object({
        status: z.enum(["pending", "confirmed", "arrived", "in_progress", "completed", "cancelled"]),
      }),
      responses: {
        200: z.custom<typeof trips.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    cancel: {
      method: 'POST' as const,
      path: '/api/trips/:id/cancel' as const,
      responses: {
        200: z.custom<typeof trips.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  chat: {
    list: {
      method: 'GET' as const,
      path: '/api/trips/:tripId/messages' as const,
      responses: {
        200: z.array(z.custom<typeof tripMessages.$inferSelect>()),
        404: errorSchemas.notFound,
      },
    },
    send: {
      method: 'POST' as const,
      path: '/api/trips/:tripId/messages' as const,
      input: z.object({
        sender: z.enum(["customer", "driver"]),
        contentOriginal: z.string(),
      }),
      responses: {
        201: z.custom<typeof tripMessages.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  telegram: {
    webhook: {
      method: 'POST' as const,
      path: '/api/telegram/webhook' as const,
      responses: {
        200: z.object({ success: z.boolean() }),
      }
    }
  },
  tomtom: {
    geocode: {
      method: 'GET' as const,
      path: '/api/tomtom/geocode' as const,
      input: z.object({
        lat: z.coerce.number(),
        lng: z.coerce.number(),
      }),
      responses: {
        200: z.object({ address: z.string() }),
        400: errorSchemas.validation,
      }
    },
    route: {
      method: 'GET' as const,
      path: '/api/tomtom/route' as const,
      input: z.object({
        startLat: z.coerce.number(),
        startLng: z.coerce.number(),
        endLat: z.coerce.number(),
        endLng: z.coerce.number(),
      }),
      responses: {
        200: z.object({
          distanceKm: z.number(),
          durationMin: z.number(),
          price: z.number()
        }),
        400: errorSchemas.validation,
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
