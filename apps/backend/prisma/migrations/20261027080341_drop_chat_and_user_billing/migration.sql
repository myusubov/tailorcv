/*
  Warnings:

  - You are about to drop the column `creditsLimit` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `creditsUsed` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `plan` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `stripeCustomerId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `chat_conversations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `chat_messages` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "chat_conversations" DROP CONSTRAINT "chat_conversations_userId_fkey";

-- DropForeignKey
ALTER TABLE "chat_messages" DROP CONSTRAINT "chat_messages_conversationId_fkey";

-- DropIndex
DROP INDEX "users_stripeCustomerId_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "creditsLimit",
DROP COLUMN "creditsUsed",
DROP COLUMN "plan",
DROP COLUMN "stripeCustomerId";

-- DropTable
DROP TABLE "chat_conversations";

-- DropTable
DROP TABLE "chat_messages";

-- DropEnum
DROP TYPE "Plan";
