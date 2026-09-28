-- AlterTable
ALTER TABLE "User" ADD COLUMN     "email_verificado" BOOLEAN DEFAULT false,
ADD COLUMN     "token_expira_em" TIMESTAMP(6),
ADD COLUMN     "token_verificacao" VARCHAR(255);

-- Accounts created before e-mail confirmation existed keep working.
UPDATE "User" SET "email_verificado" = true;
