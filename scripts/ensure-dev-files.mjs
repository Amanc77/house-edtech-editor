import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function ensureDevServerFiles(projectDir) {
  const devDir = join(projectDir, ".next", "dev");
  const target = join(devDir, "required-server-files.json");

  if (existsSync(target)) return;

  mkdirSync(devDir, { recursive: true });

  const prodManifest = join(projectDir, ".next", "required-server-files.json");
  if (existsSync(prodManifest)) {
    const data = JSON.parse(readFileSync(prodManifest, "utf8"));
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

ensureDevServerFiles(root);
console.log("[dev] Ensured .next/dev/required-server-files.json");
