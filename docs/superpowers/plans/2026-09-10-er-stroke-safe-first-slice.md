# ER-STROKE SAFE First Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a locally runnable React frontend, Next.js API, and MariaDB-backed first slice for role-based ER-STROKE SAFE follow-up.

**Architecture:** A pnpm workspace contains a Vite React single-page frontend and a Next.js App Router API. The API owns authentication, authorization, audit logs, validation, and Prisma access to MariaDB; the frontend consumes typed HTTP endpoints only.

**Tech Stack:** TypeScript, pnpm workspaces, React + Vite, React Router, Next.js App Router Route Handlers, Prisma ORM with MariaDB, Argon2, Zod, Vitest, React Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-10-stroke-platform-design.md`

## Global Constraints

- The interface is Thai-first and uses the exact role names ผู้เข้าร่วมวิจัย, พยาบาล, and ผู้ดูแลระบบ.
- The frontend never connects directly to MariaDB.
- Connection values, credentials, passwords, tokens, and personally identifiable data are only in untracked environment files.
- Passwords are hashed with Argon2.
- API authorization is mandatory for every protected route; a frontend route guard is not sufficient.
- Participants access only their own records; nurses access only assigned participants; admins manage users, assignments, reporting, and audit records.
- The platform is not a stroke/TIA diagnostic tool. Emergency education must direct acute neurological symptoms to emergency services immediately.
- Use fictional seeded accounts and data only.
- Every privileged read or write creates an audit record.
- The initial slice includes workspace setup, database migrations, seeded fictional accounts, authentication, role authorization, participant goals and daily checks, nurse caseload/feedback, admin user and assignment overview, and BE-FAST education.

---

## File Structure

```text
apps/
  api/
    app/api/auth/login/route.ts
    app/api/auth/logout/route.ts
    app/api/auth/me/route.ts
    app/api/participant/dashboard/route.ts
    app/api/participant/goals/route.ts
    app/api/participant/daily-checks/route.ts
    app/api/nurse/caseload/route.ts
    app/api/nurse/participants/[participantId]/route.ts
    app/api/nurse/participants/[participantId]/feedback/route.ts
    app/api/admin/users/route.ts
    app/api/admin/assignments/route.ts
    lib/auth.ts
    lib/http.ts
    lib/prisma.ts
    lib/audit.ts
    lib/authorization.ts
    prisma/schema.prisma
    prisma/seed.ts
  web/
    src/app/App.tsx
    src/app/router.tsx
    src/lib/api.ts
    src/lib/auth.tsx
    src/features/auth/LoginPage.tsx
    src/features/participant/ParticipantDashboardPage.tsx
    src/features/participant/GoalForm.tsx
    src/features/participant/DailyCheckForm.tsx
    src/features/participant/EmergencyPage.tsx
    src/features/nurse/NurseCaseloadPage.tsx
    src/features/nurse/NurseParticipantPage.tsx
    src/features/admin/AdminUsersPage.tsx
    src/features/admin/AdminAssignmentsPage.tsx
packages/
  shared/src/domain.ts
  shared/src/schemas.ts
database/migrations/001_create_stroke_database.sql
```

### Task 1: Create the workspace and safe environment baseline

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `.gitignore`, `.env.example`
- Create: `apps/api/package.json`, `apps/web/package.json`, `packages/shared/package.json`
- Create: `apps/api/.env.example`, `apps/web/.env.example`
- Modify: `README.md`
- Test: `package.json` workspace scripts

**Interfaces:**
- Produces `pnpm dev`, `pnpm test`, `pnpm lint`, and `pnpm build` workspace commands.
- Produces the environment variable names `DATABASE_URL`, `SESSION_SECRET`, `WEB_ORIGIN`, and `VITE_API_BASE_URL` without values.

- [ ] **Step 1: Write the configuration assertion script**

Create `scripts/verify-workspace.mjs`:

```js
import { readFileSync } from "node:fs";

