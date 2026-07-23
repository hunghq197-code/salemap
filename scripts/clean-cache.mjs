import { existsSync, rmSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const cachePaths = [".next", ".npm-cache", "tsconfig.tsbuildinfo"];

for (const cachePath of cachePaths) {
  const absolutePath = path.resolve(root, cachePath);

  if (!absolutePath.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Refusing to remove path outside project: ${absolutePath}`);
  }

  if (!existsSync(absolutePath)) {
    continue;
  }

  rmSync(absolutePath, { force: true, recursive: true });
  console.log(`[clean] Removed ${cachePath}`);
}
