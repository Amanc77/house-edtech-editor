import { loadEnvConfig } from "@next/env";
import { createServer } from "http";

loadEnvConfig(process.cwd());
import { connectDB } from "@/server/db/connection";
import { initSocketServer } from "@/server/socket/socketServer";

const hostname = process.env.HOSTNAME ?? "localhost";
const port = Number(process.env.SOCKET_PORT) || 3001;

async function startSocketServer(): Promise<void> {
  const httpServer = createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("SyncDocs Socket.io server");
  });

  initSocketServer(httpServer);

  httpServer.listen(port, () => {
    console.log(`[socket] Ready on http://${hostname}:${port}`);
    console.log(`[socket] Socket.io path: /api/socket`);
  });

  try {
    await connectDB();
    console.log("[socket] MongoDB connected");
  } catch (error) {
    console.error("[socket] MongoDB connection failed:", error);
  }

  const shutdown = (signal: string) => {
    console.log(`[socket] ${signal} received, shutting down...`);
    httpServer.close(() => process.exit(0));
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

startSocketServer().catch((error) => {
  console.error("[socket] Failed to start:", error);
  process.exit(1);
});