const root = JSON.parse(readFileSync(new URL("../package.json", import.meta.url)));
if (!root.workspaces?.includes("apps/*") || !root.workspaces?.includes("packages/*")) {
  throw new Error("Workspace package globs are missing");
}
console.log("workspace configuration is valid");
```

- [ ] **Step 2: Run the assertion before configuration exists**

Run: `node scripts/verify-workspace.mjs`

Expected: FAIL because `package.json` does not yet define the workspace.

- [ ] **Step 3: Add the minimal workspace configuration**

Use this root `package.json` shape:

```json
{
  "name": "stroke",
  "private": true,
  "packageManager": "pnpm@10",
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "pnpm --parallel --filter @stroke/api --filter @stroke/web dev",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint",
    "build": "pnpm -r build",
    "verify:workspace": "node scripts/verify-workspace.mjs"
  }
}
```

Add `.gitignore` entries for `.env`, `.env.*`, `!.env.example`, `node_modules`, `dist`, `.next`, `coverage`, and `playwright-report`. Document startup prerequisites and environment variable names in Thai in `README.md`.

- [ ] **Step 4: Run the configuration assertion**

Run: `pnpm verify:workspace`

Expected: PASS with `workspace configuration is valid`.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-workspace.yaml .gitignore .env.example apps packages scripts README.md
git commit -m "chore: create Stroke workspace baseline"
```

### Task 2: Define shared roles, domain types, and input schemas

**Files:**
- Create: `packages/shared/src/domain.ts`, `packages/shared/src/schemas.ts`, `packages/shared/src/index.ts`
- Create: `packages/shared/src/schemas.test.ts`
- Modify: `packages/shared/package.json`

**Interfaces:**
- Produces `Role`, `ParticipantGoal`, `DailyCheck`, `ApiError`, `createGoalSchema`, `createDailyCheckSchema`, `loginSchema`, and `feedbackSchema` exports.
- Consumed by API route handlers and React forms.

- [ ] **Step 1: Write failing schema tests**

```ts
import { describe, expect, it } from "vitest";
import { createGoalSchema, loginSchema } from "./schemas";

describe("shared schemas", () => {
  it("rejects a non-SMART goal without a target date", () => {
    expect(() => createGoalSchema.parse({ title: "เดิน", frequency: 0 })).toThrow();
  });

  it("rejects an invalid email at login", () => {
    expect(() => loginSchema.parse({ email: "not-email", password: "short" })).toThrow();
  });
});
```

- [ ] **Step 2: Run the schema test**

Run: `pnpm --filter @stroke/shared test`

Expected: FAIL because the schema module is absent.

- [ ] **Step 3: Implement domain and schema exports**

Define:

```ts
export const roles = ["PARTICIPANT", "NURSE", "ADMIN"] as const;
export type Role = (typeof roles)[number];
```

Define Zod schemas with: an email and minimum 12-character password for login; a goal title of 3-160 characters; positive weekly frequency; ISO target date; daily check date, confidence integer 0-10, optional blood pressure values, medication status, activity minutes, and note limited to 1,000 characters; and feedback text limited to 2,000 characters.

- [ ] **Step 4: Run the schema test**

Run: `pnpm --filter @stroke/shared test`

Expected: PASS with two passing tests.

- [ ] **Step 5: Commit**

```bash
git add packages/shared
git commit -m "feat: add shared roles and validation schemas"
```

### Task 3: Create MariaDB schema, Prisma client, migrations, and fictional seed data

**Files:**
- Create: `database/migrations/001_create_stroke_database.sql`
- Create: `apps/api/prisma/schema.prisma`, `apps/api/prisma/seed.ts`
- Create: `apps/api/lib/prisma.ts`
- Create: `apps/api/prisma/schema.test.ts`
- Modify: `apps/api/package.json`, `README.md`, `apps/api/.env.example`

