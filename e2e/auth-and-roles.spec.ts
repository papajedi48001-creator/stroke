import { expect, test } from "@playwright/test";

test("participant signs in and reaches the care dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill("participant@example.test");
  await page.getByLabel("รหัสผ่าน").fill("ExamplePassword123!");
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/participant$/);
  await expect(page.getByRole("heading", { name: "แผนดูแลตนเอง" })).toBeVisible();
});
