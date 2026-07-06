import { loadEnvConfig } from "@next/env";
import { createServer } from "http";
import { parse } from "url";
import next from "next";

loadEnvConfig(process.cwd());
import { connectDB } from "@/server/db/connection";
import { initSocketServer } from "@/server/socket/socketServer";
import { ensureDevServerFiles } from "@/server/ensure-dev-files";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "localhost";
const port = Number(process.env.PORT) || 3000;

async function startServer(): Promise<void> {
  try {
    await connectDB();
    console.log("[server] MongoDB connected");
  } catch (error) {
    console.error("[server] MongoDB connection failed:", error);
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }

  if (dev) {
    ensureDevServerFiles();
  }

  const httpServer = createServer();
  const app = next({ dev, hostname, port, httpServer });
  const handle = app.getRequestHandler();

  await app.prepare();

  httpServer.on("request", async (req, res) => {
    try {
      const parsedUrl = parse(req.url ?? "/", true);
      await handle(req, res, parsedUrl);
    } catch (error) {
      console.error("[server] Request error:", error);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  const io = initSocketServer(httpServer);

  httpServer.listen(port, () => {
    console.log(`[server] Ready on http://${hostname}:${port}`);
    console.log(`[server] Socket.io path: /api/socket`);
  });

  const shutdown = async (signal: string) => {
    console.log(`[server] ${signal} received, shutting down...`);
    io.close();
    httpServer.close(() => {
      console.log("[server] HTTP server closed");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

startServer().catch((error) => {
  console.error("[server] Failed to start:", error);
  process.exit(1);
});