**Interfaces:**
- Produces Prisma models `User`, `ParticipantProfile`, `NurseParticipantAssignment`, `RiskProfile`, `Goal`, `ObstaclePlan`, `DailyCheck`, `FollowUpAssessment`, `NurseFeedback`, `Reminder`, and `AuditLog`.
- Produces `prisma` singleton for server-side database access.

- [ ] **Step 1: Write failing schema invariants**

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const schema = readFileSync(new URL("./schema.prisma", import.meta.url), "utf8");

describe("ER-STROKE SAFE database schema", () => {
  it("contains all ownership and audit models", () => {
    for (const model of ["User", "ParticipantProfile", "NurseParticipantAssignment", "Goal", "DailyCheck", "NurseFeedback", "AuditLog"]) {
      expect(schema).toContain(`model ${model}`);
    }
  });
});
```

- [ ] **Step 2: Run the schema invariant test**

Run: `pnpm --filter @stroke/api test -- schema.test.ts`

Expected: FAIL because the Prisma schema is absent.

- [ ] **Step 3: Implement schema and migration**

Use `provider = "mysql"` for MariaDB. Add UUID primary IDs, foreign keys, `createdAt`/`updatedAt` UTC timestamps, unique email addresses, role enum, indexes on owner/assignee/date combinations, and an append-only `AuditLog` model. Create `001_create_stroke_database.sql` with `CREATE DATABASE IF NOT EXISTS stroke_safe CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;` only; allow Prisma migrations to own table creation.

Seed three fictional users using Argon2 hashes: one participant, one nurse, and one admin. Seed the participant-to-nurse assignment, a fictional risk profile, one SMART goal, one daily check, and one audit event. The seed script must read `DATABASE_URL` and must not contain a literal database password.

- [ ] **Step 4: Run migration and schema test**

Run: `pnpm --filter @stroke/api prisma migrate dev --name initial_stroke_schema && pnpm --filter @stroke/api prisma db seed && pnpm --filter @stroke/api test -- schema.test.ts`

Expected: migration, seed, and schema test PASS against the local MariaDB database.

- [ ] **Step 5: Commit**

```bash
git add database apps/api/prisma apps/api/lib/prisma.ts apps/api/package.json apps/api/.env.example README.md
git commit -m "feat: add MariaDB schema and fictional seeds"
```

### Task 4: Implement authentication, HTTP error handling, authorization, and audit logging

**Files:**
- Create: `apps/api/lib/auth.ts`, `apps/api/lib/authorization.ts`, `apps/api/lib/http.ts`, `apps/api/lib/audit.ts`
- Create: `apps/api/app/api/auth/login/route.ts`, `apps/api/app/api/auth/logout/route.ts`, `apps/api/app/api/auth/me/route.ts`
- Create: `apps/api/lib/auth.test.ts`, `apps/api/lib/authorization.test.ts`

**Interfaces:**
- Produces `requireSession(request)`, `requireRole(session, roles)`, `requireParticipantOwnership(session, participantId)`, `requireNurseAssignment(session, participantId)`, `audit(actorId, action, entityType, entityId)`, and `apiError(status, code, message)`.
- Login returns `{ user: { id, role, displayName } }` and sets an HTTP-only cookie. Logout clears it.

- [ ] **Step 1: Write failing authentication and authorization tests**

```ts
it("rejects a participant attempting to read a different participant", async () => {
  await expect(requireParticipantOwnership(participantSession, otherParticipantId)).rejects.toMatchObject({ status: 403 });
});

