import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import routingService from "./services/routing";

// Attempt to import OpenAI integration, fallback to mock if not available
let openai: any;
try {
  const mod = require("./replit_integrations/audio");
  openai = mod.openai;
} catch (e) {
  console.warn("OpenAI integration not found, chat translation will be mocked.");
}

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

async function sendTelegramMessage(text: string) {
  if (!TELEGRAM_TOKEN || !CHAT_ID) {
    console.warn("Telegram credentials missing (TELEGRAM_TOKEN or CHAT_ID)");
    return;
  }
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: 'MarkdownV2'
      })
    });
    if (!res.ok) {
      const errData = await res.json();
      console.error("Telegram API error:", errData);
    }
  } catch (err) {
    console.error("Telegram network error:", err);
  }
}

function escapeMarkdown(text: string) {
  if (!text) return "";
  // Standard MarkdownV2 escaping
  return text.toString().replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Trip creation
  app.post(api.trips.create.path, async (req, res) => {
    try {
      const input = api.trips.create.input.parse(req.body);
      const trip = await storage.createTrip(input);
      
      const msg = `🚕 *Nova Reserva #TRIP${trip.id}*\n\n` +
        `👤 *Cliente:* ${escapeMarkdown(trip.customerName)}\n` +
        `📞 *Telemóvel:* ${escapeMarkdown(trip.customerPhone)}\n` +
        `📍 *Recolha:* ${escapeMarkdown(trip.pickupLocation)}\n` +
        `🏁 *Destino:* ${escapeMarkdown(trip.dropoffLocation)}\n` +
        `⏰ *Hora:* ${escapeMarkdown(new Date(trip.pickupTime).toLocaleString('pt-PT'))}\n` +
        `💰 *Preço:* ${escapeMarkdown(trip.price.toString())}€`;
      
      await sendTelegramMessage(msg);
      res.status(201).json(trip);
    } catch (err: any) {
      console.error("Create trip error:", err);
      res.status(400).json({ message: err.message || "Internal Error" });
    }
  });

  // Get Trip
  app.get(api.trips.get.path, async (req, res) => {
    const trip = await storage.getTrip(Number(req.params.id));
    if (!trip) return res.status(404).json({ message: "Trip not found" });
    res.json(trip);
  });

  // TomTom Autocomplete Proxy
  app.get("/api/tomtom/autocomplete", async (req, res) => {
    try {
      const query = String(req.query.q || "").trim();
      if (query.length < 2) return res.json({ results: [] });
      
      const TOMTOM_KEY = process.env.TOMTOM_KEY;
      if (!TOMTOM_KEY) {
        console.warn("TOMTOM_KEY missing, using mocks for development");
        const mocks = [
          { address: "Aeroporto de Lisboa (LIS)", lat: 38.7742, lng: -9.1342 },
          { address: "Cais do Sodré, Lisboa", lat: 38.7061, lng: -9.1444 },
          { address: "Estação do Oriente, Lisboa", lat: 38.7678, lng: -9.0991 },
          { address: "Belém, Lisboa", lat: 38.6916, lng: -9.2158 },
          { address: "Rossio, Lisboa", lat: 38.7139, lng: -9.1394 }
        ].filter(r => r.address.toLowerCase().includes(query.toLowerCase()));
        return res.json({ results: mocks });
      }

      const url = `https://api.tomtom.com/search/2/search/${encodeURIComponent(query)}.json?key=${TOMTOM_KEY}&countrySet=PT&limit=10&idxSet=PAD,Str,XStr,POI`;
      const ttRes = await fetch(url);
      if (!ttRes.ok) throw new Error(`TomTom API responded with ${ttRes.status}`);
      
      const data = await ttRes.json();
      const results = (data.results || []).map((r: any) => ({
        address: r.address.freeformAddress,
        lat: r.position.lat,
        lng: r.position.lon
      }));
      
      res.json({ results });
    } catch (err) {
      console.error("Autocomplete Proxy Error:", err);
      res.status(500).json({ message: "Search failed" });
    }
  });

  // TomTom Mock Route (Price calculation)
  app.get(api.tomtom.route.path, async (req, res) => {
    try {
      const input = api.tomtom.route.input.parse(req.query);
      
      // Approximation: 1 degree latitude is approx 111km
      const dx = input.endLng - input.startLng;
      const dy = input.endLat - input.startLat;
      const distanceKm = Math.sqrt(dx*dx + dy*dy) * 111;
      
      const durationMin = Math.round(distanceKm * 2);
      
      // Lisbon 2026 Taxi Rates
      // Base: 3.50€ | Per km: 0.95€ | Minimum: 4.00€
      const price = Math.max(4.00, 3.50 + (distanceKm * 0.95));
      
      res.json({
        distanceKm: Number(distanceKm.toFixed(2)),
        durationMin,
        price: Number(price.toFixed(2))
      });
    } catch (err) {
      res.status(400).json({ message: "Invalid parameters" });
    }
  });

  // TomTom Geocode
  app.get(api.tomtom.geocode.path, async (req, res) => {
    try {
      const input = api.tomtom.geocode.input.parse(req.query);
      const TOMTOM_KEY = process.env.TOMTOM_KEY;
      if (!TOMTOM_KEY) {
        return res.json({ address: `${input.lat.toFixed(4)}, ${input.lng.toFixed(4)}` });
      }
      
      const url = `https://api.tomtom.com/search/2/reverseGeocode/${input.lat},${input.lng}.json?key=${TOMTOM_KEY}`;
      const ttRes = await fetch(url);
      const data = await ttRes.json();
      const address = data.addresses?.[0]?.address?.freeformAddress || `${input.lat.toFixed(4)}, ${input.lng.toFixed(4)}`;
      
      res.json({ address });
    } catch (err) {
      res.status(400).json({ message: "Invalid coordinates" });
    }
  });

  // Routing API - Calculate price and route
  app.post("/api/routing/calculate", async (req, res) => {
    try {
      const { pickup, dropoff } = req.body;
      
      if (!pickup || !dropoff) {
        return res.status(400).json({ message: "Pickup and dropoff locations are required" });
      }

      const routeData = await routingService.calculateRoute({ pickup, dropoff });
      
      res.json({
        distance: routeData.distance,
        duration: routeData.duration,
        price: routeData.price,
        coordinates: routeData.coordinates
      });
    } catch (err: any) {
      console.error("Routing calculation error:", err);
      res.status(500).json({ message: err.message || "Failed to calculate route" });
    }
  });

  // Routing API - Address suggestions
  app.get("/api/routing/suggestions", async (req, res) => {
    try {
      const query = String(req.query.q || "").trim();
      
      if (query.length < 2) {
        return res.json([]);
      }

      const suggestions = await routingService.getAddressSuggestions(query);
      res.json(suggestions);
    } catch (err: any) {
      console.error("Address suggestions error:", err);
      res.status(500).json({ message: "Failed to get suggestions" });
    }
  });

  return httpServer;
}
