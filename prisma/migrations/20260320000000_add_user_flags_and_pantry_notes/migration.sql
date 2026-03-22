-- AlterTable: add email_verified and has_logged_in_before to users
ALTER TABLE "users" ADD COLUMN "email_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "has_logged_in_before" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: add notes to pantry_items
ALTER TABLE "pantry_items" ADD COLUMN "notes" TEXT;