it("permits an assigned nurse", async () => {
  await expect(requireNurseAssignment(assignedNurseSession, participantId)).resolves.toBeUndefined();
});
```

- [ ] **Step 2: Run the auth tests**

Run: `pnpm --filter @stroke/api test -- auth.test.ts authorization.test.ts`

Expected: FAIL because authorization functions are absent.

- [ ] **Step 3: Implement the server security boundary**

Use Argon2 verify for login. Store a signed session identifier in an HTTP-only cookie with `SameSite=Lax`; use `Secure` outside local development. Resolve the session server-side to a user and role. Return errors as `{ error: { code, message } }`, with Thai user-facing messages and no internal error details. Add an audit record after successful login, logout, and every protected route's privileged action.

- [ ] **Step 4: Run the auth tests**

Run: `pnpm --filter @stroke/api test -- auth.test.ts authorization.test.ts`

Expected: PASS with participant denial and nurse assignment allowance verified.

- [ ] **Step 5: Commit**

```bash
git add apps/api/lib apps/api/app/api/auth
git commit -m "feat: add role-based authentication and audit logging"
```

### Task 5: Implement participant API routes for dashboard, SMART goals, and daily checks

**Files:**
- Create: `apps/api/app/api/participant/dashboard/route.ts`
- Create: `apps/api/app/api/participant/goals/route.ts`
- Create: `apps/api/app/api/participant/daily-checks/route.ts`
- Create: `apps/api/app/api/participant/dashboard/route.test.ts`
- Create: `apps/api/app/api/participant/goals/route.test.ts`
- Create: `apps/api/app/api/participant/daily-checks/route.test.ts`

**Interfaces:**
- `GET /api/participant/dashboard` returns the current participant's risk profile, active goals, latest daily checks, follow-up status, and feedback.
- `POST /api/participant/goals` accepts `createGoalSchema` and creates an owned goal.
- `POST /api/participant/daily-checks` accepts `createDailyCheckSchema` and creates an owned dated entry.

- [ ] **Step 1: Write failing route tests**

```ts
it("creates a daily check only for the signed-in participant", async () => {
  const response = await POST(requestForParticipant({ confidence: 8, activityMinutes: 30 }));
  expect(response.status).toBe(201);
  await expect(DailyCheck.findFor(otherParticipantId)).resolves.toHaveLength(0);
});
```

- [ ] **Step 2: Run the participant route tests**

Run: `pnpm --filter @stroke/api test -- participant`

Expected: FAIL because participant routes do not exist.

- [ ] **Step 3: Implement participant routes**

Resolve the participant profile only from the authenticated session. Use shared Zod schemas. Persist entries in a transaction, write an audit log, and return `201` with the created resource. Return `403` when the session is not a participant, `422` for invalid input, and `401` for no session. Do not calculate a stroke prediction or offer diagnostic advice.

- [ ] **Step 4: Run participant route tests**

Run: `pnpm --filter @stroke/api test -- participant`

Expected: PASS for ownership, schema validation, and audit records.

- [ ] **Step 5: Commit**

```bash
git add apps/api/app/api/participant
git commit -m "feat: add participant goals and daily check API"
```

### Task 6: Implement nurse caseload, participant read view, and targeted feedback API

**Files:**
- Create: `apps/api/app/api/nurse/caseload/route.ts`
- Create: `apps/api/app/api/nurse/participants/[participantId]/route.ts`
- Create: `apps/api/app/api/nurse/participants/[participantId]/feedback/route.ts`
- Create: `apps/api/app/api/nurse/nurse.routes.test.ts`

**Interfaces:**
- `GET /api/nurse/caseload` returns assigned participants with daily-check and Day 30/90 status.
- `GET /api/nurse/participants/:participantId` returns an assigned participant record.
- `POST /api/nurse/participants/:participantId/feedback` accepts `feedbackSchema`.

- [ ] **Step 1: Write failing nurse permission tests**

```ts
it("does not expose an unassigned participant to a nurse", async () => {
  const response = await getNurseParticipant(unassignedParticipantId, assignedNurseSession);
  expect(response.status).toBe(403);
});

