-- CreateTable
CREATE TABLE `User` (
    `id` CHAR(36) NOT NULL,
    `email` VARCHAR(254) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `displayName` VARCHAR(160) NOT NULL,
    `role` ENUM('PARTICIPANT', 'NURSE', 'ADMIN') NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ParticipantProfile` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `enrolmentDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `programmeStatus` VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ParticipantProfile_userId_key`(`userId`),
    INDEX `ParticipantProfile_programmeStatus_idx`(`programmeStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NurseParticipantAssignment` (
    `id` CHAR(36) NOT NULL,
    `nurseId` CHAR(36) NOT NULL,
    `participantId` CHAR(36) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endedAt` DATETIME(3) NULL,

    INDEX `NurseParticipantAssignment_participantId_isActive_idx`(`participantId`, `isActive`),
    UNIQUE INDEX `NurseParticipantAssignment_nurseId_participantId_isActive_key`(`nurseId`, `participantId`, `isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RiskProfile` (
    `id` CHAR(36) NOT NULL,
    `participantId` CHAR(36) NOT NULL,
    `factors` JSON NOT NULL,
    `notes` TEXT NULL,
    `assessedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `RiskProfile_participantId_key`(`participantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Goal` (
    `id` CHAR(36) NOT NULL,
    `participantId` CHAR(36) NOT NULL,
    `title` VARCHAR(160) NOT NULL,
    `behavior` TEXT NOT NULL,
    `frequency` INTEGER NOT NULL,
    `targetDate` DATETIME(3) NOT NULL,
    `status` ENUM('ACTIVE', 'COMPLETED', 'PAUSED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Goal_participantId_status_targetDate_idx`(`participantId`, `status`, `targetDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ObstaclePlan` (
    `id` CHAR(36) NOT NULL,
    `participantId` CHAR(36) NOT NULL,
    `goalId` CHAR(36) NULL,
    `trigger` TEXT NOT NULL,
    `response` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ObstaclePlan_participantId_createdAt_idx`(`participantId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DailyCheck` (
    `id` CHAR(36) NOT NULL,
    `participantId` CHAR(36) NOT NULL,
    `checkDate` DATE NOT NULL,
    `confidence` INTEGER NOT NULL,
    `activityMinutes` INTEGER NULL,
    `systolicBp` INTEGER NULL,
    `diastolicBp` INTEGER NULL,
    `medicationStatus` ENUM('TAKEN', 'MISSED', 'NOT_APPLICABLE') NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DailyCheck_participantId_createdAt_idx`(`participantId`, `createdAt`),
    UNIQUE INDEX `DailyCheck_participantId_checkDate_key`(`participantId`, `checkDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FollowUpAssessment` (
    `id` CHAR(36) NOT NULL,
    `participantId` CHAR(36) NOT NULL,
    `point` ENUM('T0', 'POST_ER', 'DAY_30', 'DAY_90') NOT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `completedAt` DATETIME(3) NULL,
    `answers` JSON NULL,

    INDEX `FollowUpAssessment_dueDate_completedAt_idx`(`dueDate`, `completedAt`),
    UNIQUE INDEX `FollowUpAssessment_participantId_point_key`(`participantId`, `point`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NurseFeedback` (
    `id` CHAR(36) NOT NULL,
    `participantId` CHAR(36) NOT NULL,
    `nurseId` CHAR(36) NOT NULL,
    `body` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `NurseFeedback_participantId_createdAt_idx`(`participantId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Reminder` (
    `id` CHAR(36) NOT NULL,
    `participantId` CHAR(36) NOT NULL,
    `label` VARCHAR(160) NOT NULL,
    `schedule` VARCHAR(100) NOT NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Reminder_participantId_isEnabled_idx`(`participantId`, `isEnabled`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `tokenHash` CHAR(64) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Session_tokenHash_key`(`tokenHash`),
    INDEX `Session_userId_expiresAt_idx`(`userId`, `expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` CHAR(36) NOT NULL,
    `actorId` CHAR(36) NULL,
    `action` VARCHAR(100) NOT NULL,
    `entityType` VARCHAR(100) NOT NULL,
    `entityId` CHAR(36) NULL,
    `summary` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_actorId_createdAt_idx`(`actorId`, `createdAt`),
    INDEX `AuditLog_entityType_entityId_createdAt_idx`(`entityType`, `entityId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ParticipantProfile` ADD CONSTRAINT `ParticipantProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NurseParticipantAssignment` ADD CONSTRAINT `NurseParticipantAssignment_nurseId_fkey` FOREIGN KEY (`nurseId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NurseParticipantAssignment` ADD CONSTRAINT `NurseParticipantAssignment_participantId_fkey` FOREIGN KEY (`participantId`) REFERENCES `ParticipantProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RiskProfile` ADD CONSTRAINT `RiskProfile_participantId_fkey` FOREIGN KEY (`participantId`) REFERENCES `ParticipantProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Goal` ADD CONSTRAINT `Goal_participantId_fkey` FOREIGN KEY (`participantId`) REFERENCES `ParticipantProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ObstaclePlan` ADD CONSTRAINT `ObstaclePlan_participantId_fkey` FOREIGN KEY (`participantId`) REFERENCES `ParticipantProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ObstaclePlan` ADD CONSTRAINT `ObstaclePlan_goalId_fkey` FOREIGN KEY (`goalId`) REFERENCES `Goal`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DailyCheck` ADD CONSTRAINT `DailyCheck_participantId_fkey` FOREIGN KEY (`participantId`) REFERENCES `ParticipantProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FollowUpAssessment` ADD CONSTRAINT `FollowUpAssessment_participantId_fkey` FOREIGN KEY (`participantId`) REFERENCES `ParticipantProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NurseFeedback` ADD CONSTRAINT `NurseFeedback_participantId_fkey` FOREIGN KEY (`participantId`) REFERENCES `ParticipantProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NurseFeedback` ADD CONSTRAINT `NurseFeedback_nurseId_fkey` FOREIGN KEY (`nurseId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reminder` ADD CONSTRAINT `Reminder_participantId_fkey` FOREIGN KEY (`participantId`) REFERENCES `ParticipantProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
