import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Next.js 16 custom dev server expects required-server-files.json under .next/dev.
 * Copy or create it when missing (e.g. after production build without a dev session).
 */
export function ensureDevServerFiles(projectDir = process.cwd()): void {
  const devDir = join(projectDir, ".next", "dev");
  const target = join(devDir, "required-server-files.json");

  if (existsSync(target)) return;

  mkdirSync(devDir, { recursive: true });

  const prodManifest = join(projectDir, ".next", "required-server-files.json");
  if (existsSync(prodManifest)) {
    const data = JSON.parse(readFileSync(prodManifest, "utf8")) as {
      version: number;
      config: Record<string, unknown>;
    };
    data.config = { ...data.config, distDir: ".next/dev" };
    writeFileSync(target, JSON.stringify(data, null, 2));
    return;
  }

  writeFileSync(
    target,
    JSON.stringify(
      {
        version: 1,
        config: {
          distDir: ".next/dev",
          pageExtensions: ["tsx", "ts", "jsx", "js"],
          experimental: {},
        },
      },
      null,
      2
    )
  );
}
