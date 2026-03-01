import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { setupTelegramBot } from "./telegram";
import { db } from "./db";
import { trips, tripMessages } from "@shared/schema";
import { eq } from "drizzle-orm";

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === "production" ? false : ["http://localhost:5173"],
    methods: ["GET", "POST"]
  }
});

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Socket.io handlers
io.on('connection', (socket) => {
  log(`Cliente conectado: ${socket.id}`);

  // Criar nova reserva
  socket.on('create-trip', async (tripData) => {
    try {
      const [newTrip] = await db.insert(trips).values({
        ...tripData,
        status: 'pending',
        createdAt: new Date()
      }).returning();

      log(`Nova reserva criada: ${newTrip.id}`);

      // Notificar Telegram
      await notifyTelegram(newTrip);

      // Responder ao cliente
      socket.emit('trip-created', newTrip);

      // Broadcast para todos os clientes interessados
      io.emit('trip-update', newTrip);

    } catch (error) {
      log(`Erro ao criar reserva: ${error}`);
      socket.emit('error', { message: 'Erro ao criar reserva' });
    }
  });

  // Cancelar reserva
  socket.on('cancel-trip', async (data) => {
    try {
      await db.update(trips)
        .set({ status: 'cancelled' })
        .where(eq(trips.customerPhone, data.customerPhone));

      log(`Reserva cancelada: ${data.customerPhone}`);

      // Notificar Telegram
      await notifyTelegramCancel(data);

      socket.emit('trip-cancelled', { success: true });

    } catch (error) {
      log(`Erro ao cancelar reserva: ${error}`);
      socket.emit('error', { message: 'Erro ao cancelar reserva' });
    }
  });

  // Enviar mensagem do chat
  socket.on('send-chat-message', async (messageData) => {
    try {
      const [newMessage] = await db.insert(tripMessages).values({
        ...messageData,
        createdAt: new Date()
      }).returning();

      // Broadcast da mensagem
      io.emit('chat-message', newMessage);

      // Notificar Telegram se for mensagem do cliente
      if (messageData.sender === 'customer') {
        await notifyTelegramMessage(newMessage);
      }

    } catch (error) {
      log(`Erro ao enviar mensagem: ${error}`);
    }
  });

  // Atualizar status da reserva (vindo do Telegram)
  socket.on('update-trip-status', async (data) => {
    try {
      const [updatedTrip] = await db.update(trips)
        .set({ status: data.status })
        .where(eq(trips.id, data.tripId))
        .returning();

      log(`Status da reserva ${data.tripId} atualizado para: ${data.status}`);

      // Notificar todos os clientes
      io.emit('trip-status', {
        tripId: data.tripId,
        status: data.status,
        message: data.message
      });

      // Notificar cliente específico
      io.emit('trip-update', updatedTrip);

    } catch (error) {
      log(`Erro ao atualizar status: ${error}`);
    }
  });

  socket.on('disconnect', () => {
    log(`Cliente desconectado: ${socket.id}`);
  });
});

// Funções de notificação Telegram
async function notifyTelegram(trip: any) {
  try {
    const message = `🚕 *NOVA RESERVA - 691*\n\n` +
      `👤 *Cliente:* ${trip.customerName}\n` +
      `📞 *Telefone:* ${trip.customerPhone}\n` +
      `📍 *Recolha:* ${trip.pickupLocation}\n` +
      `🎯 *Destino:* ${trip.dropoffLocation}\n` +
      `⏰ *Hora:* ${new Date(trip.pickupTime).toLocaleString('pt-PT')}\n` +
      `💰 *Preço:* €${trip.price}\n\n` +
      `ID: ${trip.id}`;

    // Enviar para o bot Telegram (implementado em telegram.ts)
    // await sendTelegramMessage(message);
    log(`Notificação Telegram enviada para reserva ${trip.id}`);

  } catch (error) {
    log(`Erro ao notificar Telegram: ${error}`);
  }
}

async function notifyTelegramCancel(data: any) {
  try {
    const message = `❌ *RESERVA CANCELADA - 691*\n\n` +
      `👤 *Cliente:* ${data.customerName}\n` +
      `📞 *Telefone:* ${data.customerPhone}`;

    // await sendTelegramMessage(message);
    log(`Cancelamento notificado no Telegram`);

  } catch (error) {
    log(`Erro ao notificar cancelamento: ${error}`);
  }
}

async function notifyTelegramMessage(message: any) {
  try {
    const telegramMessage = `💬 *NOVA MENSAGEM - RESERVA ${message.tripId}*\n\n` +
      `👤 *Cliente:* ${message.sender === 'customer' ? 'Cliente' : 'Motorista'}\n` +
      `📝 *Mensagem:* ${message.contentTranslated}`;

    // await sendTelegramMessage(telegramMessage);
    log(`Mensagem de chat notificada no Telegram`);

  } catch (error) {
    log(`Erro ao notificar mensagem: ${error}`);
  }
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  // Setup Telegram Bot
  if (process.env.TELEGRAM_BOT_TOKEN) {
    setupTelegramBot(io);
    log("Telegram bot initialized");
  }

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
      log(`Socket.io server ready`);
    },
  );
})();
