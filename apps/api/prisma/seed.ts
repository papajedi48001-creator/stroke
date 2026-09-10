import argon2 from "argon2";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const developmentPassword = process.env.SEED_PASSWORD ?? "ExamplePassword123!";
  const passwordHash = await argon2.hash(developmentPassword, { type: argon2.argon2id });

  const [participant, nurse, admin] = await Promise.all([
    prisma.user.upsert({
      where: { email: "participant@example.test" },
      update: {},
      create: {
        email: "participant@example.test",
        displayName: "คุณสมชาย ตัวอย่าง",
        passwordHash,
        role: Role.PARTICIPANT,
      },
    }),
    prisma.user.upsert({
      where: { email: "nurse@example.test" },
      update: {},
      create: {
        email: "nurse@example.test",
        displayName: "พยาบาลมานี ตัวอย่าง",
        passwordHash,
        role: Role.NURSE,
      },
    }),
    prisma.user.upsert({
      where: { email: "admin@example.test" },
      update: {},
      create: {
        email: "admin@example.test",
        displayName: "ผู้ดูแลระบบ ตัวอย่าง",
        passwordHash,
        role: Role.ADMIN,
      },
    }),
  ]);

  const profile = await prisma.participantProfile.upsert({
    where: { userId: participant.id },
    update: {},
    create: { userId: participant.id },
  });

  await prisma.nurseParticipantAssignment.upsert({
    where: { nurseId_participantId_isActive: { nurseId: nurse.id, participantId: profile.id, isActive: true } },
    update: {},
    create: { nurseId: nurse.id, participantId: profile.id },
  });

  await prisma.riskProfile.upsert({
    where: { participantId: profile.id },
    update: {},
    create: { participantId: profile.id, factors: ["ความดันโลหิตสูง", "กิจกรรมทางกายไม่เพียงพอ"] },
  });

  const goal = await prisma.goal.findFirst({
    where: { participantId: profile.id, title: "เดินอย่างน้อย 30 นาที" },
  });

  if (!goal) {
    await prisma.goal.create({
      data: {
        participantId: profile.id,
        title: "เดินอย่างน้อย 30 นาที",
        behavior: "เดินในบริเวณที่ปลอดภัยครั้งละ 30 นาที",
        frequency: 5,
        targetDate: new Date("2026-12-31T00:00:00.000Z"),
      },
    });
  }

  await prisma.dailyCheck.upsert({
    where: {
      participantId_checkDate: {
        participantId: profile.id,
        checkDate: new Date("2026-09-10T00:00:00.000Z"),
      },
    },
    update: {},
    create: {
      participantId: profile.id,
      checkDate: new Date("2026-09-10T00:00:00.000Z"),
      confidence: 7,
      activityMinutes: 30,
      medicationStatus: "TAKEN",
    },
  });

  await prisma.auditLog.create({
    data: { actorId: admin.id, action: "SEED_CREATED", entityType: "DATABASE", summary: "สร้างข้อมูลตัวอย่างสำหรับการพัฒนา" },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
