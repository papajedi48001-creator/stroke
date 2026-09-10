import { describe, expect, it } from "vitest";

import { databaseNameFromUrl, serverUrlFromDatabaseUrl } from "./bootstrap-database";

describe("database bootstrap URL helpers", () => {
  it("connects to the server database while preserving credentials", () => {
    const databaseUrl = "mysql://root:encoded%40password@localhost:3306/stroke_safe";

    expect(databaseNameFromUrl(databaseUrl)).toBe("stroke_safe");
    expect(serverUrlFromDatabaseUrl(databaseUrl)).toBe(
      "mysql://root:encoded%40password@localhost:3306/mysql",
    );
  });
});
