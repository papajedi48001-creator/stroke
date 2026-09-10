import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("กรุณากรอกอีเมลให้ถูกต้อง").trim().toLowerCase(),
  password: z.string().min(12, "รหัสผ่านต้องมีอย่างน้อย 12 ตัวอักษร"),
});

export const createGoalSchema = z.object({
  title: z.string().trim().min(3, "กรุณาระบุเป้าหมาย").max(160),
  behavior: z.string().trim().min(3, "กรุณาระบุพฤติกรรมที่ต้องการทำ").max(500),
  frequency: z.number().int().min(1).max(21),
  targetDate: z.iso.date(),
  obstaclePlan: z
    .object({
      trigger: z.string().trim().min(3).max(500),
      response: z.string().trim().min(3).max(500),
    })
    .optional(),
});

export const createDailyCheckSchema = z
  .object({
    checkDate: z.iso.date(),
    confidence: z.number().int().min(0).max(10),
    activityMinutes: z.number().int().min(0).max(1440).optional(),
    systolicBp: z.number().int().min(50).max(300).optional(),
    diastolicBp: z.number().int().min(30).max(200).optional(),
    medicationStatus: z.enum(["TAKEN", "MISSED", "NOT_APPLICABLE"]).optional(),
    note: z.string().trim().max(1000).optional(),
  })
  .refine(
    (value) =>
      (value.systolicBp === undefined && value.diastolicBp === undefined) ||
      (value.systolicBp !== undefined && value.diastolicBp !== undefined),
    "กรุณาบันทึกค่าความดันทั้งบนและล่าง",
  );

export const feedbackSchema = z.object({
  body: z.string().trim().min(3, "กรุณาระบุข้อเสนอแนะ").max(2000),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type CreateDailyCheckInput = z.infer<typeof createDailyCheckSchema>;
export type FeedbackInput = z.infer<typeof feedbackSchema>;
