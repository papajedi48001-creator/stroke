import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://localhost:5173", trace: "retain-on-failure" },
  webServer: [
    { command: "pnpm --filter @stroke/api dev", url: "http://localhost:3000/api/auth/me", reuseExistingServer: true },
    { command: "pnpm --filter @stroke/web dev --host 127.0.0.1", url: "http://localhost:5173/login", reuseExistingServer: true },
  ],
});
