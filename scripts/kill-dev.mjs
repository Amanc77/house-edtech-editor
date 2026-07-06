import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";

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

const lockPath = join(process.cwd(), ".next", "dev", "lock");
if (existsSync(lockPath)) {
  try {
    unlinkSync(lockPath);
  } catch {
    // ignore
  }
}

killPort(3000);
killPort(3001);
killPort(Number(process.env.SOCKET_PORT) || 3001);
