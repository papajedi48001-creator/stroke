# Stroke platform design

## Purpose

Build ER-STROKE SAFE as a role-based web platform for a 90-day self-management and follow-up programme. The platform supports health education, goal setting, self-monitoring, feedback, and timely follow-up. It does not diagnose stroke, TIA, or any other medical condition.

The user interface is Thai-first and uses these role names:

- ผู้เข้าร่วมวิจัย (participant)
- พยาบาล (nurse)
- ผู้ดูแลระบบ (admin)

## Architecture

Use a single repository with three clear deployment units:

```text
apps/
  web/                 React + Vite frontend
  api/                 Next.js backend API
packages/
  shared/              TypeScript domain types and validation schemas
database/
  migrations/          MariaDB schema and seed data
```

The React application communicates only with the Next.js API over HTTPS. It never opens a direct MariaDB connection. The API owns business rules, authentication, authorization, audit logging, database queries, and response shaping.

MariaDB runs on the local machine during development. Connection values, including credentials, must be supplied through an untracked `.env` file. No password, secret, token, connection string, or personally identifiable example data may be placed in source code, README, or Git history.

## Authentication and authorization

- Users sign in with email and password.
- Passwords are hashed with Argon2 before persistence.
- The API issues a short-lived access token and an HTTP-only, secure cookie session strategy appropriate to the deployment environment.
- Each protected API route checks authentication and role authorization server-side.
- Frontend route guards improve usability but do not replace API authorization.
- Every privileged read or write has a defined permission. A participant can access only their own records. A nurse can access only participants assigned to them. An admin can manage users, assignments, reporting, and audit records.
- Authentication attempts, user/role changes, assignment changes, clinical-data changes, feedback creation, and report exports are written to the audit log.

## Core data model

| Entity | Responsibility |
| --- | --- |
| users | Account identity, email, password hash, role, active status |
| participant_profiles | Non-authentication participant profile and programme enrolment state |
| nurse_participant_assignments | Which nurse is responsible for which participant |
| risk_profiles | Baseline, modifiable risk factors, and assessment context |
| goals | Participant SMART goals and ownership status |
| obstacle_plans | If-then plans linked to a goal and recorded barriers |
| daily_checks | Dated self-monitoring entries for the fields selected in the care plan |
| follow_up_assessments | T0, post-ER, Day 30, and Day 90 assessment results |
| nurse_feedback | Targeted nurse feedback linked to a participant and optional daily check or goal |
| reminders | Participant-selected reminders and delivery preferences |
| audit_logs | Who performed an action, when, what entity was involved, and an action summary |

The initial schema uses stable UUID identifiers, UTC timestamps, foreign keys, indexed ownership columns, and soft deactivation for accounts. Clinical values are not interpreted as diagnoses by the application.

## Product flows

### Participant

1. Sign in and complete the T0 assessment when required.
2. View My Stroke Risk, framed as factors that can be managed rather than a prediction of stroke.
3. Select one or two modifiable risk factors and create a SMART goal.
4. Record a barrier plan using an explicit if-then response.
5. Complete My Daily Check with only the records relevant to their plan: activity, food, medication adherence, blood pressure, smoking status, confidence, or notes.
6. View My Progress and supportive feedback.
7. Complete Day 30 and Day 90 follow-up tasks when due.
8. Open Emergency / BE-FAST to review warning signs. This page prominently instructs the user to enter local emergency care immediately for acute neurological symptoms and never waits for self-assessment.

### Nurse

1. Sign in to a caseload dashboard.
2. Filter assigned participants by overdue daily checks, Day 30/90 status, or recorded barriers.
3. Read the assigned participant's risk profile, goals, entries, and progress.
4. Add evidence-based, supportive feedback without changing the participant's source entry.
5. Schedule or record the status of planned follow-ups.

### Admin

1. Manage user accounts and role assignments.
2. Assign participants to nurses.
3. View programme-level participation and follow-up completeness.
4. View immutable audit records.
5. Export approved aggregate datasets in a later increment; raw export is out of scope for the first implementation slice.

## ER-STROKE SAFE alignment

The UI and data model map directly to the programme:

| Programme element | Application capability |
| --- | --- |
| Risk review | My Stroke Risk and baseline assessment |
| Individualized coaching | Risk-specific goals and care-plan fields |
| SMART Goal | Goal creation with measurable frequency and target date |
| Mastery experience | Daily Check and visible progress over time |
| Vicarious experience | Short contextual example stories in education content |
| Verbal persuasion | Specific nurse feedback and non-judgmental encouragement |
| Affective states | Barrier & Problem Solving with if-then plans |
| Behavioral maintenance | Participant-selected reminders and Day 30/90 follow-ups |
| BE-FAST | Dedicated emergency education and clear emergency escalation |

## Error handling and safety

- API responses use a consistent JSON error envelope and never expose database errors, stack traces, secrets, or another user's data.
- Forms validate input in the frontend for fast feedback and in the backend as the final authority.
- A missing assignment produces a forbidden response, not an empty successful view of another participant's data.
- Unsaved daily-check drafts are preserved locally until submitted; submitted entries display a clear timestamp and status.
- An emergency instruction remains visible on emergency education pages and uses no diagnostic scoring or decision engine.
- The first release uses seeded fictional accounts only. Real health data requires deployment-specific privacy, consent, retention, and hospital security review before use.

## Testing strategy

- Unit tests: password hashing, validation schemas, role guards, goal calculation helpers, and audit-log creation.
- API integration tests: login, logout, participant ownership, nurse assignment boundaries, admin-only routes, create/read daily checks, goals, feedback, and follow-up assessments.
- Frontend tests: route protection, form validation, each role's main dashboard, daily-check submission, and empty/error states.
- End-to-end smoke tests: sign in as each seeded role and complete the primary flow permitted to that role.

## First implementation slice

The initial build creates the workspace, database migrations, seeded fictional accounts, authentication, role authorization, the participant daily-check and goal flows, a nurse caseload/read-and-feedback flow, and an admin user/assignment overview. It includes the BE-FAST education and emergency escalation page. Reminder delivery, production deployment, analytics, and data export are deferred until the core permission and data flows have been verified.