it("stores feedback and its audit record for an assigned participant", async () => {
  const response = await createFeedback(assignedParticipantId, assignedNurseSession, { body: "คุณทำได้ดีมาก" });
  expect(response.status).toBe(201);
  expect(await auditExists("NURSE_FEEDBACK_CREATED")).toBe(true);
});
```

- [ ] **Step 2: Run the nurse tests**

Run: `pnpm --filter @stroke/api test -- nurse.routes.test.ts`

Expected: FAIL because nurse routes are absent.

- [ ] **Step 3: Implement nurse routes**

Check `NURSE` role and assignment before querying a participant. List only assigned participants. Compute overdue status from the most recent daily-check date and scheduled follow-up date. Create feedback without modifying participant entries, validate it with the shared schema, and audit successful reads and writes.

- [ ] **Step 4: Run the nurse tests**

Run: `pnpm --filter @stroke/api test -- nurse.routes.test.ts`

Expected: PASS with unassigned data hidden and feedback persisted.

- [ ] **Step 5: Commit**

```bash
git add apps/api/app/api/nurse
git commit -m "feat: add nurse caseload and feedback API"
```

### Task 7: Implement admin user and assignment overview API

**Files:**
- Create: `apps/api/app/api/admin/users/route.ts`
- Create: `apps/api/app/api/admin/assignments/route.ts`
- Create: `apps/api/app/api/admin/admin.routes.test.ts`

**Interfaces:**
- `GET /api/admin/users` returns non-sensitive account fields only.
- `POST /api/admin/assignments` accepts a participant and nurse UUID pair.

- [ ] **Step 1: Write failing admin route tests**

```ts
it("returns 403 when a nurse requests user administration", async () => {
  expect((await listUsers(nurseSession)).status).toBe(403);
});

it("allows only an admin to create a nurse assignment", async () => {
  expect((await createAssignment(adminSession, assignmentInput)).status).toBe(201);
});
```

- [ ] **Step 2: Run the admin tests**

Run: `pnpm --filter @stroke/api test -- admin.routes.test.ts`

Expected: FAIL because admin routes are absent.

- [ ] **Step 3: Implement admin routes**

Apply `ADMIN` role guards. Exclude password hashes and session data from all user responses. Validate that assignment user IDs have `NURSE` and `PARTICIPANT` roles before persistence. Keep assignment history in the audit log. Respond with `409` if an identical active assignment already exists.

- [ ] **Step 4: Run the admin tests**

Run: `pnpm --filter @stroke/api test -- admin.routes.test.ts`

Expected: PASS for denial, role checks, non-sensitive response data, and duplicate handling.

- [ ] **Step 5: Commit**

```bash
git add apps/api/app/api/admin
git commit -m "feat: add admin users and assignments API"
```

### Task 8: Build React application shell, auth state, API client, and protected routes

**Files:**
- Create: `apps/web/src/main.tsx`, `apps/web/src/app/App.tsx`, `apps/web/src/app/router.tsx`
- Create: `apps/web/src/lib/api.ts`, `apps/web/src/lib/auth.tsx`
- Create: `apps/web/src/features/auth/LoginPage.tsx`, `apps/web/src/features/auth/LoginPage.test.tsx`
- Create: `apps/web/src/components/RoleRoute.tsx`, `apps/web/src/components/RoleRoute.test.tsx`

**Interfaces:**
- Produces `api<T>(path, options)` which sends credentials and decodes the common API error envelope.
- Produces `AuthProvider`, `useAuth()`, and `RoleRoute({ roles, children })`.
- Routes: `/login`, `/participant`, `/nurse`, and `/admin`.

- [ ] **Step 1: Write failing frontend authentication tests**

```tsx
it("redirects an unauthenticated visitor to login", async () => {
  renderAtRoute("/participant");
  expect(await screen.findByRole("heading", { name: "เข้าสู่ระบบ" })).toBeInTheDocument();
});

