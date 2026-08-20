-- AlterTable
ALTER TABLE "chat_messages" ADD COLUMN     "metadata" JSONB;

-- AlterTable
-- Legacy OAuth connections cannot be converted into GitHub App installations.
-- Invalidate them so existing users reconnect through the new installation flow.
DELETE FROM "github_connections";

ALTER TABLE "github_connections" DROP COLUMN "accessToken",
DROP COLUMN "githubAvatarUrl",
DROP COLUMN "githubUserId",
DROP COLUMN "githubUsername",
DROP COLUMN "scopes",
ADD COLUMN     "installationAccessToken" TEXT NOT NULL,
ADD COLUMN     "installationAccessTokenExpiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "installationId" TEXT NOT NULL;
