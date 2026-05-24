-- CreateTable
CREATE TABLE "UploadPreviewRow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "pageNumber" INTEGER,
    "awb" TEXT,
    "courier" TEXT,
    "sku" TEXT,
    "qty" INTEGER,
    "color" TEXT,
    "size" TEXT,
    "orderNo" TEXT,
    "productDescription" TEXT,
    "paymentType" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "rawData" TEXT,
    "issues" TEXT,
    "imported" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UploadPreviewRow_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "UploadBatch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "UploadPreviewRow_batchId_sourceType_idx" ON "UploadPreviewRow"("batchId", "sourceType");

-- CreateIndex
CREATE INDEX "UploadPreviewRow_batchId_awb_idx" ON "UploadPreviewRow"("batchId", "awb");

-- CreateIndex
CREATE INDEX "UploadPreviewRow_batchId_sku_idx" ON "UploadPreviewRow"("batchId", "sku");
