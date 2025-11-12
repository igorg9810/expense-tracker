-- CreateTable
CREATE TABLE "ResetCode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResetCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ResetCode_code_key" ON "ResetCode"("code");

-- CreateIndex
CREATE INDEX "ResetCode_code_idx" ON "ResetCode"("code");

-- CreateIndex
CREATE INDEX "ResetCode_userId_idx" ON "ResetCode"("userId");
