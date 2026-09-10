export const roles = ["PARTICIPANT", "NURSE", "ADMIN"] as const;

export type Role = (typeof roles)[number];

export type ParticipantGoal = {
  id: string;
  title: string;
  behavior: string;
  frequency: number;
  targetDate: string;
  status: "ACTIVE" | "COMPLETED" | "PAUSED";
};

export type DailyCheck = {
  id: string;
  checkDate: string;
  confidence: number;
  activityMinutes?: number;
  systolicBp?: number;
  diastolicBp?: number;
  medicationStatus?: "TAKEN" | "MISSED" | "NOT_APPLICABLE";
  note?: string;
};

export type ApiError = {
  error: {
    code: string;
    message: string;
  };
};
