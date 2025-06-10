/*
  Warnings:

  - You are about to drop the column `description` on the `Expense` table. All the data in the column will be lost.
  - Added the required column `currency` to the `Expense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Expense` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Expense" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "amount" REAL NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Expense" ("amount", "category", "createdAt", "date", "id", "updatedAt") SELECT "amount", "category", "createdAt", "date", "id", "updatedAt" FROM "Expense";
DROP TABLE "Expense";
ALTER TABLE "new_Expense" RENAME TO "Expense";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
