import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const serverSource = resolve(root, "apps/api-server/dist");
const webSource = resolve(root, "apps/web-dashboard/dist");
const output = resolve(root, "dist");

rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });

cpSync(serverSource, output, { recursive: true });
cpSync(webSource, resolve(output, "public"), { recursive: true });

writeFileSync(
  resolve(output, "package.json"),
  `${JSON.stringify({ type: "module" }, null, 2)}\n`,
  "utf8"
);

console.log("Production bundle ready in dist/");
console.log("Entry file: dist/index.js");
console.log("Frontend: dist/public/");
