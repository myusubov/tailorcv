-- AlterTable
ALTER TABLE "resumes" ADD COLUMN     "idempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "resumes_userId_idempotencyKey_key" ON "resumes"("userId", "idempotencyKey");