it("shows the nurse route only to a nurse", async () => {
  renderWithAuth("/nurse", { role: "NURSE" });
  expect(await screen.findByRole("heading", { name: "ผู้เข้าร่วมที่ดูแล" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run frontend auth tests**

Run: `pnpm --filter @stroke/web test -- LoginPage RoleRoute`

Expected: FAIL because the application shell is absent.

- [ ] **Step 3: Implement the application shell**

Use React Router. On initial load call `GET /api/auth/me`; represent loading, unauthenticated, and authenticated states. Submit login to `POST /api/auth/login` with `credentials: "include"`. Redirect users to their single permitted role home after login. Route guards are for UI navigation only; never present them as authorization.

- [ ] **Step 4: Run frontend auth tests**

Run: `pnpm --filter @stroke/web test -- LoginPage RoleRoute`

Expected: PASS for redirect and role-specific navigation.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src apps/web/package.json
git commit -m "feat: add React auth shell and protected routes"
```

### Task 9: Build participant views for dashboard, SMART goal, Daily Check, and BE-FAST

**Files:**
- Create: `apps/web/src/features/participant/ParticipantDashboardPage.tsx`
- Create: `apps/web/src/features/participant/GoalForm.tsx`, `apps/web/src/features/participant/DailyCheckForm.tsx`
- Create: `apps/web/src/features/participant/EmergencyPage.tsx`
- Create: `apps/web/src/features/participant/participant.test.tsx`

**Interfaces:**
- Consumes participant dashboard, goal, and daily-check API interfaces from Task 5.
- Produces participant routes `/participant`, `/participant/goals/new`, `/participant/daily-check`, and `/participant/emergency`.

- [ ] **Step 1: Write failing participant UI tests**

```tsx
it("submits a valid daily check and shows its saved timestamp", async () => {
  renderParticipantRoute("/participant/daily-check");
  await userEvent.type(screen.getByLabelText("ความมั่นใจ"), "8");
  await userEvent.click(screen.getByRole("button", { name: "บันทึกวันนี้" }));
  expect(await screen.findByText("บันทึกแล้ว")).toBeInTheDocument();
});

it("shows urgent escalation copy on the emergency page", () => {
  renderParticipantRoute("/participant/emergency");
  expect(screen.getByText(/เข้าสู่ระบบบริการฉุกเฉินทันที/)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run participant UI tests**

Run: `pnpm --filter @stroke/web test -- participant.test.tsx`

Expected: FAIL because participant views are absent.

- [ ] **Step 3: Implement participant views**

Render risk factors as modifiable care-plan context, not a score predicting stroke. The goal form must capture title, behavior, frequency, target date, and optional barrier if-then plan. Daily Check must render only applicable fields, client-validate with shared schemas, preserve a draft in local storage before submission, clear it after a confirmed API response, and show a saved timestamp. The emergency page must show BE-FAST and a visually prominent Thai instruction to seek emergency care immediately for acute neurological symptoms; do not add a symptom calculator.

- [ ] **Step 4: Run participant UI tests**

Run: `pnpm --filter @stroke/web test -- participant.test.tsx`

Expected: PASS with confirmed save state and emergency copy.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/participant
git commit -m "feat: add participant care-plan and emergency views"
```

### Task 10: Build nurse and admin React workspaces

**Files:**
- Create: `apps/web/src/features/nurse/NurseCaseloadPage.tsx`, `apps/web/src/features/nurse/NurseParticipantPage.tsx`
- Create: `apps/web/src/features/admin/AdminUsersPage.tsx`, `apps/web/src/features/admin/AdminAssignmentsPage.tsx`
- Create: `apps/web/src/features/nurse/nurse.test.tsx`, `apps/web/src/features/admin/admin.test.tsx`

**Interfaces:**
- Consumes API interfaces from Tasks 6 and 7.
- Produces `/nurse`, `/nurse/participants/:participantId`, `/admin/users`, and `/admin/assignments`.

- [ ] **Step 1: Write failing role workspace tests**

```tsx
it("renders only assigned participants in the nurse caseload", async () => {
  renderNurseRoute("/nurse");
  expect(await screen.findByText("ผู้เข้าร่วมที่ได้รับมอบหมาย")).toBeInTheDocument();
  expect(screen.queryByText("ผู้เข้าร่วมที่ไม่ได้รับมอบหมาย")).not.toBeInTheDocument();
});

it("does not render a password field in the admin user table", async () => {
  renderAdminRoute("/admin/users");
  expect(await screen.findByRole("table")).toBeInTheDocument();
  expect(screen.queryByText(/password hash/i)).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run role workspace tests**

Run: `pnpm --filter @stroke/web test -- nurse.test.tsx admin.test.tsx`

Expected: FAIL because the nurse and admin views are absent.

- [ ] **Step 3: Implement role workspaces**

Nurse caseload lists the assigned participants, an overdue label, and follow-up statuses. The participant detail view displays risk profile, goals, daily checks, and an accessible feedback form. Admin views list only non-sensitive account details, let admins create a validated nurse-to-participant assignment, and show an inline duplicate-assignment error. Use Thai labels and useful loading, empty, and API error states.

- [ ] **Step 4: Run role workspace tests**

Run: `pnpm --filter @stroke/web test -- nurse.test.tsx admin.test.tsx`

Expected: PASS for caseload filtering and safe admin table rendering.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/nurse apps/web/src/features/admin apps/web/src/app/router.tsx
git commit -m "feat: add nurse and admin workspaces"
```

### Task 11: Add end-to-end smoke coverage and operational documentation

**Files:**
- Create: `e2e/auth-and-roles.spec.ts`, `e2e/participant-daily-check.spec.ts`
- Create: `playwright.config.ts`
- Modify: `README.md`, `apps/api/.env.example`, `apps/web/.env.example`

**Interfaces:**
- Produces `pnpm test:e2e` and documented commands for starting the local API, web app, migration, seed, unit tests, build, and end-to-end tests.

- [ ] **Step 1: Write failing end-to-end smoke tests**

```ts
test("each seeded role is redirected to its allowed home", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill("participant@example.test");
  await page.getByLabel("รหัสผ่าน").fill("ExamplePassword123!");
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/participant$/);
});
```

- [ ] **Step 2: Run the end-to-end test**

Run: `pnpm test:e2e -- auth-and-roles.spec.ts`

Expected: FAIL until both services and seeded data are available.

- [ ] **Step 3: Implement Playwright setup and documentation**

Configure Playwright web servers for the API and React app. Add tests for each seeded role redirect, participant daily-check submission, nurse feedback, and rejection of direct participant URL access by an unassigned nurse. Update the Thai README with setup commands, required untracked environment variables, fictional development account names without passwords, role permissions, safety disclaimer, and the exact test commands.

- [ ] **Step 4: Run the full verification suite**

Run: `pnpm lint && pnpm test && pnpm build && pnpm test:e2e`

Expected: all workspace lint, unit/integration tests, production builds, and end-to-end smoke tests PASS.

- [ ] **Step 5: Commit**

```bash
git add e2e playwright.config.ts README.md apps/api/.env.example apps/web/.env.example package.json
git commit -m "test: add ER-STROKE SAFE end-to-end coverage"
```

## Plan self-review

- Spec coverage: Tasks 1-3 establish the three-part platform and MariaDB model. Tasks 4-7 implement secure role-based API behavior and auditing. Tasks 8-10 implement the three approved role workspaces. Task 9 covers SMART goals, Daily Check, BE-FAST, local drafts, and safety escalation. Task 11 covers operational documentation and end-to-end verification.
- Placeholder scan: no task contains TBD, TODO, or an undefined follow-on instruction.
- Type consistency: role values, shared schemas, API route paths, and route consumers use the same names throughout the plan.
