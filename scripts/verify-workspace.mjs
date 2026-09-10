import { readFileSync } from "node:fs";

const root = JSON.parse(readFileSync(new URL("../package.json", import.meta.url)));

if (!root.workspaces?.includes("apps/*") || !root.workspaces?.includes("packages/*")) {
  throw new Error("Workspace package globs are missing");
}

console.log("workspace configuration is valid");
