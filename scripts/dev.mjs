import { spawn } from "node:child_process";
import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const socketPort = process.env.SOCKET_PORT || "3001";

function killPort(port) {
  try {
    const pids = execSync(`lsof -ti:${port} 2>/dev/null`, { encoding: "utf8" })
      .trim()
      .split("\n")
      .filter(Boolean);
    for (const pid of pids) {
      try {
        process.kill(Number(pid), "SIGTERM");
      } catch {
        // already gone
      }
    }
  } catch {
    // port free
  }
}

function prepare() {
  const lockPath = join(root, ".next", "dev", "lock");
  if (existsSync(lockPath)) {
    try {
      unlinkSync(lockPath);
    } catch {
      // ignore
    }
  }

  killPort(3000);
  killPort(Number(socketPort));

  execSync("node scripts/ensure-dev-files.mjs", { stdio: "inherit", cwd: root });
}

const sharedEnv = {
  ...process.env,
  SOCKET_PORT: socketPort,
  NEXT_PUBLIC_SOCKET_ENABLED:
    process.env.NEXT_PUBLIC_SOCKET_ENABLED ?? "true",
  NEXT_PUBLIC_SOCKET_URL:
    process.env.NEXT_PUBLIC_SOCKET_URL || `http://localhost:${socketPort}`,
};

let nextProc;
let socketProc;

function shutdown(code = 0) {
  if (nextProc && !nextProc.killed) nextProc.kill("SIGTERM");
  if (socketProc && !socketProc.killed) socketProc.kill("SIGTERM");
  setTimeout(() => process.exit(code), 250);
}

try {
  prepare();

  console.log("[dev] Starting Next.js on http://localhost:3000");
  console.log(`[dev] Starting Socket.io on http://localhost:${socketPort}`);

  nextProc = spawn("npx", ["next", "dev"], {
    cwd: root,
    env: sharedEnv,
    stdio: "inherit",
  });

  socketProc = spawn("npx", ["tsx", "server/socket-standalone.ts"], {
    cwd: root,
    env: sharedEnv,
    stdio: "inherit",
  });

  nextProc.on("exit", (code) => {
    if (code && code !== 0) shutdown(code);
  });

  socketProc.on("exit", (code) => {
    if (code && code !== 0) shutdown(code);
  });

  process.on("SIGINT", () => shutdown(0));
  process.on("SIGTERM", () => shutdown(0));
} catch (error) {
  console.error("[dev] Failed to start:", error);
  process.exit(1);
}
