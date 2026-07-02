-- DropIndex
DROP INDEX "Settlement_groupId_payerId_payeeId_key";

-- CreateIndex
CREATE INDEX "Settlement_groupId_payerId_payeeId_idx" ON "Settlement"("groupId", "payerId", "payeeId");
