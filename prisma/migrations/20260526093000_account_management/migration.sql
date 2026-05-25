ALTER TABLE "Account" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "Account_active_idx" ON "Account"("active");
