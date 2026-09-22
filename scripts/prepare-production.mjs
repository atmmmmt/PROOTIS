import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const serverSource = resolve(root, "apps/api-server/dist");
const webSource = resolve(root, "apps/web-dashboard/dist");
const output = resolve(root, "dist");
const nestedOutput = resolve(output, "dist");

const apiPackage = JSON.parse(
  readFileSync(resolve(root, "apps/api-server/package.json"), "utf8")
);

rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });

// Copy the compiled Express server and the Vite frontend into one deployable bundle.
cpSync(serverSource, output, { recursive: true });
cpSync(webSource, resolve(output, "public"), { recursive: true });

// Hostinger may resolve the Entry file either relative to the project root
// or relative to the configured output directory. Keep a compatibility entry
// at dist/dist/index.js so both `index.js` and `dist/index.js` configurations work.
mkdirSync(nestedOutput, { recursive: true });
writeFileSync(resolve(nestedOutput, "index.js"), 'import "../index.js";\n', "utf8");

// Provide a production package manifest alongside the compiled server so the
// runtime has an explicit start command and knows all server dependencies.
writeFileSync(
  resolve(output, "package.json"),
  `${JSON.stringify(
    {
      name: "prootech-production",
      private: true,
      type: "module",
      main: "index.js",
      scripts: { start: "node index.js" },
      engines: { node: ">=20" },
      dependencies: apiPackage.dependencies ?? {}
    },
    null,
    2
  )}\n`,
  "utf8"
);

console.log("Production bundle ready in dist/");
console.log("Primary entry file: dist/index.js");
console.log("Hostinger compatibility entry: dist/dist/index.js");
console.log("Frontend: dist/public/");
console.log("Runtime package manifest: dist/package.json");
